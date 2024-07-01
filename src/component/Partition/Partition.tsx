import { useState } from 'react';
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

  const renderPartition = () => {
    let list = [];
    const pts = Array.isArray(Partition) ? Partition : [];
    console.log(pts);
    const edit = props.Edit;
    list = pts.map((item, index) => {
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
                  color="secondary"
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

    return list;
  };

  const edit = props.Edit;
  const key = 'PlaceHolderKey-' + (edit ? 'on' : 'off');

  const list = renderPartition();

  return (
    <div className={'gy-container-full'}>
      {/*<Grid container={true} spacing={2} justify={'center'}>*/}
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
            color="secondary"
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

      {/*<AbsoluteGrid items={pts} />*/}

      {/*</Grid>*/}
    </div>
  );
};

// class Partition1 extends React.Component {
//   // eslint-disable-next-line no-useless-constructor
//   constructor(props) {
//     super(props);
//     this.state = {
//       selectedIndex: -1,
//       //snackbarOpen:true,
//       delPartIndex: -1,
//       delPart: null,
//     };
//   }

//   renderPartition() {
//     let list = [];
//     let pts = Array.isArray(this.props.Partition) ? this.props.Partition : [];
//     console.log(pts);
//     let edit = this.props.Edit;
//     list = pts.map((item, index) => {
//       return (
//         <Grid item xs={12} sm={6} md={4} key={index} data-id={item}>
//           <Paper
//             className={'partition'}
//             elevation={2}
//             style={{ borderRadius: 6 }}
//           >
//             {edit === true ? (
//               <div className={'editWrap'}>
//                 <Input
//                   value={item.categoryname}
//                   className={'flexInput'}
//                   onChange={(e) => {
//                     this.props.modifyPart(index, e.target.value);
//                     e.stopPropagation();
//                     // console.log(e.target.value)
//                   }}
//                 />
//                 <Button
//                   variant="contained"
//                   color="secondary"
//                   style={{ marginLeft: 10, marginRight: 10 }}
//                   onClick={() => {
//                     this.setState({
//                       delPartIndex: index,
//                       delPart: pts[index],
//                     });
//                     this.props.delPart(index);
//                     console.log('delPart', index);
//                   }}
//                 >
//                   删除分区
//                 </Button>
//                 <Fab
//                   color="secondary"
//                   aria-label="add"
//                   size={'small'}
//                   onClick={() => {
//                     this.setState({
//                       selectedIndex: index,
//                     });
//                   }}
//                 >
//                   <AddIcon />
//                 </Fab>
//               </div>
//             ) : (
//               <div className={'title'}>{item.categoryname}</div>
//             )}
//             <Divider
//               style={{ marginTop: 5, marginBottom: 5 }}
//               className="divider"
//             />
//             <Site PartIndex={index} Edit={edit} Sites={item.sitelist} />
//           </Paper>
//         </Grid>
//       );
//     });

//     return list;
//   }

//   render() {
//     //let pts = this.props.Pts;
//     let pts = this.props.Partition;
//     let edit = this.props.Edit;
//     let key = 'PlaceHolderKey-' + (edit ? 'on' : 'off');

//     let list = this.renderPartition();

//     let delPartIndex = this.state.delPartIndex;
//     // const AbsoluteGrid = createAbsoluteGrid(<Cata/>, {Edit:edit});

//     return (
//       <div className={'gy-container-full'}>
//         {/*<Grid container={true} spacing={2} justify={'center'}>*/}
//         <ReactSortable
//           key={key}
//           tag={Grid}
//           container={true}
//           spacing={2}
//           justify={'center'}
//           onChange={(order, sortable, evt) => {
//             // if (!edit) return;
//             console.log('order', order);
//             console.log('sortable', sortable);
//             console.log('evt', evt);
//             // if (evt.oldIndex===list.length-1) return;
//             // let stateList = this.state.list;
//             // let item = stateList[evt.oldIndex];
//             //evt.newIndex

//             this.props.movePart(evt.oldIndex, evt.newIndex);
//           }}
//           options={{
//             animation: 150,
//             easing: 'cubic-bezier(1, 0, 0, 1)',
//             ghostClass: 'sortable-ghost',
//             disabled: !edit || this.props.device === 'phone',
//           }}
//         >
//           {list}
//         </ReactSortable>

//         <AddSiteDialog
//           open={this.state.selectedIndex >= 0}
//           title={'添加新站点'}
//           ConfirmText={'添加'}
//           onClose={() => {
//             this.setState({
//               selectedIndex: -1,
//             });
//           }}
//           onCancel={() => {
//             this.setState({
//               selectedIndex: -1,
//             });
//           }}
//           onConfirm={(siteName, siteAddr) => {
//             if (siteName && siteAddr) {
//               //这里应该加验证
//               this.props.addSite2Part(
//                 this.state.selectedIndex,
//                 siteName,
//                 siteAddr
//               );
//             } else {
//               console.log('给点东西吧');
//             }
//             this.setState({
//               selectedIndex: -1,
//             });
//           }}
//         />

//         <Snackbar
//           anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
//           open={delPartIndex >= 0}
//           autoHideDuration={3000}
//           onClose={() => {
//             this.setState({
//               delPartIndex: -1,
//               delPart: null,
//             });
//           }}
//           action={
//             <Button
//               color="secondary"
//               size="small"
//               onClick={() => {
//                 this.props.insertPart(delPartIndex, this.state.delPart);
//                 this.setState({
//                   delPartIndex: -1,
//                   delPart: null,
//                 });
//               }}
//             >
//               撤销
//             </Button>
//           }
//           message="已删除"
//           key={'jcndjcdjbk'}
//         />

//         {/*<AbsoluteGrid items={pts} />*/}

//         {/*</Grid>*/}
//       </div>
//     );
//   }
// }

// const mapStateToProps = ({ Partition, Device }) => ({
//   Partition: Partition.data,
//   device: Device.device,
// });

// const mapDispatchToProps = {
//   addPart2Rear,
//   addSite2Part,
//   delPart,
//   delSite,
//   modifyPart,
//   modifySite,
//   setPartition,
//   insertPart,
//   movePart,
// };

// export default connect(mapStateToProps, mapDispatchToProps)(Partition);

export default Partition;
