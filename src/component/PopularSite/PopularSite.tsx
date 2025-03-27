import './index.css';
//import './dark.css';
import Divider from '@mui/material/Divider';
import { useSelector } from 'react-redux';

import { StoreType } from '../../redux/store';

// import { setPopularSite } from '../../redux/actions';

const PopularSite = () => {
  const { popularSite } = useSelector<
    StoreType,
    { popularSite: StoreType['PopularSite'] }
  >((state) => ({
    popularSite: state.PopularSite,
  }));

  // const dispatch = useDispatch();

  const pts = popularSite.pSite;

  return (
    <div className={'gy-container gy-shadow-2'}>
      <div className={'title'}>常用站点</div>
      <Divider className="divider" />
      <div className={'site-container'}>
        {pts.map((item, index) => {
          return (
            <div key={index}>
              <li className={'gy-hoverable site'}>
                <a
                  style={{ textDecoration: 'none' }}
                  href={item.url}
                  target="_blank"
                >
                  <img className={'site-icon'} src={item.icon} />
                  <span className={'site-title'}>{item.site_name}</span>
                </a>
              </li>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default PopularSite;
