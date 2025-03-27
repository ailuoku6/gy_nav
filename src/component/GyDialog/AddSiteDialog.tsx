import { useState, useEffect } from 'react';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import TextField from '@mui/material/TextField';
// import Select from '@mui/material/Select';
// import MenuItem from '@mui/material/MenuItem';
// import FormControl from '@mui/material/FormControl';
// import InputLabel from '@mui/material/InputLabel';
import { linkPattern } from '../../utils/veriLink';
// import { setGlobalMsg } from '../../redux/actions';
// import { connect } from 'react-redux';

interface IAddSiteDialogProps {
  defaultName?: string;
  defaultAddr?: string;
  title: string;
  CancelText?: string;
  open: boolean;
  onClose: () => void;
  onConfirm: (siteName: string, siteAddr: string) => void;
  onCancel: () => void;
  ConfirmText?: string;
}

function AddSiteDialog(props: IAddSiteDialogProps) {
  //console.log(props);
  const [siteName, setSiteName] = useState(
    props.defaultName || ''
  );
  const [siteAddr, setSiteAddr] = useState(
    props.defaultAddr || 'http://'
  );
  const [isError, setIsError] = useState(false);
  const [helpText, setHelpText] = useState('');
  //console.log("AddSiteDialog刷新了");

  useEffect(() => {
    if (props.open) {
      setSiteAddr(props.defaultAddr || 'http://');
      console.log('设置siteAddr');
    }
    return () => {};
  }, [props.open]);
  return (
    <Dialog
      open={props.open}
      onClose={() => {
        setSiteName('');
        setSiteAddr('');
        setIsError(false);
        setHelpText('');
        props.onClose();
      }}
      aria-labelledby="alert-dialog-title"
      // aria-describedby="alert-dialog-description"
    >
      <DialogTitle id="alert-dialog-title">{props.title}</DialogTitle>
      <DialogContent>
        <TextField
          autoFocus
          label="输入网站名"
          variant="standard"
          // fullWidth
          value={siteName}
          onChange={(event) => {
            setSiteName(event.target.value);
            event.stopPropagation();
          }}
        />
        <br />

        <TextField
          error={isError}
          helperText={helpText}
          label="输入网址"
          variant="standard"
          // fullWidth
          //value={siteAddr?siteAddr:'http://'}
          value={siteAddr}
          onChange={(event) => {
            setSiteAddr(event.target.value);
            event.stopPropagation();
          }}
        />
      </DialogContent>
      <DialogActions>
        <Button
          onClick={() => {
            setSiteName('');
            setSiteAddr('');
            setIsError(false);
            setHelpText('');
            props.onCancel();
          }}
          color="primary"
        >
          {props.CancelText || '取消'}
        </Button>
        <Button
          onClick={() => {
            if (linkPattern.test(siteAddr)) {
              props.onConfirm(siteName, siteAddr);
              setSiteName('');
              setSiteAddr('');
            } else {
              console.log('地址不合法');
              setIsError(true);
              setHelpText('输入有误！输入的不是网址');
              //props.setGlobalMsg("输入的地址不合法",true);
            }
          }}
          color="primary"
        >
          {props.ConfirmText || '确定'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}

// export default App;

// export default connect(mapStateToProps, mapDispatchToProps)(AddSiteDialog);

export default AddSiteDialog;
