import { useEffect, useRef, useState } from 'react';
import {
  Alert,
  Box,
  Button,
  Chip,
  LinearProgress,
  Paper,
  Tab,
  Tabs,
  TextField,
  Typography,
} from '@mui/material';
import ArrowBackRoundedIcon from '@mui/icons-material/ArrowBackRounded';
import CheckCircleRoundedIcon from '@mui/icons-material/CheckCircleRounded';
import ContentCopyRoundedIcon from '@mui/icons-material/ContentCopyRounded';
import DownloadRoundedIcon from '@mui/icons-material/DownloadRounded';
import FileUploadRoundedIcon from '@mui/icons-material/FileUploadRounded';
import LockRoundedIcon from '@mui/icons-material/LockRounded';
import SaveAltRoundedIcon from '@mui/icons-material/SaveAltRounded';
import SendRoundedIcon from '@mui/icons-material/SendRounded';
import CancelRoundedIcon from '@mui/icons-material/CancelRounded';
import { Link } from 'react-router-dom';
import { Manifest, MAX_FILE_SIZE } from '../utils/rtcCrypto';
import {
  blobLimit,
  canChooseSaveLocation,
  disposeSaveResult,
  saveResultToPicker,
  SaveResult,
  supportsOpfs,
} from '../utils/rtcSave';
import { RtcTransfer, TransferCallbacks } from '../utils/rtcTransfer';

const fileSize = (size: number) =>
  size < 1024
    ? `${size} B`
    : size < 1024 * 1024
      ? `${(size / 1024).toFixed(1)} KiB`
      : `${(size / 1024 / 1024).toFixed(1)} MiB`;

