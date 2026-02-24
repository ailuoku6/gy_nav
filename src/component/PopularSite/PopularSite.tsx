import { useState } from 'react';
import './index.css';
import Divider from '@mui/material/Divider';
import Fab from '@mui/material/Fab';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
// @ts-ignore
import ReactSortable from 'react-sortablejs';
import { appStore } from '../../store/AppStore';
import { observer } from 'kisstate';
import AddPopularSiteDialog from '../GyDialog/AddPopularSiteDialog';
import SiteIcon from './SiteIcon';
import { PopularSite as IPopularSite } from '../../types';

const getFaviconUrl = (url: string) => {
  try {
    const u = new URL(url);
    return `${u.origin}/favicon.ico`;
  } catch {
    return '';
  }
};

interface PopularSiteProps {
  Edit?: boolean;
}

const PopularSite = (props: PopularSiteProps) => {
  const [selectedIndex, setSelectedIndex] = useState<-1 | number>(-1);
  const [isAddMode, setIsAddMode] = useState(false);

  const pts = appStore.pSite;
  const edit = props.Edit ?? false;
  const key = 'PopularSite-' + (edit ? 'on' : 'off');

  return (
    <div className={'gy-container gy-shadow-2'}>
      <div className={'title'}>常用站点</div>
      <Divider className="divider" />
      <ReactSortable
          key={key}
          tag="div"
          className="site-container"
          onChange={(_order: any, _sortable: any, evt: any) => {
            if (!edit) return;
            appStore.movePopularSite(evt.oldIndex, evt.newIndex);
          }}
          options={{
            animation: 150,
            easing: 'cubic-bezier(1, 0, 0, 1)',
            ghostClass: 'sortable-ghost',
            disabled: !edit,
          }}
        >
          {pts.map((item: IPopularSite, index: number) => {
            const iconSrc =
              item.icon || getFaviconUrl(item.url || '') || '';
            const siteStatus = appStore.getSiteHealth(item.url);
            const isUnreachable = siteStatus === 'fail';
            return (
              <div key={index} className={'popular-site-item'}>
                <li
                  className={
                    isUnreachable
                      ? 'gy-hoverable site site-unreachable'
                      : 'gy-hoverable site'
                  }
                  title={isUnreachable ? '无法访问' : undefined}
                >
                  {isUnreachable && (
                    <span className="site-status-badge">不可用</span>
                  )}
                  <a
                    style={{ textDecoration: 'none' }}
                    href={edit ? undefined : item.url}
                    target={edit ? undefined : '_blank'}
                    onClick={(e) => edit && e.preventDefault()}
                  >
                    <SiteIcon
                      className={'site-icon'}
                      src={iconSrc}
                      alt={item.site_name}
                    />
                    <span className={'site-title'}>{item.site_name}</span>
                  </a>
                  {edit && (
                    <div className={'delMenu popular-site-del-menu'}>
                      <div
                        className={'popular-site-edit-btn'}
                        onClick={() => setSelectedIndex(index)}
                      >
                        <EditIcon
                          fontSize={'small'}
                          color={'inherit'}
                          style={{ color: '#fff' }}
                        />
                      </div>
                      <div
                        className={'popular-site-del-btn'}
                        onClick={() => appStore.delPopularSite(index)}
                      >
                        <DeleteIcon
                          fontSize={'small'}
                          color={'inherit'}
                          style={{ color: '#fff' }}
                        />
                      </div>
                    </div>
                  )}
                </li>
              </div>
            );
          })}
        </ReactSortable>
      {edit && (
        <div className={'popular-site-add-wrap'}>
          <Fab
            color="secondary"
            size={'small'}
            aria-label="add"
            onClick={() => setIsAddMode(true)}
          >
            <AddIcon />
          </Fab>
        </div>
      )}

      <AddPopularSiteDialog
        open={isAddMode}
        title={'添加常用站点'}
        ConfirmText={'添加'}
        onClose={() => setIsAddMode(false)}
        onCancel={() => setIsAddMode(false)}
        onConfirm={(siteName, siteAddr, icon) => {
          if (siteName && siteAddr) {
            appStore.addPopularSite(siteName, siteAddr, icon);
          }
          setIsAddMode(false);
        }}
      />

      {selectedIndex >= 0 && (
        <AddPopularSiteDialog
          open={selectedIndex >= 0}
          title={'编辑常用站点'}
          ConfirmText={'修改'}
          defaultName={pts[selectedIndex]?.site_name}
          defaultAddr={pts[selectedIndex]?.url}
          defaultIcon={pts[selectedIndex]?.icon || ''}
          onClose={() => setSelectedIndex(-1)}
          onCancel={() => setSelectedIndex(-1)}
          onConfirm={(siteName, siteAddr, icon) => {
            if (siteName && siteAddr) {
              appStore.modifyPopularSite(selectedIndex, siteName, siteAddr, icon);
            }
            setSelectedIndex(-1);
          }}
        />
      )}
    </div>
  );
};

export default observer(PopularSite);
