import {
  CHUNK_SIZE,
  FRAME_SIZE,
  createFileContext,
  displayPairingCode,
  encodeFrame,
  FileContext,
  generatePairingCode,
  Manifest,
  normalizeCode,
  openFileContext,
  randomToken,
  readApplicationToken,
  roomIdForCode,
  sha256,
  Signal,
  validateSignal,
  sealFileEnvelope,
} from './rtcCrypto';
import {
  ChunkAssembler,
  ControlMessage,
  parseControl,
  resumeIndex,
} from './rtcProtocol';
import { createSink, FileSink, SaveResult } from './rtcSave';
import {
  delay,
  getIceServers,
  getSignals,
  rtcRequest,
  sendSignal,
  SignalingError,
} from './rtcSignalingApi';
import { CryptoWorker } from './rtcWorker';
import {
  createPakeConfirmation,
  createPakeEphemeral,
  decodePakeBytes,
  derivePakeSessionKey,
  encodePakeBytes,
  pakeSid,
  verifyPakeConfirmation,
} from './rtcPake';
import { ControlInbox, sendControl } from './rtcControl';

interface Room {
  roomId: string;
  token: string;
  code: string;
}
export interface TransferCallbacks {
  status(value: string): void;
  progress(value: number): void;
  code?(value: string): void;
  file?(value: Manifest): void;
  complete(result?: SaveResult): void;
  error(message: string): void;
  phase?(message: string): void;
}
class ConnectionLost extends Error {}
class ProtocolError extends Error {}
const errorText = (error: unknown) =>
  error instanceof Error ? error.message : '文件传输失败';
const cancellation = () => new DOMException('已取消传输', 'AbortError');
const fatal = (error: unknown) =>
  error instanceof ProtocolError ||
  (error instanceof SignalingError && error.status < 500);

function checkedSend(channel: RTCDataChannel, data: string | ArrayBuffer) {
  if (channel.readyState !== 'open') throw new ConnectionLost('连接已断开');
  if (typeof data === 'string') channel.send(data);
  else channel.send(data);
}
function control(channel: RTCDataChannel, message: ControlMessage) {
  checkedSend(channel, JSON.stringify(message));
}
function waitUntil(
  check: () => boolean,
  signal: AbortSignal,
  timeout: number,
  message: string
) {
  const start = Date.now();
  return (async () => {
    while (!check()) {
      if (signal.aborted) throw signal.reason;
      if (Date.now() - start > timeout) throw new ConnectionLost(message);
      await delay(40, signal);
    }
    if (signal.aborted) throw signal.reason;
  })();
}
function watchPeer(pc: RTCPeerConnection, lifetime: AbortSignal) {
  const attempt = new AbortController();
  const abort = () => attempt.abort(lifetime.reason);
  lifetime.addEventListener('abort', abort, { once: true });
  let disconnected: ReturnType<typeof setTimeout> | undefined;
  pc.onconnectionstatechange = () => {
    clearTimeout(disconnected);
    if (pc.connectionState === 'failed' || pc.connectionState === 'closed')
      attempt.abort(new ConnectionLost('连接已断开'));
    if (pc.connectionState === 'disconnected')
      disconnected = setTimeout(
        () => attempt.abort(new ConnectionLost('网络已断开')),
        5000
      );
  };
  attempt.signal.addEventListener(
    'abort',
    () => {
      clearTimeout(disconnected);
      lifetime.removeEventListener('abort', abort);
    },
    { once: true }
  );
  if (lifetime.aborted) abort();
  return attempt;
}

/** Keeps all capabilities, file keys and resume state in this page's memory. */
export class RtcTransfer {
  private lifetime = new AbortController();
  private room?: Room;
  private pc?: RTCPeerConnection;
  private channel?: RTCDataChannel;
  private attempt?: AbortController;
  private worker?: CryptoWorker;
  private context?: FileContext;
  private sink?: FileSink;
  private assembler?: ChunkAssembler;
  private receiveQueue: Promise<void> = Promise.resolve();
  private pendingRemoteCandidates: RTCIceCandidateInit[] = [];
  private pakeKey?: Uint8Array;
  private saved?: SaveResult;
  private completed = false;
  private generation = 0;
  private terminalTimer?: ReturnType<typeof setTimeout>;
  private startedAt = performance.now();

