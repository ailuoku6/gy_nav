import { useCallback, useEffect, useRef, useState } from 'react';
import './index.css';
//import './dark.css';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import Collapse from '@mui/material/Collapse';
import CancelIcon from '@mui/icons-material/Cancel';
import { appStore } from '../../store/AppStore';
import Marchinelist from '../../utils/SearchMarchine';
import { linkPattern } from '../../utils/veriLink';
// @ts-ignore
import eventBus from '../../utils/EventEmitter';
import { homeKeyDown } from '../../utils/Events';
import { DeviceTypes } from '../../types';
import { observer } from 'kisstate';
import { sugObservable, sugSubject } from './utils';
import { useHotkeys } from 'react-hotkeys-hook';

interface IHeadBarProps {
  Scrolled: boolean;
}

const hotkeyMap = Marchinelist.reduce(
  (prev, curv, index) => {
    const { hotkey } = curv;
    if (hotkey) {
      prev[hotkey] = index;
    }
    return prev;
  },
  {} as Record<string, number>
);

const hotkeys = Object.keys(hotkeyMap);

const HeadBar = ({ Scrolled }: IHeadBarProps) => {
  // const [showMarchine, setShowMarchine] = useState(false);
  const [sug, setSug] = useState([]);
  // const [showSug, setShowSug] = useState(false);
  const [keyWord, setKeyword] = useState('');
  // const [Marchineselect_index, setMarchineselect_index] = useState(0);
  const [sugSelectIndex, setSugSelectIndex] = useState(0);

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [_random, setRandom] = useState(0);

  const { device, marchine, sug: showSug, marchineIndex: selectMcIndex } = appStore;

  const inputRef = useRef<HTMLInputElement>(null);

  useHotkeys(
    hotkeys,
    (_arg, arg1) => {
      const index = hotkeyMap[arg1.hotkey];
      if (index !== undefined && index !== null) {
        appStore.setMarchineIndex(index);
        appStore.setMarchineShow(false);
      }
    },
    { enableOnFormTags: ['INPUT'], preventDefault: true }
  );

  const handleHomeKeyDown = (e: any) => {
    const focuEle = e.target.tagName;
    if (focuEle !== 'INPUT') {
      inputRef.current?.focus();
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
      setRandom(Math.random());
    };

    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  const Search = (keyword?: string) => {
    const keyword_ = keyword ?? keyWord;
    // let device = this.props.device;
    // let marchine = this.state.Marchinelist[this.state.Marchineselect_index];
    if (linkPattern.test(keyword_)) {
      if (device === 'phone') {
        window.location.href = keyword_;
      } else {
        window.open(keyword_);
      }
    }
    const marchine = Marchinelist[selectMcIndex];

    const url =
      marchine.searApi + encodeURIComponent(keyword_) + marchine.searApi_weizui;
    if (device === 'phone') {
      window.location.href = url;
    } else {
      window.open(url);
    }
  };

  const keywordRef = useRef(keyWord);

  keywordRef.current = keyWord;

  useEffect(() => {
    const sub = sugObservable.subscribe((sugs: string[]) => {
      if (sugs?.length) {
        sugs.splice(0, 0, keywordRef.current);
      }

      setSug(sugs as any);
      appStore.setSugShow(!!sugs.length);

      setSugSelectIndex(0);
    });

    return () => sub.unsubscribe();
  }, []);

  const getSug = useCallback(() => {
    sugSubject.next(keywordRef.current);
  }, []);

  const switchSug = () => {
    console.log('switch');
    const newshowSug = !showSug;
    appStore.setMarchineShow(false);
    if (newshowSug === true) {
      getSug();
      return;
    }
    appStore.setSugShow(newshowSug);
  };

  const wrapRef = useRef<HTMLDivElement>(null);
  const barRef = useRef<HTMLDivElement>(null);

  const searchBtnRef = useRef<HTMLDivElement>(null);

  const color = Marchinelist[selectMcIndex].color;
  const name = Marchinelist[selectMcIndex].button_value;

  const sugWidth =
    wrapRef.current && searchBtnRef.current
      ? wrapRef.current.clientWidth - searchBtnRef.current.clientWidth
      : 0;

  const headBase =
    device !== DeviceTypes.phone ? 'headBar headBarHoverbel' : 'headBar';

  return (
    <div
      className={Scrolled ? headBase + ' gy-shadow-2' : headBase}
      onClick={() => {
        appStore.setMarchineShow(false);
        appStore.setSugShow(false);
      }}
    >
      <div className={'sear_wrap'} ref={wrapRef} style={{ borderColor: color }}>
        <div className={'sear_marchine'}>
          <ExpandMoreIcon
            fontSize={'inherit'}
            style={{ fontSize: 15 }}
            onClick={(e) => {
              appStore.setMarchineShow(!marchine);
              appStore.setSugShow(false);
              e.stopPropagation();
            }}
          />

          <Collapse
            in={marchine}
            component={'ul'}
            id={'sear_marchine_select'}
            className={'sug'}
          >
            {Marchinelist.map((item, index) => {
              return (
                <a
                  key={JSON.stringify(item)}
                  className={selectMcIndex === index ? 'selected' : ''}
                  title={item.hotkey ? `快捷键: ${item.hotkey}` : ''}
                  onClick={() => {
                    appStore.setMarchineIndex(index);
                    appStore.setMarchineShow(false);
                  }}
                  style={{
                    textDecoration: 'none',
                    fontSize: 14,
                    cursor: 'pointer',
                  }}
                >
                  {item.Marchine_name}
                </a>
              );
            })}
          </Collapse>
        </div>
        <div id={'seacing_bar'} ref={barRef}>
          <input
            id={'input_bar'}
            type={'text'}
            placeholder={'搜你所想'}
            autoComplete={'off'}
            onClick={(e) => {
              switchSug();
              e.stopPropagation();
            }}
            onKeyDown={(e) => {
              console.log(e.keyCode); //上为38，下为40

              if (e.keyCode === 38) {
                let selectIndex = sugSelectIndex;
                selectIndex = (sug.length + --selectIndex) % sug.length;
                setSugSelectIndex(selectIndex);
                setKeyword(sug[selectIndex]);
              } else if (e.keyCode === 40) {
                let selectIndex = sugSelectIndex;
                // selectIndex = (sug.length + --selectIndex)%sug.length;
                selectIndex = ++selectIndex % sug.length;

                setSugSelectIndex(selectIndex);
                setKeyword(sug[selectIndex]);
              } else if (e.keyCode === 13) {
                if (keyWord === '') return;
                Search(keywordRef.current);
              }
            }}
            value={keyWord}
            onChange={(e) => {
              setKeyword(e.target.value);
              keywordRef.current = e.target.value;
              getSug();
            }}
            ref={inputRef}
          />

          {keyWord && (
            <div
              style={{ display: 'flex', alignItems: 'center' }}
              onClick={() => {
                setKeyword('');
                keywordRef.current = '';
                getSug();
                inputRef.current?.focus();
              }}
            >
              <CancelIcon fontSize={'inherit'} style={{ fontSize: 15 }} />
            </div>
          )}
        </div>

        {sug.length !== 0 && showSug ? (
          <ul
            className={'sug'}
            style={{
              width: sugWidth,
            }}
          >
            {sug.map((item, index) => {
              if (index === 0) return null;
              return (
                <a
                  key={index}
                  className={index === sugSelectIndex ? 'selected' : ''}
                  style={{ textDecoration: 'none', cursor: 'pointer' }}
                  onClick={() => {
                    setKeyword(item);
                    setTimeout(() => {
                      Search(item);
                    }, 0);
                  }}
                >
                  <div
                    className={'sugindex'}
                    style={{
                      backgroundColor: index > 3 ? '#afaea0' : '#3b4042',
                    }}
                  >
                    {index}
                  </div>
                  {item}
                </a>
              );
            })}
          </ul>
        ) : null}
        <div
          id={'seaching'}
          ref={searchBtnRef}
          className={'gy-button'}
          style={{ backgroundColor: color }}
          onClick={() => Search()}
        >
          {name}
        </div>
      </div>
    </div>
  );
};

export default observer(HeadBar);
