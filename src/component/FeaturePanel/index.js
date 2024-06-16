import React, { useMemo, useRef, useState } from "react";

import {
  Tooltip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  Snackbar,
} from "@material-ui/core";

import { post } from "../../utils/http";

import { WriteRemoteClipBoard, GetRemoteClipBoard } from "../../utils/Api";

import { readFromClipboard, writeToClipboard } from "../../utils/clipboard";

import copy from "../../assets/copy.png";
import whatsnew from "../../assets/new.png";

import "./index.css";

const FeaturePanel = () => {
  const [display, setDisplay] = useState(false);
  const timer = useRef(null);

  const [msg, setMsg] = useState("");

  const [modalOpen, setModalOpen] = useState(false);

  const handleModalClose = () => {
    setModalOpen(false);
  };

  const handleMsgClose = (event, reason) => {
    if (reason === "clickaway") {
      return;
    }

    setMsg("");
  };

  const handleCopyClick = () => {
    if (timer.current) {
      clearTimeout(timer.current);
    }

    timer.current = setTimeout(async () => {
      const res = post(GetRemoteClipBoard);
      if (!res.result) {
        return;
      }
      const remoteClipBoard = res.data;
      await writeToClipboard(remoteClipBoard);
      setMsg("拉取云剪切板成功");
    }, 400);
  };

  const handleCopyDbClick = async () => {
    if (timer.current) {
      clearTimeout(timer.current);
    }

    const clipboardData = await readFromClipboard();
    if (clipboardData) {
      await post(WriteRemoteClipBoard, { clipboardString: clipboardData });
      setMsg("成功复制内容到云剪切板，5分钟后失效");
    } else {
      setMsg("剪切板为空");
    }
  };

  return (
    <div
      onBlur={() => setDisplay(false)}
      onMouseLeave={() => setDisplay(false)}
      class={display ? "panel-container panel-display" : "panel-container"}
    >
      <Snackbar
        anchorOrigin={{
          vertical: "top",
          horizontal: "center",
        }}
        open={!!msg}
        autoHideDuration={2000}
        onClose={handleMsgClose}
        message={msg}
        action={<></>}
      />
      <div
        class="pull-ring"
        onClick={() => {
          setDisplay(true);
        }}
      ></div>
      <div class="panel">
        <Tooltip title="双击上传剪切板内容到云端，单击从云端剪切板复制内容，数据安全相关请看更新日志说明">
          <div
            className="panel-item"
            onClick={handleCopyClick}
            onDoubleClick={handleCopyDbClick}
          >
            <div className="panel-item-icon">
              <img src={copy} alt="copy" />
            </div>
            <div className="panel-item-name">云剪切板</div>
          </div>
        </Tooltip>
        <div
          className="panel-item"
          onClick={() => {
            setModalOpen(true);
          }}
        >
          <div className="panel-item-icon">
            <img src={whatsnew} alt="copy" />
          </div>
          <div className="panel-item-name">更新日志</div>
        </div>
      </div>
      <Dialog
        open={modalOpen}
        onClose={handleModalClose}
        aria-labelledby="simple-dialog-title"
      >
        <DialogTitle id="simple-dialog-title">更新说明</DialogTitle>
        <DialogContent>
          <DialogContentText>云剪切板 (用于同一账户跨设备同步信息)</DialogContentText>
          <div>
            双击拷贝剪切板内容到云端，单击从云端拷贝剪切板内容到本地
          </div>
          <div>
            隐私相关：用户剪切板内容加密存储，5分钟后过期自动从云端删除
          </div>
          <div>但即便如此，仍不建议将密码等敏感信息存储到云剪切板</div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default FeaturePanel;