  constructor(private callbacks: TransferCallbacks) {}
  get stopped() {
    return this.lifetime.signal.aborted;
  }
  private ensureActive() {
    if (this.stopped) throw this.lifetime.signal.reason;
  }
  private notifyStatus(value: string) {
    if (!this.stopped) this.callbacks.status(value);
  }
  private markPhase(value: string) {
    if (!this.stopped)
      this.callbacks.phase?.(
        `${value} · ${((performance.now() - this.startedAt) / 1000).toFixed(1)} 秒`
      );
  }
  private async reportSelectedCandidatePair(pc: RTCPeerConnection) {
    try {
      const stats = await pc.getStats();
      const transport = [...stats.values()].find(
        (item) => item.type === 'transport' && item.selectedCandidatePairId
      );
      const pairId = transport?.selectedCandidatePairId;
      const pair = pairId
        ? stats.get(pairId)
        : [...stats.values()].find(
            (item) =>
              item.type === 'candidate-pair' &&
              item.state === 'succeeded' &&
              item.nominated
          );
      if (!pair) {
        this.markPhase('ICE 已连接（未读取到候选对）');
        return;
      }
      const local =
        stats.get(pair.localCandidateId)?.candidateType || 'unknown';
      const remote =
        stats.get(pair.remoteCandidateId)?.candidateType || 'unknown';
      this.markPhase(`ICE 通路 ${local} ↔ ${remote}`);
    } catch {
      this.markPhase('ICE 已连接');
    }
  }

  private async makeRoom(code: string, sender: boolean) {
    const room = {
      code,
      roomId: await roomIdForCode(code),
      token: randomToken(),
    };
    this.ensureActive();
    // Keep the capability before POST, so cancellation can clean up a lost response.
    this.room = room;
    await rtcRequest(
      sender ? 'rooms' : 'rooms/join',
      sender ? readApplicationToken() : room.token,
      sender
        ? {
            roomId: room.roomId,
            tokenHash: await sha256(room.token),
            verifier: await sha256(randomToken()),
          }
        : { roomId: room.roomId, tokenHash: await sha256(room.token) },
      this.lifetime.signal
    );
    this.ensureActive();
    this.worker = new CryptoWorker();
    void this.heartbeat().catch((error) => this.fail(error));
    return room;
  }

  private async heartbeat() {
    while (!this.stopped && this.room) {
      await delay(30000, this.lifetime.signal);
      await rtcRequest(
        `rooms/${this.room.roomId}/heartbeat`,
        this.room.token,
        {},
        this.lifetime.signal
      );
    }
  }

  private resetPeer() {
    this.attempt?.abort(new ConnectionLost('正在重新连接'));
    if (this.channel) {
      this.channel.onclose = null;
      this.channel.onmessage = null;
      this.channel.close();
    }
    if (this.pc) {
      this.pc.onconnectionstatechange = null;
      this.pc.ondatachannel = null;
      this.pc.close();
    }
    this.channel = undefined;
    this.pc = undefined;
  }

  private newPeer(iceServers: RTCIceServer[]) {
    this.ensureActive();
    this.resetPeer();
    this.pendingRemoteCandidates = [];
    const pc = new RTCPeerConnection({ iceServers, iceCandidatePoolSize: 4 });
    this.pc = pc;
    this.attempt = watchPeer(pc, this.lifetime.signal);
    pc.addEventListener('connectionstatechange', () => {
      if (pc.connectionState === 'connected')
        void this.reportSelectedCandidatePair(pc);
    });
    pc.addEventListener('icecandidateerror', (event) => {
      const error = event as RTCPeerConnectionIceErrorEvent;
      this.markPhase(`ICE 候选错误 ${error.errorCode}`);
    });
    return pc;
  }

