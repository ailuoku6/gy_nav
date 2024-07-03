import { useState, useMemo } from 'react';
import Divider from '@mui/material/Divider';
import Paper from '@mui/material/Paper';
import Grid from '@mui/material/Grid';
import Input from '@mui/material/Input';
import Button from '@mui/material/Button';
import Fab from '@mui/material/Fab';
// @ts-ignore
import ReactSortable from 'react-sortablejs';
import AddIcon from '@mui/icons-material/Add';
import Site from '../site/Site';
import { useDispatch, useSelector } from 'react-redux';

import AddSiteDialog from '../GyDialog/AddSiteDialog';
import Snackbar from '@mui/material/Snackbar';

import {
  // addPart2Rear,
  addSite2Part,
  delPart as delPartAction,
  // delSite,
  modifyPart,
  // modifySite,
  // setPartition,
  insertPart,
  movePart,
} from '../../redux/actions';

import './index.css';
import { StoreType } from '../../redux/store';
import { DeviceTypes, PartSiteData } from '../../redux/types';
//import './dark.css';

interface IPartitionProps {
  Edit: boolean;
}

const Partition = (props: IPartitionProps) => {
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const [delPartIndex, setDelPartIndex] = useState(-1);
  const [delPart, setDelPart] = useState<PartSiteData | null>(null);

  const { Partition, device } = useSelector<
    StoreType,
    { Partition: PartSiteData[]; device: DeviceTypes }
  >((state) => ({
    Partition: state.Partition.data,
    device: state.Device.device,
  }));

  const dispatch = useDispatch();

  const list = useMemo(() => {
    const pts = Array.isArray(Partition) ? Partition : [];
    console.log(pts);
    const edit = props.Edit;
    return pts.map((item, index) => {
      return (
        <Grid item xs={12} sm={6} md={4} key={index} data-id={item}>
          <Paper
            className={'partition'}
            elevation={2}
            style={{ borderRadius: 6 }}
          >
            {edit === true ? (
              <div className={'editWrap'}>
                <Input
                  value={item.categoryname}
                  className={'flexInput'}
                  onChange={(e) => {
                    // this.props.modifyPart(index, e.target.value);
                    dispatch(modifyPart(index, e.target.value));
                    e.stopPropagation();
                    // console.log(e.target.value)
                  }}
                />
                <Button
                  variant="contained"
                  color="error"
                  style={{ marginLeft: 10, marginRight: 10 }}
                  onClick={() => {
                    setDelPartIndex(index);
                    setDelPart(pts[index]);
                    dispatch(delPartAction(index));
                    console.log('delPart', index);
                  }}
                >
                  删除分区
                </Button>
                <Fab
                  color="secondary"
                  aria-label="add"
                  size={'small'}
                  onClick={() => {
                    setSelectedIndex(index);
                  }}
                >
                  <AddIcon />
                </Fab>
              </div>
            ) : (
              <div className={'title'}>{item.categoryname}</div>
            )}
            <Divider
              style={{ marginTop: 5, marginBottom: 5 }}
              className="divider"
            />
            <Site PartIndex={index} Edit={edit} Sites={item.sitelist} />
          </Paper>
        </Grid>
      );
    });

  }, [Partition, dispatch, props.Edit]);

  const edit = props.Edit;
  const key = 'PlaceHolderKey-' + (edit ? 'on' : 'off');

  return (
    <div className={'gy-container-full'}>
      <ReactSortable
        key={key}
        tag={Grid}
        container={true}
        spacing={2}
        justify={'center'}
        onChange={(_order: any, _sortable: any, evt: any) => {
          dispatch(movePart(evt.oldIndex, evt.newIndex));
        }}
        options={{
          animation: 150,
          easing: 'cubic-bezier(1, 0, 0, 1)',
          ghostClass: 'sortable-ghost',
          disabled: !edit || device === DeviceTypes.phone,
        }}
      >
        {list}
      </ReactSortable>

      <AddSiteDialog
        open={selectedIndex >= 0}
        title={'添加新站点'}
        ConfirmText={'添加'}
        onClose={() => {
          setSelectedIndex(-1);
        }}
        onCancel={() => {
          setSelectedIndex(-1);
        }}
        onConfirm={(siteName, siteAddr) => {
          if (siteName && siteAddr) {
            //这里应该加验证

            dispatch(addSite2Part(selectedIndex, siteName, siteAddr));
          } else {
            console.log('给点东西吧');
          }
          setSelectedIndex(-1);
        }}
      />

      <Snackbar
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
        open={delPartIndex >= 0}
        autoHideDuration={3000}
        onClose={() => {
          setDelPartIndex(-1);
          setDelPart(null);
        }}
        action={
          <Button
            color="primary"
            size="small"
            onClick={() => {
              if (delPart) {
                dispatch(insertPart(delPartIndex, delPart));
                setDelPart(null);
                setDelPartIndex(-1);
              }
            }}
          >
            撤销
          </Button>
        }
        message="已删除"
        key={'jcndjcdjbk'}
      />
    </div>
  );
};

export default Partition;
