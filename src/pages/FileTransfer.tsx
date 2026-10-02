import { useEffect, useRef, useState } from 'react';
import {
  Alert,
  Box,
  Button,
  LinearProgress,
  Paper,
  Tab,
  Tabs,
  TextField,
  Typography,
} from '@mui/material';
import { Link } from 'react-router-dom';
import { Manifest, MAX_FILE_SIZE } from '../utils/rtcCrypto';
import { blobLimit, canStreamSave, SaveResult } from '../utils/rtcSave';
import { RtcTransfer, TransferCallbacks } from '../utils/rtcTransfer';

const fileSize = (size: number) =>
  size < 1024
    ? `${size} B`
    : size < 1024 * 1024
      ? `${(size / 1024).toFixed(1)} KiB`
      : `${(size / 1024 / 1024).toFixed(1)} MiB`;

function TransferPane({ sending }: { sending: boolean }) {
  const session = useRef<RtcTransfer>();
  const fileInput = useRef<HTMLInputElement>(null);
  const alive = useRef(true);
  const downloadUrl = useRef<string>();
  const [code, setCode] = useState('');
  const [status, setStatus] = useState('');
  const [error, setError] = useState(false);
  const [busy, setBusy] = useState(false);
  const [progress, setProgress] = useState(0);
  const [manifest, setManifest] = useState<Manifest>();
  const [accepting, setAccepting] = useState(false);
  const [accepted, setAccepted] = useState(false);
  const [result, setResult] = useState<SaveResult>();

  useEffect(() => {
    alive.current = true;
    const unload = () => session.current?.cancel();
    window.addEventListener('pagehide', unload);
    return () => {
      alive.current = false;
      window.removeEventListener('pagehide', unload);
      session.current?.cancel();
      if (downloadUrl.current) URL.revokeObjectURL(downloadUrl.current);
    };
  }, []);

  function start() {
    const file = fileInput.current?.files?.[0];
    if (sending && !file) {
      setError(true);
      setStatus('请选择文件');
      return;
    }
    session.current?.cancel();
    if (downloadUrl.current) URL.revokeObjectURL(downloadUrl.current);
    downloadUrl.current = undefined;
    setBusy(true);
    setError(false);
    setProgress(0);
    setManifest(undefined);
    setResult(undefined);
    setAccepted(false);
    setStatus(sending ? '正在创建安全会话…' : '正在加入安全会话…');
    const active = () => alive.current && session.current === transfer;
    const callbacks: TransferCallbacks = {
      status: (value) => {
        if (active()) setStatus(value);
      },
      progress: (value) => {
        if (active()) setProgress(value);
      },
      code: (value) => {
        if (active()) setCode(value);
      },
      file: (value) => {
        if (active()) setManifest(value);
      },
      complete: (value) => {
        if (!active()) {
          if (value?.url) URL.revokeObjectURL(value.url);
          return;
        }
        setBusy(false);
        setProgress(100);
        setManifest(undefined);
        setStatus(
          sending
            ? '发送完成，接收方已确认接收全部数据'
            : value?.streamed
              ? '接收完成，文件已保存'
              : '接收完成，请下载文件'
        );
        setResult(value);
        downloadUrl.current = value?.url;
      },
      error: (value) => {
        if (active()) {
          setBusy(false);
          setError(true);
          setStatus(value);
          setManifest(undefined);
        }
      },
    };
    const transfer = new RtcTransfer(callbacks);
    session.current = transfer;
    if (sending) {
      setCode('');
      void transfer.send(file!);
    } else void transfer.receive(code);
  }

  function cancel() {
    session.current?.cancel();
    setBusy(false);
    setManifest(undefined);
    setAccepted(false);
    setStatus('已取消传输');
    setError(false);
  }
  async function accept() {
    const transfer = session.current;
    setAccepting(true);
    const received = await transfer?.accept();
    if (alive.current && session.current === transfer) {
      setAccepting(false);
      setAccepted(!!received);
    }
  }

  return (
    <Paper sx={{ p: { xs: 2, sm: 3 }, mt: 2 }}>
      <Typography variant="h6">{sending ? '发送文件' : '接收文件'}</Typography>
      {sending ? (
        <>
          <Typography variant="body2" color="text.secondary" sx={{ my: 2 }}>
            登录后发送，单文件最多 {fileSize(MAX_FILE_SIZE)}。
          </Typography>
          <input
            ref={fileInput}
            type="file"
            aria-label="选择要发送的文件"
            disabled={busy}
            style={{ maxWidth: '100%' }}
          />
        </>
      ) : (
        <TextField
          label="配对码"
          value={code}
          onChange={(event) => setCode(event.target.value)}
          fullWidth
          disabled={busy}
          sx={{ mt: 2 }}
          inputProps={{
            autoCapitalize: 'characters',
            autoComplete: 'off',
            spellCheck: false,
          }}
        />
      )}
      <Box sx={{ mt: 2, display: 'flex', gap: 1 }}>
        <Button variant="contained" onClick={start} disabled={busy}>
          {sending ? '生成配对码并发送' : '加入会话'}
        </Button>
        {busy && (
          <Button color="error" onClick={cancel}>
            取消传输
          </Button>
        )}
      </Box>
      {sending && code && (
        <Box sx={{ mt: 2 }}>
          <Typography variant="body2">
            将配对码通过可信渠道发送给接收方：
          </Typography>
          <Typography
            data-testid="pairing-code"
            sx={{
              mt: 1,
              fontFamily: 'monospace',
              overflowWrap: 'anywhere',
              fontSize: 18,
            }}
          >
            {code}
          </Typography>
          <Button
            size="small"
            onClick={() =>
              void navigator.clipboard
                .writeText(code)
                .then(() => setStatus('配对码已复制'))
                .catch(() => setStatus('无法访问剪贴板，请手动复制配对码'))
            }
          >
            复制配对码
          </Button>
        </Box>
      )}
      {manifest && !accepted && (
        <Box sx={{ mt: 2 }}>
          <Typography sx={{ overflowWrap: 'anywhere' }}>
            文件：{manifest.name}（{fileSize(manifest.size)}）
          </Typography>
          {!canStreamSave() && (
            <Typography variant="body2" color="text.secondary">
              当前浏览器接收上限为 {fileSize(blobLimit())}，接收完成后点击下载。
            </Typography>
          )}
          <Button
            variant="contained"
            disabled={accepting}
            onClick={() => void accept()}
            sx={{ mt: 1 }}
          >
            {canStreamSave() ? '选择保存位置并接收' : '确认接收文件'}
          </Button>
        </Box>
      )}
      {(busy || progress > 0) && (
        <Box sx={{ mt: 2 }}>
          <LinearProgress variant="determinate" value={progress} />
          <Typography variant="body2" sx={{ mt: 1 }}>
            进度：{progress}%
          </Typography>
        </Box>
      )}
      {result?.url && (
        <Button
          component="a"
          href={result.url}
          download={result.name}
          variant="contained"
          sx={{ mt: 2 }}
        >
          下载文件
        </Button>
      )}
      {status && (
        <Alert sx={{ mt: 2 }} severity={error ? 'error' : 'info'}>
          {status}
        </Alert>
      )}
    </Paper>
  );
}

export default function FileTransfer() {
  const [tab, setTab] = useState(0);
  return (
    <Box sx={{ maxWidth: 720, mx: 'auto', p: { xs: 2, sm: 3 } }}>
      <Button component={Link} to="/" sx={{ mb: 1 }}>
        返回首页
      </Button>
      <Typography variant="h4">WebRTC 文件传输</Typography>
      <Typography color="text.secondary" sx={{ mt: 1 }}>
        通过互联网端对端加密传输。双方需保持页面打开，文件不会保存到服务器。
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
        断线后自动重连并续传。刷新或关闭页面后需要重新配对；部分网络需要配置
        WebRTC TURN 中继才能连接。
      </Typography>
      <Tabs value={tab} onChange={(_, value) => setTab(value)} sx={{ mt: 3 }}>
        <Tab label="发送" />
        <Tab label="接收" />
      </Tabs>
      <TransferPane key={tab} sending={tab === 0} />
    </Box>
  );
}
