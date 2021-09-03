import baidu from '../assets/baidu.png';
import taobao from '../assets/taobao.png';
import jd from '../assets/jd.png';
import zhihu from '../assets/zhihu.png';
import googlefanyi from '../assets/googlefanyi.png';
import github from '../assets/github.png';
import qqmail from '../assets/qqmail.png';
import weibo from '../assets/weibo.png';
import wangyiyun from '../assets/wangyiyun.png';

const data = [
    {
        categoryname:"酷站",
        sitelist:[
          {site_name:"创造狮",url:"http://www.chuangzaoshi.com/"},
          {site_name:"果壳网",url:"http://www.guokr.com"},
          {site_name:"36氪",url:"http://36kr.com"},
          {site_name:"网易公开课",url:"http://open.163.com"},
          {site_name:"中国科学引文数据库",url:"http://sdb.csdl.ac.cn"},
          {site_name:"CALIS学位论文库",url:"http://www.calis.edu.cn"},
          {site_name:"Justin Guitar",url:"http://www.justinguitar.com"},
          {site_name:"中国知网",url:"http://www.cnki.net"},
          {site_name:"中国大学MOOC",url:"http://www.icourse163.org/"}
        ],
      },
      {
        categoryname:"办公与邮箱",
        sitelist:[
          {site_name:"演界网",url:"http://www.yanj.cn"},
          {site_name:"officeplus",url:"http://office.mmais.com.cn/Template/Home.shtml"},
          {site_name:"欧酷PPT",url:"http://www.pptxok.com"},
          {site_name:"稻壳网",url:"http://www.docer.com"},
          {site_name:"Material Design文档",url:"https://www.mdui.org/design/material-design/introduction.html#"},
          {site_name:"网易163邮箱",url:"http://mail.163.com/"},
          {site_name:"QQ邮箱",url:"https://mail.qq.com"},
          {site_name:"阿里邮箱",url:"https://mail.aliyun.com/"},
        ],
      },
      {
        categoryname:"音乐与视频",
        sitelist:[
          {site_name:"QQ音乐",url:"https://y.qq.com/"},
          {site_name:"网易云音乐",url:"http://music.163.com/"},
          {site_name:"酷狗音乐",url:"http://www.kugou.com/"},
          {site_name:"百度音乐",url:"http://music.baidu.com/"},
          {site_name:"腾讯视频",url:"https://v.qq.com/"},
          {site_name:"优酷视频",url:"http://www.youku.com/"},
          {site_name:"爱奇艺视频",url:"http://www.iqiyi.com/"},
          {site_name:"哔哩哔哩",url:"https://www.bilibili.com/"},
          {site_name:"乐视视频",url:"http://www.le.com/"}
        ],
      },
      {
        categoryname:"少壮不努力，长大学设计",
        sitelist:[
          {site_name:"创意人",url:"http://www.ccihr.com"},
          {site_name:"全景网",url:"http://www.quanjing.com/"},
          {site_name:"花瓣网",url:"http://www.huaban.com"},
          {site_name:"UI中国",url:"http://www.ui.cn/"},
          {site_name:"千图网",url:"http://www.58pic.com/"},
          {site_name:"Dribbble",url:"https://dribbble.com/"},
          {site_name:"阿里图标平台",url:"http://www.iconfont.cn/plus"},
          {site_name:"Easyicon",url:"http://www.easyicon.net/"},
          {site_name:"Sketch站点资源",url:"http://sketch.im/"},
        ],
      },
      {
        categoryname:"购物与剁手",
        sitelist:[
          {site_name:"淘宝网",url:"https://www.taobao.com/"},
          {site_name:"天猫商城",url:"https://www.tmall.com"},
          {site_name:"京东商城",url:"http://www.jd.com"},
          {site_name:"当当网",url:"http://www.dangdang.com"},
          {site_name:"亚马逊",url:"https://www.amazon.cn/"},
          {site_name:"苏宁易购",url:"https://www.suning.com"},
          {site_name:"闲鱼二手",url:"https://2.taobao.com/"},
          {site_name:"支付宝",url:"https://www.alipay.com/"},
          {site_name:"小米商城",url:"https://www.mi.com/"},
          {site_name:"快递100",url:"http://www.kuaidi100.com/"}
        ],
      },
      {
        categoryname:"实用在线小工具",
        sitelist:[
          {site_name:"图片在线压缩",url:"http://cut.ailuoku6.top/"},
          {site_name:"图片无损放大",url:"http://waifu2x.udp.jp/"},
          {site_name:"草料二维码",url:"https://cli.im/"},
          {site_name:"PS网页版",url:"http://www.uupoop.com/"},
          {site_name:"在线进制转换",url:"http://tool.lu/hexconvert/"},
          {site_name:"邮编区号查询",url:"http://tool.lu/zipcode/"},
          {site_name:"百度网盘搜索",url:"http://www.pansoso.com/"},
          {site_name:"微词云",url:"https://www.weiciyun.com/"},
          {site_name:"更多在线工具",url:"http://tool.lu/"},
        ],
      },
    ];

const popularSite = [
    {site_name:"百度",url:"https://www.baidu.com/",icon:baidu},
    {site_name:"淘宝",url:"https://www.taobao.com",icon:taobao},
    {site_name:"京东",url:"https://www.jd.com",icon:jd},
    {site_name:"知乎",url:"https://www.zhihu.com",icon:zhihu},
    {site_name:"谷歌翻译",url:"https://translate.google.cn/",icon:googlefanyi},
    {site_name:"Github",url:"https://github.com/",icon:github},
    {site_name:"QQ邮箱",url:"https://mail.qq.com",icon:qqmail},
    {site_name:"新浪微博",url:"https://weibo.com",icon:weibo},
    {site_name:"网易云音乐",url:"https://music.163.com",icon:wangyiyun},
]

export {popularSite};

export default data