  private bindChannel(channel: RTCDataChannel, attempt: AbortController) {
    channel.binaryType = 'arraybuffer';
    channel.bufferedAmountLowThreshold = 256 * 1024;
    this.channel = channel;
    channel.onclose = () => attempt.abort(new ConnectionLost('数据通道已断开'));
    channel.onerror = () =>
      attempt.abort(new ConnectionLost('数据通道发生错误'));
  }

  private async publish(
    pc: RTCPeerConnection,
    generation: number,
    role: 'sender' | 'receiver',
    signal: AbortSignal
  ) {
    const room = this.room!;
    const value: Signal = {
      version: 2,
      roomId: room.roomId,
      generation,
      role,
      type: role === 'sender' ? 'offer' : 'answer',
      nonce: crypto.randomUUID(),
      sdp: pc.localDescription?.sdp || '',
    };
    await sendSignal(room.roomId, room.token, value, signal);
  }

  private async publishCandidate(
    generation: number,
    role: 'sender' | 'receiver',
    candidate: RTCIceCandidateInit,
    signal: AbortSignal
  ) {
    const room = this.room!;
    const value: Signal = {
      version: 2,
      roomId: room.roomId,
      generation,
      role,
      type: 'candidate',
      nonce: crypto.randomUUID(),
      sdp: '',
      candidate,
    };
    await sendSignal(room.roomId, room.token, value, signal);
  }

  private startTrickle(
    pc: RTCPeerConnection,
    generation: number,
    role: 'sender' | 'receiver',
    signal: AbortSignal,
    attempt: AbortController
  ) {
    let descriptionPublished = false;
    let queued: RTCIceCandidateInit[] = [];
    let publishChain = Promise.resolve();
    const append = (candidate: RTCIceCandidateInit) => {
      publishChain = publishChain.then(() =>
        this.publishCandidate(generation, role, candidate, signal)
      );
      void publishChain.catch((error) => {
        if (!signal.aborted) attempt.abort(error);
      });
    };
    pc.onicecandidate = (event) => {
      if (!event.candidate) return;
      const candidate = event.candidate.toJSON();
      if (descriptionPublished) append(candidate);
      else queued.push(candidate);
    };
    return async () => {
      await this.publish(pc, generation, role, signal);
      descriptionPublished = true;
      const pending = queued;
      queued = [];
      for (const candidate of pending) append(candidate);
      await publishChain;
    };
  }

  private async poll(
    onSignal: (value: Signal) => Promise<void>,
    signal: AbortSignal
  ) {
    let after = 0;
    let failures = 0;
    while (!signal.aborted) {
      try {
        const room = this.room!;
        const result = await getSignals(room.roomId, room.token, after, signal);
        for (const event of result.events) {
          const value = JSON.parse(event.payload) as Signal;
          try {
            validateSignal(value, room.roomId);
          } catch {
            throw new ProtocolError('信令认证失败，已停止传输');
          }
          await onSignal(value);
          after = Math.max(after, event.seq);
        }
        failures = 0;
      } catch (error) {
        if (signal.aborted) throw signal.reason;
        if (fatal(error) || ++failures >= 5) throw error;
      }
      await delay(this.channel?.readyState === 'open' ? 1500 : 300, signal);
    }
  }

  async send(file: File) {
    try {
      if (!window.isSecureContext || !window.RTCPeerConnection)
        throw new Error('请使用支持 WebRTC 的浏览器，通过 HTTPS 打开此页面');
      // Validate the file and login before occupying a room.
      readApplicationToken();
      const code = generatePairingCode();
      this.context = await createFileContext(file);
      this.ensureActive();
      const room = await this.makeRoom(code, true);
      this.callbacks.code?.(displayPairingCode(code));
      this.markPhase('发送房间已创建');
      this.notifyStatus('配对码已生成，等待接收方连接（10 分钟内有效）…');
      const ice = await getIceServers(
        room.roomId,
        room.token,
        this.lifetime.signal
      );
      for (let generation = 1; generation <= 8; generation++) {
        this.ensureActive();
        try {
          await this.sendAttempt(file, ice.iceServers, generation);
          this.ensureActive();
          this.completed = true;
          this.callbacks.progress(100);
          this.callbacks.complete();
          this.stop();
          return;
        } catch (error) {
          if (this.stopped || fatal(error)) throw error;
          this.resetPeer();
          if (generation === 8)
            throw new Error('重连次数已用完，请重新生成配对码');
          this.notifyStatus(
            `连接中断，正在第 ${generation} 次重连；接收方保留已保存的部分…`
          );
          await delay(1000 * Math.min(generation, 3), this.lifetime.signal);
        }
      }
    } catch (error) {
      this.fail(error);
    }
  }

