import React, { useState } from "react";
import DialogTitle from "@material-ui/core/DialogTitle";
import DialogContent from "@material-ui/core/DialogContent";
import DialogActions from "@material-ui/core/DialogActions";
import Button from "@material-ui/core/Button";
import Dialog from "@material-ui/core/Dialog";
import TextField from "@material-ui/core/TextField";

export default function GyDialog(props) {
  //console.log(props);
  const [partName, setpartName] = useState("");

  return (
    <Dialog
      open={props.open}
      onClose={() => {
        setpartName("");
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
      </DialogContent>
      <DialogActions>
        <Button
          onClick={() => {
            setpartName("");
            props.onCancel();
          }}
          color="primary"
        >
          取消
        </Button>
        <Button
          onClick={() => {
            setpartName("");
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
