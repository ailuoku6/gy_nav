import React, { useMemo, useState } from "react";

import { Tooltip, Popover } from "@material-ui/core";

import copy from "../../assets/copy.png";
import whatsnew from "../../assets/new.png";

import "./index.css";

const FeaturePanel = () => {
  const [display, setDisplay] = useState(true);

  const handleCopyClick = () => {
    console.info("-----click");
  };

  const handleCopyDbClick = () => {
    console.info("------dbclick");
  };

  return (
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
        <div className="panel-item">
          <div className="panel-item-icon">
            <img src={whatsnew} alt="copy" />
          </div>
          <div className="panel-item-name">更新日志</div>
        </div>
      </div>
    </div>
  );
};

export default FeaturePanel;