  private async senderPake(
    channel: RTCDataChannel,
    inbox: ControlInbox,
    signal: AbortSignal
  ) {
    const sid = crypto.getRandomValues(new Uint8Array(32));
    const state = await createPakeEphemeral(
      this.room!.code,
      sid,
      this.room!.roomId,
      'sender'
    );
    sendControl(channel, {
      type: 'pake-init',
      sid: encodePakeBytes(sid),
      share: encodePakeBytes(state.share),
    });
    const peer = await inbox.take('pake-share', signal);
    if (
      peer.role !== 'receiver' ||
      peer.sid !== encodePakeBytes(sid) ||
      !peer.share
    )
      throw new ProtocolError('配对握手无效');
    const isk = derivePakeSessionKey(state, decodePakeBytes(peer.share, 32));
    const confirmation = await createPakeConfirmation(isk, 'sender');
    sendControl(channel, {
      type: 'pake-confirm',
      role: 'sender',
      confirmation,
    });
    const response = await inbox.take('pake-confirm', signal);
    if (response.role !== 'receiver' || !response.confirmation)
      throw new ProtocolError('配对码验证失败');
    await verifyPakeConfirmation(isk, 'receiver', response.confirmation);
    this.pakeKey?.fill(0);
    this.pakeKey = isk;
    this.markPhase('配对码验证完成');
  }

  private async receiverPake(
    channel: RTCDataChannel,
    inbox: ControlInbox,
    init: ControlMessage,
    signal: AbortSignal
  ) {
    if (!init.sid || !init.share) throw new ProtocolError('配对握手无效');
    const sid = pakeSid(init.sid);
    const state = await createPakeEphemeral(
      this.room!.code,
      sid,
      this.room!.roomId,
      'receiver'
    );
    sendControl(channel, {
      type: 'pake-share',
      role: 'receiver',
      sid: init.sid,
      share: encodePakeBytes(state.share),
    });
    const isk = derivePakeSessionKey(state, decodePakeBytes(init.share, 32));
    const confirmation = await inbox.take('pake-confirm', signal);
    if (confirmation.role !== 'sender' || !confirmation.confirmation)
      throw new ProtocolError('配对码验证失败');
    await verifyPakeConfirmation(isk, 'sender', confirmation.confirmation);
    sendControl(channel, {
      type: 'pake-confirm',
      role: 'receiver',
      confirmation: await createPakeConfirmation(isk, 'receiver'),
    });
    this.pakeKey?.fill(0);
    this.pakeKey = isk;
    this.markPhase('配对码验证完成');
  }