function TransferPane({ sending }: { sending: boolean }) {
  const session = useRef<RtcTransfer>();
  const alive = useRef(true);
  const resultRef = useRef<SaveResult>();
  const [code, setCode] = useState('');
  const [status, setStatus] = useState('');
  const [phase, setPhase] = useState('');
  const [error, setError] = useState(false);
  const [busy, setBusy] = useState(false);
  const [progress, setProgress] = useState(0);
  const [manifest, setManifest] = useState<Manifest>();
  const [result, setResult] = useState<SaveResult>();
  const [selectedFileName, setSelectedFileName] = useState('');

  useEffect(() => {
    alive.current = true;
    const unload = () => session.current?.cancel();
    window.addEventListener('pagehide', unload);
    return () => {
      alive.current = false;
      window.removeEventListener('pagehide', unload);
      session.current?.cancel();
      if (resultRef.current) void disposeSaveResult(resultRef.current);
    };
  }, []);

  function start(file?: File) {
    if (sending && !file) {
      setError(true);
      setStatus('请选择文件');
      return;
    }
    session.current?.cancel();
    if (resultRef.current) void disposeSaveResult(resultRef.current);
    resultRef.current = undefined;
    setBusy(true);
    setError(false);
    setProgress(0);
    setPhase('');
    setManifest(undefined);
    setResult(undefined);
    setStatus(sending ? '正在创建安全会话…' : '正在加入安全会话…');
    const active = () => alive.current && session.current === transfer;
    const callbacks: TransferCallbacks = {
      status: (value) => {
        if (active()) setStatus(value);
      },
      phase: (value) => {
        if (active()) setPhase(value);
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
          if (value) void disposeSaveResult(value);
          return;
        }
        setBusy(false);
        setProgress(100);
        setManifest(undefined);
        setStatus(
          sending
            ? '发送完成，接收方已确认接收全部数据'
            : value?.streamed
              ? '接收完成，请选择保存位置'
              : '接收完成，请下载文件'
        );
        setResult(value);
        resultRef.current = value;
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
    setStatus('已取消传输');
    setError(false);
  }
  async function saveAfterTransfer() {
    const value = result;
    if (!value) return;
    try {
      if (canChooseSaveLocation()) {
        await saveResultToPicker(value);
        setStatus('文件已保存到所选位置');
      } else {
        const link = document.createElement('a');
        link.href = value.url;
        link.download = value.name;
        link.click();
        setStatus('下载已开始');
      }
    } catch (error) {
      if (error instanceof DOMException && error.name === 'AbortError')
        setStatus('已取消选择保存位置');
      else {
        setError(true);
        setStatus(error instanceof Error ? error.message : '保存失败');
      }
    }
  }

  const copyCode = () =>
    void navigator.clipboard
      .writeText(code)
      .then(() => setStatus('配对码已复制'))
      .catch(() => setStatus('无法访问剪贴板，请手动复制配对码'));

  return (
    <Paper
      elevation={0}
      sx={{
        mt: 2,
        overflow: 'hidden',
        border: '1px solid',
        borderColor: 'divider',
        borderRadius: 3,
        bgcolor: 'background.paper',
      }}
    >
      <Box sx={{ p: { xs: 2.5, sm: 4 } }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <Box
            sx={{
              width: 42,
              height: 42,
              borderRadius: 2,
              display: 'grid',
              placeItems: 'center',
              bgcolor: sending ? 'primary.50' : 'success.50',
              color: sending ? 'primary.main' : 'success.main',
            }}
          >
            {sending ? <SendRoundedIcon /> : <DownloadRoundedIcon />}
          </Box>
          <Box>
            <Typography variant="h6" sx={{ fontWeight: 700 }}>
              {sending ? '发送文件' : '接收文件'}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {sending
                ? '选择文件后自动生成配对码，配对成功即开始发送'
                : '输入发送方提供的 6 位配对码'}
            </Typography>
          </Box>
        </Box>
        {sending ? (
          <>
            <Box
              component="label"
              sx={{
                mt: 3,
                minHeight: 150,
                border: '1.5px dashed',
                borderColor: selectedFileName ? 'primary.main' : 'divider',
                borderRadius: 2,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 1,
                cursor: busy ? 'not-allowed' : 'pointer',
                bgcolor: selectedFileName ? 'primary.50' : 'action.hover',
                transition: 'all .2s ease',
                '&:hover': {
                  borderColor: 'primary.main',
                  bgcolor: 'primary.50',
                },
              }}
            >
              <FileUploadRoundedIcon color="primary" sx={{ fontSize: 38 }} />
              <Typography sx={{ fontWeight: 600 }}>
                {selectedFileName || '点击选择文件'}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                单文件最大 {fileSize(MAX_FILE_SIZE)}
              </Typography>
              <input
                type="file"
                aria-label="选择要发送的文件"
                disabled={busy}
                onChange={(event) => {
                  const file = event.target.files?.[0];
                  event.target.value = '';
                  if (!file) return;
                  setSelectedFileName(file.name);
                  start(file);
                }}
                style={{ display: 'none' }}
              />
            </Box>
          </>
        ) : (
          <TextField
            label="配对码"
            value={code}
            onChange={(event) => setCode(event.target.value.toUpperCase())}
            fullWidth
            disabled={busy}
            placeholder="例如 A1B2C3"
            sx={{
              mt: 3,
              '& input': {
                letterSpacing: { xs: 5, sm: 8 },
                fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace',
                fontSize: { xs: 24, sm: 30 },
                fontWeight: 700,
                textAlign: 'center',
              },
            }}
            inputProps={{
              autoCapitalize: 'characters',
              autoComplete: 'off',
              spellCheck: false,
              maxLength: 6,
            }}
          />
        )}
        {(!sending || busy) && (
          <Box sx={{ mt: 3, display: 'flex', gap: 1.25, flexWrap: 'wrap' }}>
            {!sending && (
              <Button
                variant="contained"
                startIcon={<LockRoundedIcon />}
                onClick={() => start()}
                disabled={busy}
                sx={{ minHeight: 44, px: 2.5, borderRadius: 2 }}
              >
                加入会话
              </Button>
            )}
            {busy && (
              <Button
                color="error"
                startIcon={<CancelRoundedIcon />}
                onClick={cancel}
                sx={{ minHeight: 44, borderRadius: 2 }}
              >
                取消传输
              </Button>
            )}
          </Box>
        )}
        {sending && code && (
          <Box
            sx={{
              mt: 3,
              p: 2,
              borderRadius: 2,
              bgcolor: 'primary.50',
              border: '1px solid',
              borderColor: 'primary.100',
            }}
          >
            <Typography variant="caption" color="text.secondary">
              将此配对码发送给接收方
            </Typography>
            <Box
              sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 0.5 }}
            >
              <Typography
                data-testid="pairing-code"
                sx={{
                  flex: 1,
                  fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace',
                  letterSpacing: { xs: 5, sm: 9 },
                  fontSize: { xs: 26, sm: 34 },
                  fontWeight: 800,
                  color: 'primary.dark',
                }}
              >
                {code}
              </Typography>
              <Button
                aria-label="复制配对码"
                variant="outlined"
                size="small"
                startIcon={<ContentCopyRoundedIcon />}
                onClick={copyCode}
                sx={{ flexShrink: 0, borderRadius: 1.5 }}
              >
                复制
              </Button>
            </Box>
          </Box>
        )}
        {manifest && !sending && (
          <Box sx={{ mt: 3, p: 2, bgcolor: 'success.50', borderRadius: 2 }}>
            <Typography sx={{ fontWeight: 600, overflowWrap: 'anywhere' }}>
              {manifest.name}
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
              {fileSize(manifest.size)} · 已自动开始接收
              {supportsOpfs()
                ? '，完成后选择保存位置'
                : `，上限 ${fileSize(blobLimit())}`}
            </Typography>
          </Box>
        )}
        {(busy || progress > 0) && (
          <Box sx={{ mt: 3 }}>
            <Box
              sx={{
                display: 'flex',
                justifyContent: 'space-between',
                mb: 0.75,
              }}
            >
              <Typography variant="body2" color="text.secondary">
                传输进度
              </Typography>
              <Typography variant="body2" sx={{ fontWeight: 700 }}>
                {progress}%
              </Typography>
            </Box>
            <LinearProgress
              variant="determinate"
              value={progress}
              sx={{ height: 8, borderRadius: 4 }}
            />
          </Box>
        )}
        {result?.url && !sending && (
          <Button
            variant="contained"
            startIcon={
              canChooseSaveLocation() ? (
                <SaveAltRoundedIcon />
              ) : (
                <DownloadRoundedIcon />
              )
            }
            onClick={() => void saveAfterTransfer()}
            sx={{ mt: 3, minHeight: 44, borderRadius: 2 }}
          >
            {canChooseSaveLocation() ? '选择保存位置' : '下载文件'}
          </Button>
        )}
        {phase && (
          <Typography
            variant="caption"
            color="text.secondary"
            sx={{ display: 'block', mt: 2 }}
          >
            {phase}
          </Typography>
        )}
        {status && (
          <Alert
            sx={{ mt: 2, borderRadius: 2 }}
            icon={
              error ? undefined : <CheckCircleRoundedIcon fontSize="inherit" />
            }
            severity={error ? 'error' : 'info'}
          >
            {status}
          </Alert>
        )}
      </Box>
    </Paper>
  );
}

