import React, { useState } from 'react';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import TextField from '@mui/material/TextField';

function GyDialog(props) {
  //console.log(props);
  const [partName, setpartName] = useState('');

  return (
    <Dialog
      open={props.open}
      onClose={() => {
        setpartName('');
        props.onClose();
      }}
      aria-labelledby="alert-dialog-title"
      aria-describedby="alert-dialog-description"
    >
      <DialogTitle id="alert-dialog-title">{props.title}</DialogTitle>
      <DialogContent>
        <TextField
          label="输入分区名"
          // fullWidth
          value={partName}
          onChange={(event) => {
            setpartName(event.target.value);
            event.stopPropagation();
          }}
        />

        {/*<DialogContentText id="alert-dialog-description">*/}
        {/*    Let Google help apps determine location. This means sending anonymous location data to*/}
        {/*    Google, even when no apps are running.*/}
        {/*</DialogContentText>*/}
      </DialogContent>
      <DialogActions>
        <Button
          onClick={() => {
            setpartName('');
            props.onCancel();
          }}
          color="primary"
        >
          取消
        </Button>
        <Button
          onClick={() => {
            setpartName('');
            props.onConfirm(partName);
          }}
          color="primary"
        >
          添加
        </Button>
      </DialogActions>
    </Dialog>
  );
}

export default GyDialog;
