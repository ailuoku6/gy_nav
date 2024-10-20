import { useCallback, useEffect, useRef, useState } from 'react';
import './index.css';
//import './dark.css';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import Collapse from '@mui/material/Collapse';
import CancelIcon from '@mui/icons-material/Cancel';
import { useDispatch, useSelector } from 'react-redux';
import {
  setSugShow,
  setMarchineShow,
  setMarchineIndex,
} from '../../redux/actions';
import Marchinelist from '../../utils/SearchMarchine';
import { linkPattern } from '../../utils/veriLink';
// @ts-ignore
import eventBus from '../../utils/EventEmitter';
import { homeKeyDown } from '../../utils/Events';
import { StoreType } from '../../redux/store';
import { DeviceTypes } from '../../redux/types';
import { sugObservable, sugSubject } from './utils';

interface IHeadBarProps {
  Scrolled: boolean;
}

const HeadBar = ({ Scrolled }: IHeadBarProps) => {
  // const [showMarchine, setShowMarchine] = useState(false);
  const [sug, setSug] = useState([]);
  // const [showSug, setShowSug] = useState(false);
  const [keyWord, setKeyword] = useState('');
  // const [Marchineselect_index, setMarchineselect_index] = useState(0);
  const [sugSelectIndex, setSugSelectIndex] = useState(0);

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [_random, setRandom] = useState(0);

  const { device, marchine, showSug, selectMcIndex } = useSelector<
    StoreType,
    {
      device: DeviceTypes;
      marchine: boolean;
      showSug: boolean;
      selectMcIndex: number;
    }
  >(({ Device, Show, MarchineIndex }) => ({
    device: Device.device,
    marchine: Show.marchine,
    showSug: Show.sug,
    selectMcIndex: MarchineIndex.index,
  }));

  const dispatch = useDispatch();

  const inputRef = useRef<HTMLInputElement>(null);

  const handleHomeKeyDown = (e: any) => {
    // console.log('headbar reciver', e.target.tagName);
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
      dispatch(setSugShow(!!sugs.length));

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
    dispatch(setMarchineShow(false));
    if (newshowSug === true) {
      getSug();
      return;
    }
    dispatch(setSugShow(newshowSug));
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
        dispatch(setMarchineShow(false));
        dispatch(setSugShow(false));
      }}
    >
      <div className={'sear_wrap'} ref={wrapRef} style={{ borderColor: color }}>
        <div className={'sear_marchine'}>
          <ExpandMoreIcon
            fontSize={'inherit'}
            style={{ fontSize: 15 }}
            onClick={(e) => {
              dispatch(setMarchineShow(!marchine));
              dispatch(setSugShow(false));
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
                  onClick={() => {
                    dispatch(setMarchineIndex(index));
                    dispatch(setMarchineShow(false));
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

export default HeadBar;