export default function FileTransfer() {
  const [tab, setTab] = useState(0);
  return (
    <Box sx={{ maxWidth: 760, mx: 'auto', p: { xs: 2, sm: 4 } }}>
      <Button
        component={Link}
        to="/"
        startIcon={<ArrowBackRoundedIcon />}
        sx={{ mb: 2, px: 0 }}
      >
        返回首页
      </Button>
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'space-between',
          gap: 2,
          alignItems: 'flex-end',
        }}
      >
        <Box>
          <Typography
            variant="h4"
            sx={{ fontWeight: 800, letterSpacing: -0.5 }}
          >
            WebRTC 文件传输
          </Typography>
          <Typography color="text.secondary" sx={{ mt: 1 }}>
            端对端加密，文件只在双方设备之间传输
          </Typography>
        </Box>
        <Chip
          icon={<LockRoundedIcon />}
          label="端对端加密"
          size="small"
          color="success"
          variant="outlined"
        />
      </Box>
      <Tabs
        value={tab}
        onChange={(_, value) => setTab(value)}
        variant="fullWidth"
        sx={{ mt: 3, borderBottom: 1, borderColor: 'divider' }}
      >
        <Tab icon={<SendRoundedIcon />} iconPosition="start" label="发送文件" />
        <Tab
          icon={<DownloadRoundedIcon />}
          iconPosition="start"
          label="接收文件"
        />
      </Tabs>
      <TransferPane key={tab} sending={tab === 0} />
      <Typography
        variant="caption"
        color="text.secondary"
        sx={{ display: 'block', mt: 2, textAlign: 'center' }}
      >
        双方需同时保持页面打开；部分网络可能需要 TURN 中继
      </Typography>
    </Box>
  );
}
