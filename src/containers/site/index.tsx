import React, { useState } from "react";
import "./index.css";
//import './dark.css';
import EditIcon from "@material-ui/icons/Edit";
import DeleteIcon from "@material-ui/icons/Delete";
import ReactSortable from "react-sortablejs";
import {
  addSite2Part,
  delSite,
  modifySite,
  moveSite,
} from "../../redux/actions";

import { connect, useDispatch, useSelector } from "react-redux";

import AddSiteDialog from "../../component/GyDialog/AddSiteDialog";

import { UIDelMenu, UISiteNoIcon, UIOperatorBtnWrap } from "./style";

export default function Site(props: any) {
  const [selectedIndex, setSelectedIndex] = useState<number>(-1);

  const { device } = useSelector((state: any) => ({
    device: state.Device.device,
  }));
  const dispatch = useDispatch();

  let sites = Array.isArray(props.Sites) ? props.Sites : [];
  let edit = props.Edit && props.PartIndex !== null;
  let partIndex =
    props.PartIndex !== undefined && props.partIndex !== null
      ? props.PartIndex
      : -1;
  let key = "PlaceHolderKey-" + (edit ? "on" : "off");
  // let selectedIndex = this.state.selectedIndex;

  return (
    <div>
      <ReactSortable
        key={key}
        onChange={(order, sortable, evt) => {
          if (partIndex < 0) return;
          dispatch(moveSite(partIndex, evt.oldIndex, evt.newIndex));
        }}
        options={{
          animation: 150,
          easing: "cubic-bezier(1, 0, 0, 1)",
          ghostClass: "sortable-ghost",
          disabled: !edit,
        }}
      >
        {sites.map((item, index) => {
          return (
            <UISiteNoIcon key={index} style={edit ? { minWidth: 40 } : null}>
              {edit && device === "phone" ? (
                <div>{item.site_name ? item.site_name : "网站名缺失"}</div>
              ) : (
                <a href={item.url ? item.url : ""} target={"_blank"}>
                  {item.site_name ? item.site_name : "网站名缺失"}
                </a>
              )}
              {edit === true && (
                <UIDelMenu>
                  <UIOperatorBtnWrap
                    style={{
                      backgroundColor: "#2525b1a1",
                    }}
                    onClick={() => {
                      setSelectedIndex(index);
                    }}
                  >
                    <EditIcon
                      fontSize={"small"}
                      color={"inherit"}
                      style={{ color: "#fff" }}
                    />
                  </UIOperatorBtnWrap>
                  <UIOperatorBtnWrap
                    style={{
                      backgroundColor: "#ff0000b8",
                    }}
                    onClick={() => {
                      dispatch(delSite(partIndex, index));
                    }}
                  >
                    <DeleteIcon
                      fontSize={"small"}
                      color={"inherit"}
                      style={{ color: "#fff" }}
                    />
                  </UIOperatorBtnWrap>
                </UIDelMenu>
              )}
            </UISiteNoIcon>
          );
        })}
      </ReactSortable>
      {selectedIndex >= 0 && (
        <AddSiteDialog
          open={selectedIndex >= 0}
          title={"编辑站点"}
          ConfirmText={"修改"}
          defaultName={sites[selectedIndex].site_name}
          defaultAddr={sites[selectedIndex].url}
          onClose={() => {
            setSelectedIndex(-1);
          }}
          onCancel={() => {
            setSelectedIndex(-1);
          }}
          onConfirm={(siteName: string, siteAddr: string) => {
            if (siteName && siteAddr) {
              //这里应该加验证
              //this.props.addSite2Part(this.state.selectedIndex,siteName,siteAddr);
              dispatch(
                modifySite(partIndex, selectedIndex, siteName, siteAddr)
              );
            } else {
              console.log("给点东西吧");
            }
            setSelectedIndex(-1);
          }}
        />
      )}
    </div>
  );
}