  private async sendAttempt(
    file: File,
    iceServers: RTCIceServer[],
    generation: number
  ) {
    const pc = this.newPeer(iceServers);
    const attempt = this.attempt!;
    const channel = pc.createDataChannel('file', { ordered: true });
    this.bindChannel(channel, attempt);
    const signal = attempt.signal;
    const context = this.context!;
    const flushRemoteCandidates: RTCIceCandidateInit[] = [];
    const inbox = new ControlInbox();
    const publishOfferAndCandidates = this.startTrickle(
      pc,
      generation,
      'sender',
      signal,
      attempt
    );
    let expected: 'ready' | 'ack' | 'saved' | undefined;
    let result: ControlMessage | undefined;
    let ackIndex = -1;
    channel.onmessage = (event) => {
      try {
        if (typeof event.data !== 'string')
          throw new ProtocolError('收到无效响应');
        const message = parseControl(event.data);
        if (message.type.startsWith('pake-')) {
          inbox.push(event.data);
          return;
        }
        if (message.type === 'cancel' || message.type === 'error')
          throw new ProtocolError('接收方已取消或拒绝传输');
        if (
          message.type !== expected ||
          (message.type === 'ack' && message.index !== ackIndex)
        )
          throw new ProtocolError('确认消息不匹配');
        result = message;
      } catch (error) {
        attempt.abort(
          error instanceof ProtocolError
            ? error
            : new ProtocolError(errorText(error))
        );
      }
    };
    const response = async (
      type: 'ready' | 'ack' | 'saved',
      send: () => Promise<void> | void,
      timeout = 60000
    ) => {
      expected = type;
      result = undefined;
      await send();
      await waitUntil(
        () => result !== undefined,
        signal,
        timeout,
        '等待对端确认超时'
      );
      expected = undefined;
      return result!;
    };
    try {
      const polling = this.poll(async (value) => {
        if (value.generation !== generation || value.role !== 'receiver')
          return;
        if (value.type === 'answer' && !pc.remoteDescription) {
          await pc.setRemoteDescription({ type: 'answer', sdp: value.sdp });
          this.markPhase('Answer 已接收');
          while (flushRemoteCandidates.length)
            await pc.addIceCandidate(flushRemoteCandidates.shift()!);
        } else if (value.type === 'candidate') {
          if (pc.remoteDescription) await pc.addIceCandidate(value.candidate!);
          else flushRemoteCandidates.push(value.candidate!);
        }
      }, signal).catch((error) => {
        if (!signal.aborted) attempt.abort(error);
      });
      await pc.setLocalDescription(await pc.createOffer());
      await publishOfferAndCandidates();
      this.markPhase('Offer 已发送，正在协商 ICE');
      await waitUntil(
        () => channel.readyState === 'open',
        signal,
        generation === 1 ? 600000 : 90000,
        '连接超时：请确认双方在线；当前网络可能需要 TURN'
      );
      await this.senderPake(channel, inbox, signal);
      const envelope = await sealFileEnvelope(context, this.pakeKey!);
      const ready = await response(
        'ready',
        () => control(channel, { type: 'hello', envelope }),
        600000
      );
      const next = resumeIndex(ready.nextChunk, context.manifest.chunks);
      this.callbacks.progress(
        Math.floor((next / context.manifest.chunks) * 100)
      );
      this.notifyStatus('已建立加密连接，正在发送…');
      for (let index = next; index < context.manifest.chunks; index++) {
        ackIndex = index;
        await response('ack', async () => {
          const plain = await file
            .slice(index * CHUNK_SIZE, (index + 1) * CHUNK_SIZE)
            .arrayBuffer();
          const cipher = new Uint8Array(
            await this.worker!.run('encrypt', context, index, plain)
          );
          for (
            let offset = 0;
            offset < cipher.length;
            offset += FRAME_SIZE - 12
          ) {
            await waitUntil(
              () => channel.bufferedAmount < 1024 * 1024,
              signal,
              30000,
              '发送缓冲区超时'
            );
            checkedSend(
              channel,
              encodeFrame(
                index,
                offset,
                cipher.length,
                cipher.subarray(offset, offset + FRAME_SIZE - 12)
              )
            );
          }
        });
        this.callbacks.progress(
          Math.min(
            99,
            Math.floor(((index + 1) / context.manifest.chunks) * 100)
          )
        );
      }
      this.notifyStatus('数据已发送，等待接收方保存完成…');
      await response('saved', () => control(channel, { type: 'complete' }));
      attempt.abort();
      await polling;
    } catch (error) {
      if (signal.aborted && !this.stopped) throw signal.reason;
      throw error instanceof ConnectionLost || error instanceof SignalingError
        ? error
        : new ProtocolError(errorText(error));
    } finally {
      attempt.abort();
    }
  }

