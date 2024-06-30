import { useState, useEffect } from 'react';
import Site from '../site/Site';
import './index.css';
//import './dark.css';
// TODO
// @ts-ignore
import { get } from '../../utils/http';
import { GetAllFS } from '../../utils/Api';
import { ISite } from '../../redux/types';

const FriendSite = () => {
  const [sites, setSites] = useState<ISite[]>([]);

  useEffect(() => {
    get(GetAllFS, {})
      .then((data: { result: boolean; fsites: ISite[] }) => {
        if (data.result) {
          // this.setState({
          //   sites: data.fsites,
          // });
          setSites(data.fsites);
        }
      })
      .catch((err: any) => {
        console.log(err);
      });
  }, []);

  return (
    <div className={'footer gy-shadow-2'}>
      友情链接:
      <Site Edit={false} Sites={sites} />
    </div>
  );
};

export default FriendSite;
