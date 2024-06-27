import React, { useState, useEffect } from 'react';
import Site from '../site/Site';
import './index.css';
//import './dark.css';
import { get } from '../../utils/http';
import { GetAllFS } from '../../utils/Api';

const FriendSite = () => {
  const [sites, setSites] = useState([]);

  useEffect(() => {
    get(GetAllFS, {})
      .then((data) => {
        if (data.result) {
          this.setState({
            sites: data.fsites,
          });
        }
      })
      .catch((err) => {
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
