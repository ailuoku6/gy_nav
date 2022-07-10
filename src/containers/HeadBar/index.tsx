import React, { useState, useRef, useEffect } from "react";
import { useDebounceFn } from "ahooks";
// import "./index.css";
import ExpandMoreIcon from "@material-ui/icons/ExpandMore";
// import Collapse from "@material-ui/core/Collapse";
import CancelIcon from "@material-ui/icons/Cancel";
import { SUGTIP } from "../../utils/Api";
import jsonp from "jsonp";
import { useSelector, useDispatch } from "react-redux";
import {
  setSugShow,
  setMarchineShow,
  setMarchineIndex,
} from "../../redux/actions";
import Marchinelist from "../../utils/SearchMarchine";
//import { debounce } from 'throttle-debounce';
// import debounce from "../../utils/debounce";
import { linkPattern } from "../../utils/veriLink";
import eventBus from "../../utils/EventEmitter";
import { homeKeyDown } from "../../utils/Events";

import {
  UIHeadBar,
  UISearchWrap,
  UISearchMarchine,
  UIMarchineItem,
  UICollapse,
  UISeacingBarWrap,
  UIInputBarWrap,
  ClearBtnWrap,
  UISugItem,
  UISugWrap,
  UISugIndex,
  UISearchingBtn,
} from "./style";