  async receive(pairingCode: string) {
    try {
      if (!window.isSecureContext || !window.RTCPeerConnection)
        throw new Error('请使用支持 WebRTC 的浏览器，通过 HTTPS 打开此页面');
      const room = await this.makeRoom(normalizeCode(pairingCode), false);
      this.markPhase('接收房间已加入');
      const ice = await getIceServers(
        room.roomId,
        room.token,
        this.lifetime.signal
      );
      this.notifyStatus('配对成功，正在建立加密连接…');
      this.terminalTimer = setTimeout(
        () => this.fail(new Error('会话已超过两小时，请重新配对')),
        7200000
      );
      await this.poll(async (value) => {
        if (
          value.generation > this.generation &&
          value.role === 'sender' &&
          value.type === 'offer'
        ) {
          this.generation = value.generation;
          await this.receiveOffer(value, ice.iceServers);
        } else if (
          value.generation === this.generation &&
          value.role === 'sender' &&
          value.type === 'candidate'
        ) {
          const pc = this.pc;
          if (pc?.remoteDescription) await pc.addIceCandidate(value.candidate!);
          else if (pc) this.pendingRemoteCandidates.push(value.candidate!);
        }
      }, this.lifetime.signal);
    } catch (error) {
      if (this.completed) this.stop(false);
      else this.fail(error);
    }
  }

  private async receiveOffer(value: Signal, iceServers: RTCIceServer[]) {
    const pc = this.newPeer(iceServers);
    const attempt = this.attempt!;
    const flushRemoteCandidates: RTCIceCandidateInit[] = [];
    const publishAnswerAndCandidates = this.startTrickle(
      pc,
      value.generation,
      'receiver',
      attempt.signal,
      attempt
    );
    // Serialize new hello behind any old write, including an ACK lost on disconnect.
    pc.ondatachannel = (event) => {
      const channel = event.channel;
      if (
        channel.label !== 'file' ||
        channel.ordered !== true ||
        this.channel
      ) {
        this.fail(new ProtocolError('数据通道无效'));
        return;
      }
      this.bindChannel(channel, attempt);
      const inbox = new ControlInbox();
      channel.onmessage = (message) => {
        if (typeof message.data === 'string') {
          try {
            const controlMessage = parseControl(message.data);
            if (controlMessage.type.startsWith('pake-')) {
              inbox.push(message.data);
              if (controlMessage.type === 'pake-init')
                void this.receiverPake(
                  channel,
                  inbox,
                  controlMessage,
                  attempt.signal
                ).catch((error) => {
                  if (!attempt.signal.aborted && channel === this.channel)
                    this.fail(new ProtocolError(errorText(error)));
                });
              return;
            }
          } catch (error) {
            this.fail(error);
            return;
          }
        }
        this.receiveQueue = this.receiveQueue
          .then(async () => {
            if (this.stopped || channel !== this.channel) return;
            await this.receiveMessage(channel, message.data);
          })
          .catch((error) => {
            if (error instanceof ConnectionLost || attempt.signal.aborted)
              return;
            this.fail(new ProtocolError(errorText(error)));
          });
      };
      attempt.signal.addEventListener(
        'abort',
        () => {
          if (!this.completed && !this.stopped && this.channel === channel)
            this.notifyStatus('连接中断，正在自动重连…');
        },
        { once: true }
      );
    };
    try {
      await pc.setRemoteDescription({ type: 'offer', sdp: value.sdp });
      while (this.pendingRemoteCandidates.length)
        await pc.addIceCandidate(this.pendingRemoteCandidates.shift()!);
      while (flushRemoteCandidates.length)
        await pc.addIceCandidate(flushRemoteCandidates.shift()!);
      await pc.setLocalDescription(await pc.createAnswer());
      await publishAnswerAndCandidates();
      this.markPhase('Answer 已发送，正在协商 ICE');
    } catch (error) {
      if (!attempt.signal.aborted || fatal(error)) throw error;
    }
  }

