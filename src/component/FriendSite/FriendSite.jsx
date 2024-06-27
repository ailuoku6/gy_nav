import React from 'react';
import Site from '../site/Site';
import './index.css';
//import './dark.css';
import { get } from '../../utils/http';
import { GetAllFS } from '../../utils/Api';

class FriendSite extends React.Component {
  // eslint-disable-next-line no-useless-constructor
  constructor(props) {
    super(props);
    this.state = {
      sites: [],
    };
  }

  componentDidMount() {
    // get('GetAllFs',{}).then((result)=>{
    //     console.log(result)
    // })
    // get('GetAllFs',{}).then((data)=>{
    //     this.setState({
    //         sites:data
    //     })
    //     // console.log(data)
    // }).catch((err)=>{
    //     // console.log(err)
    // })

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
  }

  render() {
    return (
      <div className={'footer gy-shadow-2'}>
        友情链接:
        <Site Edit={false} Sites={this.state.sites} />
      </div>
    );
  }
}

export default FriendSite;