export default function HeadBar(props: any) {
  const { device, showMarchine, showSug, selectMcIndex } = useSelector(
    (state) => ({
      device: state.Device.device,
      showMarchine: state.Show.marchine,
      showSug: state.Show.sug,
      selectMcIndex: state.MarchineIndex.index,
    })
  );

  const dispatch = useDispatch();

  const [sug, setSug] = useState<string[]>([]);
  const [keyWord, setKeyWord] = useState<string>("");
  const [sugSelectIndex, setSugSelectIndex] = useState<number>(0);

  const [sugWidth, setSugWidth] = useState<number>(0);

  const inputRef = useRef<HTMLInputElement>(null);
  const searchWrapRef = useRef<HTMLDivElement>(null);
  const searchBtnRef = useRef<HTMLDivElement>(null);

  const handleHomeKeyDown = (e) => {
    let focuEle = e.target.tagName;
    if (focuEle !== "INPUT" && inputRef.current) {
      inputRef.current.focus();
    }
  };

  useEffect(() => {
    eventBus.on(homeKeyDown, handleHomeKeyDown);

    return () => {
      eventBus.off(homeKeyDown, handleHomeKeyDown);
    };
  }, []);

  useEffect(() => {
    const handleResize = () => {
      if (searchWrapRef.current && searchBtnRef.current) {
        const wrapWidth = searchWrapRef.current.clientWidth;
        const btnWidth = searchBtnRef.current.clientWidth;
        setSugWidth(wrapWidth - btnWidth);
      }
    };

    window.addEventListener("resize", handleResize);
    window.addEventListener("load", handleResize);

    return () => {
      window.removeEventListener("resize", handleResize);
      window.removeEventListener("load", handleResize);
    };
  }, [setSugWidth, searchWrapRef, searchBtnRef]);

  const search = () => {
    if (linkPattern.test(keyWord)) {
      if (device === "phone") {
        window.location.href = keyWord;
      } else {
        window.open(keyWord);
      }
    }

    let marchine = Marchinelist[selectMcIndex];

    let url =
      marchine.searApi + encodeURIComponent(keyWord) + marchine.searApi_weizui;
    if (device === "phone") {
      window.location.href = url;
    } else {
      window.open(url);
    }
  };

  const getSug = () => {
    if (keyWord === "") {
      setSug([]);
      dispatch(setSugShow(false));
      return;
    }

    jsonp(
      SUGTIP + keyWord,
      {
        param: "cb",
      },
      (err: any, data: any) => {
        let sug;
        try {
          sug = data.s;
        } catch (e) {
          sug = [];
        }

        sug.splice(0, 0, keyWord);
        if (keyWord === "") {
          setSug([]);
          dispatch(setSugShow(false));
        } else {
          setSug(sug);
          dispatch(setSugShow(true));
        }
      }
    );
    setSugSelectIndex(0);
  };

  const switchSug = () => {
    let newshowSug = !showSug;
    dispatch(setMarchineShow(false));
    if (newshowSug === true) {
      getSug();
      return;
    }
    dispatch(setSugShow(newshowSug));
  };

  const { run: debounceGetSug } = useDebounceFn(getSug, { wait: 200 });

  const scrolled = props.Scrolled;

  const color = Marchinelist[selectMcIndex].color;
  const name = Marchinelist[selectMcIndex].button_value;

  const hoverable = device !== "phone";

  return (
    <UIHeadBar
      $showShadow={scrolled}
      $hoverble={hoverable}
      onClick={() => {
        dispatch(setMarchineShow(false));
        dispatch(setSugShow(false));
      }}
    >
      <UISearchWrap $borderColor={color} ref={searchWrapRef}>
        <UISearchMarchine>
          <ExpandMoreIcon
            fontSize={"inherit"}
            style={{ fontSize: 15 }}
            onClick={(e) => {
              dispatch(setMarchineShow(!showMarchine));
              dispatch(setSugShow(false));
              e.stopPropagation();
            }}
          />

          <UICollapse in={showMarchine} component={"ul"}>
            {Marchinelist.map((item, index) => {
              return (
                <UIMarchineItem
                  key={JSON.stringify(item)}
                  $selected={selectMcIndex === index}
                  onClick={() => {
                    dispatch(setMarchineIndex(index));
                    dispatch(setMarchineShow(false));
                  }}
                >
                  {item.Marchine_name}
                </UIMarchineItem>
              );
            })}
          </UICollapse>
        </UISearchMarchine>
        <UISeacingBarWrap>
          <UIInputBarWrap
            type={"text"}
            placeholder={"搜你所想"}
            autoComplete={"off"}
            onClick={(e) => {
              switchSug();
              e.stopPropagation();
            }}
            onKeyDown={(e) => {
              console.log(e.keyCode); //上为38，下为40

              if (e.keyCode === 38) {
                let selectIndex = sugSelectIndex;
                // let sug = this.state.sug;
                selectIndex = (sug.length + --selectIndex) % sug.length;
                setSugSelectIndex(selectIndex);
                setKeyWord(sug[selectIndex]);
              } else if (e.keyCode === 40) {
                let selectIndex = sugSelectIndex;
                selectIndex = ++selectIndex % sug.length;
                setSugSelectIndex(selectIndex);
                setKeyWord(sug[selectIndex]);
              } else if (e.keyCode === 13) {
                if (keyWord === "") return;
                search();
              }
            }}
            value={keyWord}
            onChange={(e) => {
              const kw: string = e.target.value;
              setKeyWord(kw);
              if (kw === "") {
                setSug([]);
                dispatch(setSugShow(false));
              } else {
                setTimeout(() => {
                  debounceGetSug();
                }, 0);
              }
            }}
            ref={inputRef}
          />
          {keyWord && (
            <ClearBtnWrap
              onClick={() => {
                setKeyWord("");
                setSug([]);
                inputRef.current && inputRef.current.focus();
              }}
            >
              <CancelIcon fontSize={"inherit"} style={{ fontSize: 15 }} />
            </ClearBtnWrap>
          )}
        </UISeacingBarWrap>
        {sug.length !== 0 && showSug ? (
          <UISugWrap $width={sugWidth}>
            {sug.map((item, index) => {
              if (index === 0) return null;
              return (
                <UISugItem
                  key={index}
                  $selected={index === sugSelectIndex}
                  onClick={() => {
                    setKeyWord(item);
                    setTimeout(() => {
                      search();
                    }, 0);
                  }}
                >
                  <UISugIndex $hot={index <= 3}>{index}</UISugIndex>
                  {item}
                </UISugItem>
              );
            })}
          </UISugWrap>
        ) : null}
        <UISearchingBtn
          ref={searchBtnRef}
          $backColor={color}
          onClick={() => search()}
        >
          {name}
        </UISearchingBtn>
      </UISearchWrap>
    </UIHeadBar>
  );
}
