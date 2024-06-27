import React, { useMemo, useRef, useState } from "react";

import {
  Tooltip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  Snackbar,
  Button,
} from "@mui/material";

import { post } from "../../utils/http";

import { WriteRemoteClipBoard, GetRemoteClipBoard } from "../../utils/Api";

import { readFromClipboard, writeToClipboard } from "../../utils/clipboard";

import copy from "../../assets/copy.png";
import whatsnew from "../../assets/new.png";

import "./index.css";
import { isSafari } from "../../utils/device";

const FeaturePanel = () => {
  const [display, setDisplay] = useState(false);
  const timer = useRef(null);

  const [msg, setMsg] = useState({ content: "", callback: null });

  const [modalOpen, setModalOpen] = useState(false);

  const handleModalClose = () => {
    setModalOpen(false);
  };

  const handleMsgClose = (event, reason) => {
    if (reason === "clickaway") {
      return;
    }

    setMsg({ content: "", callback: null });
  };

  const handleCopyClick = () => {
    if (timer.current) {
      clearTimeout(timer.current);
    }

    timer.current = setTimeout(async () => {
      const res = await post(GetRemoteClipBoard, {});

      if (!res.result) {
        setMsg({ content: "云端剪切板为空或已过期", callback: null });
        return;
      }
      const remoteClipBoard = res.data;
      if (isSafari()) {
        setMsg({
          content: "点击复制",
          callback: () => {
            writeToClipboard(remoteClipBoard);
            setMsg({ content: "", callback: null });
          },
        });
      } else {
        await writeToClipboard(remoteClipBoard);
        setMsg({ content: "拉取云剪切板成功", callback: null });
      }
    }, 400);
  };

  const handleCopyDbClick = async () => {
    if (timer.current) {
      clearTimeout(timer.current);
    }

    const clipboardData = await readFromClipboard();
    if (clipboardData) {
      await post(WriteRemoteClipBoard, { clipboardString: clipboardData });
      setMsg({
        content: "成功复制内容到云剪切板，5分钟后失效",
        callback: null,
      });
    } else {
      setMsg({ content: "剪切板为空", callback: null });
    }
  };

  const snackbarAction =
    msg.content && msg.callback ? (
      <Button color="secondary" size="small" onClick={msg.callback}>
        复制
      </Button>
    ) : null;

  return (
    <>
      <Snackbar
        anchorOrigin={{
          vertical: "top",
          horizontal: "center",
        }}
        open={!!msg.content}
        autoHideDuration={2000}
        onClose={handleMsgClose}
        message={msg.content}
        action={snackbarAction}
      />
      <div
        onBlur={() => setDisplay(false)}
        onMouseLeave={() => setDisplay(false)}
        class={display ? "panel-container panel-display" : "panel-container"}
      >
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
              setDisplay(false);
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
            <DialogContentText>
              云剪切板 (用于同一账户跨设备同步信息)
            </DialogContentText>
            <div>双击拷贝剪切板内容到云端，单击从云端拷贝剪切板内容到本地</div>
            <div>
              隐私相关：用户剪切板内容加密存储，5分钟后过期自动从云端删除
            </div>
            <div>但即便如此，仍不建议将密码等敏感信息存储到云剪切板</div>
          </DialogContent>
        </Dialog>
      </div>
    </>
  );
};

export default FeaturePanel;
