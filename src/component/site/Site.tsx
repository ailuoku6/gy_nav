import { useState } from 'react';
import './index.css';
//import './dark.css';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
// @ts-ignore
import ReactSortable from 'react-sortablejs';

import { appStore } from '../../store/AppStore';
import { observer } from 'kisstate';

// @ts-ignore
import AddSiteDialog from '../GyDialog/AddSiteDialog';

const Site = ({
  Sites: sites = [],
  PartIndex,
  Edit,
}: {
  Sites: { site_name: string; url: string; id?: number }[];
  PartIndex?: number;
  Edit?: boolean;
}) => {
  const [selectedIndex, setSelectedIndex] = useState(-1);

  const edit = Edit && PartIndex !== null;
  const partIndex =
    PartIndex !== undefined && PartIndex !== null ? PartIndex : -1;
  const key = 'PlaceHolderKey-' + (edit ? 'on' : 'off');

  const { device } = appStore;

  return (
    <div>
      <ReactSortable
        key={key}
        onChange={(_order: any, _sortable: any, evt: any) => {
          if (partIndex < 0) return;
          appStore.moveSite(partIndex, evt.oldIndex, evt.newIndex);
        }}
        options={{
          animation: 150,
          easing: 'cubic-bezier(1, 0, 0, 1)',
          ghostClass: 'sortable-ghost',
          disabled: !edit,
        }}
      >
        {sites.map((item, index) => {
          const siteStatus = appStore.getSiteHealth(item.url);
          const isUnreachable = siteStatus === 'fail';
          return (
            <div
              className={
                isUnreachable
                  ? 'site-noicon gy-hoverable site-unreachable'
                  : 'site-noicon gy-hoverable'
              }
              key={index}
              style={edit ? { minWidth: 40 } : undefined}
              title={isUnreachable ? '无法访问' : undefined}
            >
              {isUnreachable && (
                <span className="site-status-badge">不可用</span>
              )}
              {edit && device === 'phone' ? (
                <div>{item.site_name ? item.site_name : '网站名缺失'}</div>
              ) : (
                <a href={item.url ? item.url : ''} target={'_blank'}>
                  {item.site_name ? item.site_name : '网站名缺失'}
                </a>
              )}

              {edit === true && (
                <div className={'delMenu'}>
                  <div
                    style={{
                      width: '50%',
                      height: '100%',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      padding: 5,
                      borderRadius: 5,
                      backgroundColor: '#2525b1a1',
                    }}
                    onClick={() => {
                      setSelectedIndex(index);
                    }}
                  >
                    <EditIcon
                      fontSize={'small'}
                      color={'inherit'}
                      style={{ color: '#fff' }}
                    />
                  </div>
                  <div
                    style={{
                      width: '50%',
                      height: '100%',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      padding: 5,
                      borderRadius: 5,
                      backgroundColor: '#ff0000b8',
                    }}
                    onClick={() => {
                      appStore.delSite(partIndex, index);
                    }}
                  >
                    <DeleteIcon
                      fontSize={'small'}
                      color={'inherit'}
                      style={{ color: '#fff' }}
                    />
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </ReactSortable>
      {selectedIndex >= 0 && (
        <AddSiteDialog
          open={selectedIndex >= 0}
          title={'编辑站点'}
          ConfirmText={'修改'}
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
              appStore.modifySite(partIndex, selectedIndex, siteName, siteAddr);
            } else {
              console.log('给点东西吧');
            }
            setSelectedIndex(-1);
          }}
        />
      )}
    </div>
  );
};

export default observer(Site);
