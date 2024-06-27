import './index.css';
import github from '../../assets/github-light.png';

const Footer = () => {
  return (
    <footer>
      <div className={'about'}>
        <div className="beian">
          反馈与建议: <a href="mailto:ailuoku6@qq.com">ailuoku6@qq.com</a>
          <a href="https://github.com/ailuoku6/gy_nav" target="_blank">
            <img
              style={{
                height: 25,
                width: 25,
                marginLeft: 6,
                marginBottom: -6,
              }}
              src={github}
            />
          </a>
        </div>
        <div className={'beian'}>
          网站备案号:
          <a href="http://www.beian.miit.gov.cn/" target="_blank">
            桂ICP备18003700号
          </a>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