  private async receiveMessage(
    channel: RTCDataChannel,
    data: string | ArrayBuffer
  ) {
    if (typeof data === 'string') {
      const message = parseControl(data);
      if (message.type === 'cancel' || message.type === 'error')
        throw new ProtocolError('发送方已取消传输');
      if (message.type === 'hello') {
        if (!this.pakeKey) throw new ProtocolError('配对密钥尚未建立');
        const context = await openFileContext(this.pakeKey, message.envelope!);
        if (
          this.context &&
          (this.context.keyFingerprint !== context.keyFingerprint ||
            JSON.stringify(this.context.manifest) !==
              JSON.stringify(context.manifest))
        )
          throw new ProtocolError('续传文件身份不匹配');
        this.context ??= context;
        this.assembler ??= new ChunkAssembler(context);
        this.assembler.reset();
        if (this.saved) {
          control(channel, {
            type: 'ready',
            nextChunk: this.assembler.nextChunk,
          });
          return;
        }
        if (!this.sink) {
          this.callbacks.file?.(context.manifest);
          this.notifyStatus('配对成功，准备接收文件…');
          this.sink = await createSink(context.manifest, { deferPicker: true });
        }
        control(channel, {
          type: 'ready',
          nextChunk: this.assembler.nextChunk,
        });
        this.notifyStatus(`正在接收：${context.manifest.name}`);
        return;
      }
      if (message.type === 'complete') {
        if (
          !this.context ||
          !this.sink ||
          this.assembler?.nextChunk !== this.context.manifest.chunks
        )
          throw new ProtocolError('文件不完整');
        if (!this.saved) {
          this.saved = await this.sink.finish();
          this.completed = true;
          this.callbacks.progress(100);
          this.callbacks.complete(this.saved);
          clearTimeout(this.terminalTimer);
          this.terminalTimer = setTimeout(() => this.stop(false), 120000);
        }
        control(channel, { type: 'saved' });
        return;
      }
      throw new ProtocolError('收到无效控制消息');
    }
    if (
      !(data instanceof ArrayBuffer) ||
      !this.context ||
      !this.sink ||
      this.saved ||
      !this.assembler
    )
      throw new ProtocolError('文件数据到达时尚未准备接收');
    const cipher = this.assembler.push(data);
    if (!cipher) return;
    const index = this.assembler.nextChunk;
    const plain = await this.worker!.run(
      'decrypt',
      this.context,
      index,
      cipher
    );
    this.ensureActive();
    await this.sink.write(new Uint8Array(plain));
    this.assembler.commit();
    if (this.assembler.nextChunk === 1)
      this.markPhase('首个文件块已认证并写入');
    this.callbacks.progress(
      Math.min(
        99,
        Math.floor(
          (this.assembler.nextChunk / this.context.manifest.chunks) * 100
        )
      )
    );
    control(channel, { type: 'ack', index });
  }

  /** Transfer starts immediately; save location is selected after completion. */
  get completedFile() {
    return this.saved;
  }

  cancel() {
    if (this.channel?.readyState === 'open') {
      try {
        control(this.channel, { type: 'cancel' });
      } catch {
        /* Closing still cancels the session. */
      }
    }
    this.stop();
  }

  private fail(error: unknown) {
    if (this.stopped) return;
    if (this.completed) {
      this.stop(false);
      return;
    }
    if (this.channel?.readyState === 'open') {
      try {
        control(this.channel, { type: 'error' });
      } catch {
        /* Cleanup follows. */
      }
    }
    this.callbacks.error(errorText(error));
    this.stop();
  }

  private stop(closeRoom = true) {
    if (this.stopped) return;
    this.lifetime.abort(cancellation());
    clearTimeout(this.terminalTimer);
    this.resetPeer();
    this.worker?.dispose();
    this.pakeKey?.fill(0);
    this.pakeKey = undefined;
    void this.receiveQueue
      .then(() => this.sink?.abort())
      .catch(() => undefined);
    if (closeRoom && this.room) {
      // Best effort on unload; room leases also bound abandoned sessions.
      void fetch(`/api/rtc/rooms/${this.room.roomId}/close`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${this.room.token}` },
        keepalive: true,
      }).catch(() => undefined);
    }
  }
}
