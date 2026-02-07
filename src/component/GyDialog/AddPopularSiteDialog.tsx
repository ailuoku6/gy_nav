import { useState, useEffect } from 'react';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import TextField from '@mui/material/TextField';
import { linkPattern } from '../../utils/veriLink';

interface IAddPopularSiteDialogProps {
  defaultName?: string;
  defaultAddr?: string;
  defaultIcon?: string;
  title: string;
  CancelText?: string;
  open: boolean;
  onClose: () => void;
  onConfirm: (
    siteName: string,
    siteAddr: string,
    icon?: string
  ) => void;
  onCancel: () => void;
  ConfirmText?: string;
}

function AddPopularSiteDialog(props: IAddPopularSiteDialogProps) {
  const [siteName, setSiteName] = useState(props.defaultName || '');
  const [siteAddr, setSiteAddr] = useState(props.defaultAddr || 'http://');
  const [iconUrl, setIconUrl] = useState(props.defaultIcon || '');
  const [isError, setIsError] = useState(false);
  const [helpText, setHelpText] = useState('');

  useEffect(() => {
    if (props.open) {
      setSiteAddr(props.defaultAddr || 'http://');
      setSiteName(props.defaultName || '');
      setIconUrl(props.defaultIcon || '');
    }
  }, [props.open, props.defaultAddr, props.defaultName, props.defaultIcon]);

  const handleConfirm = () => {
    if (linkPattern.test(siteAddr)) {
      props.onConfirm(siteName, siteAddr, iconUrl.trim() || undefined);
      setSiteName('');
      setSiteAddr('http://');
      setIconUrl('');
      setIsError(false);
      setHelpText('');
    } else {
      setIsError(true);
      setHelpText('输入有误！输入的不是网址');
    }
  };

  const handleClose = () => {
    setSiteName('');
    setSiteAddr('http://');
    setIconUrl('');
    setIsError(false);
    setHelpText('');
    props.onClose();
  };

  return (
    <Dialog
      open={props.open}
      onClose={handleClose}
      aria-labelledby="popular-site-dialog-title"
    >
      <DialogTitle id="popular-site-dialog-title">{props.title}</DialogTitle>
      <DialogContent>
        <TextField
          autoFocus
          label="输入网站名"
          variant="standard"
          fullWidth
          value={siteName}
          onChange={(e) => {
            setSiteName(e.target.value);
            e.stopPropagation();
          }}
          sx={{ mb: 2 }}
        />
        <TextField
          error={isError}
          helperText={helpText}
          label="输入网址"
          variant="standard"
          fullWidth
          value={siteAddr}
          onChange={(e) => {
            setSiteAddr(e.target.value);
            setHelpText('');
            setIsError(false);
            e.stopPropagation();
          }}
          sx={{ mb: 2 }}
        />
        <TextField
          label="网站图标URL（可选，不填则使用网站favicon）"
          variant="standard"
          fullWidth
          placeholder="https://example.com/icon.png"
          value={iconUrl}
          onChange={(e) => {
            setIconUrl(e.target.value);
            e.stopPropagation();
          }}
        />
      </DialogContent>
      <DialogActions>
        <Button onClick={handleClose} color="primary">
          {props.CancelText || '取消'}
        </Button>
        <Button onClick={handleConfirm} color="primary">
          {props.ConfirmText || '确定'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}

export default AddPopularSiteDialog;
