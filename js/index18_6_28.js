
var allsite = new Vue({
  el:"#allsite",
  data:{
    //常用栏列表
    comsitelist:[
      {site_name:"百度",url:"https://www.baidu.com/",icon:"img/baidu.png"},
      {site_name:"淘宝",url:"https://www.taobao.com",icon:"img/taobao.png"},
      {site_name:"京东",url:"https://www.jd.com",icon:"img/jd.png"},
      {site_name:"知乎",url:"https://www.zhihu.com",icon:"img/zhihu.png"},
      {site_name:"谷歌翻译",url:"https://translate.google.cn/",icon:"img/googlefanyi.png"},
      {site_name:"Github",url:"https://www.github.com",icon:"img/github.png"},
      {site_name:"QQ邮箱",url:"https://mail.qq.com",icon:"img/qqmail.png"},
      {site_name:"新浪微博",url:"https://weibo.com",icon:"img/weibo.png"},
      {site_name:"网易云音乐",url:"https://music.163.com",icon:"img/wangyiyun.png"},
    ],
    //分区列表
    categorylist:[
      {
        categoryname:"酷站",
        isAdd:false,
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
        isAdd:false,
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
        isAdd:false,
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
        isAdd:false,
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
        isAdd:false,
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
        isAdd:false,
        sitelist:[
          {site_name:"图片在线压缩",url:"http://optimizilla.com/zh/"},
          {site_name:"图片无损放大",url:"http://waifu2x.udp.jp/"},
          {site_name:"草料二维码",url:"https://cli.im/"},
          {site_name:"PS网页版",url:"http://www.uupoop.com/"},
          {site_name:"在线进制转换",url:"http://tool.lu/hexconvert/"},
          {site_name:"邮编区号查询",url:"http://tool.lu/zipcode/"},
          {site_name:"百度网盘搜索",url:"http://www.pansoso.com/"},
          {site_name:"更多在线工具",url:"http://tool.lu/"}
        ],
      },
    ],
    Marchinelist:[
      {Marchine_name:"百度",button_value:"百度一下",searApi:"https://www.baidu.com/s?wd=",searApi_weizui:"",color:"#38F"},
      {Marchine_name:"谷歌",button_value:"谷歌一下",searApi:"https://www.google.com/#q=",searApi_weizui:"",color:"#3b78e7"},
      {Marchine_name:"搜狗",button_value:"搜狗搜索",searApi:"https://www.sogou.com/web?query=",searApi_weizui:"",color:"#ff5943"},
      {Marchine_name:"360搜索",button_value:"360搜",searApi:"https://www.so.com/s?ie=utf-8&fr=none&src=360sou_newhome&q=",searApi_weizui:"",color:"#19b955"},
      {Marchine_name:"必应搜索",button_value:"必应搜索",searApi:"https://www.bing.com/search?q=",searApi_weizui:"",color:"#1688b1"},
      {Marchine_name:"知乎搜索",button_value:"知乎搜索",searApi:"https://www.zhihu.com/search?type=content&q=",searApi_weizui:"",color:"#0077e6"},
      {Marchine_name:"百度文库",button_value:"搜文库",searApi:"https://wk.baidu.com/search?word=",searApi_weizui:"",color:"#38F"},
      {Marchine_name:"图片搜索",button_value:"图片搜索",searApi:"http://image.so.com/i?q=",searApi_weizui:"&src=srp",color:"#19b955"},
      {Marchine_name:"贴吧",button_value:"贴吧搜索",searApi:"https://tieba.baidu.com/f?kw=",searApi_weizui:"",color:"#38F"},
      {Marchine_name:"知道",button_value:"百度知道",searApi:"https://zhidao.baidu.com/search?word=",searApi_weizui:"",color:"#38F"},
      {Marchine_name:"网盘",button_value:"搜网盘",searApi:"http://www.panduoduo.net/s/name/",searApi_weizui:"",color:"#3f51b5"},
      {Marchine_name:"csdn",button_value:"搜csdn",searApi:"http://so.csdn.net/so/search/s.do?q=",searApi_weizui:"",color:"#be1a21"},
    ],
    friendlink:[
      {site_name:"爱达导航",url:"https://ada97.com/"},
      {site_name:"小呆导航",url:"http://webjike.com/"},
      {site_name:"悠悠导航",url:"https://uu456.cn/"},
      {site_name:"龙喵导航",url:"http://longmiao.wang/"},
      {site_name:"聚神铺导航",url:"http://jspoo.com/"},
      {site_name:"RioHsc",url:"https://riohsc.github.io/"},
      {site_name:"友链申请",url:"http://mail.qq.com/cgi-bin/qm_share?t=qm_mailme&email=zK2loLmjp7n6jL294q_joQ"},
    ],
    formInline: {
        user: '',
        password: '',
        comfpassword:''
    },
    button_value:"百度一下",
    searApi:"",
    searApi_weizui:"",
    searchEngineindex:0,
    scrolled:false,
    myData:[],
    keyword:'',
    keysug:'',
    sel_index:0,
    isShow :false,
    isShowSelect:false,
    flag :"pc",
    sugflag: false,
    edit: false,
    inputSitename:"",
    inputUrl:"",
    apiUrl:'https://sp0.baidu.com/5a1Fazu8AA54nxGko9WTAnF6hhy/su?wd',
    pattern: /(http|ftp|https):\/\/[\w\-_]+(\.[\w\-_]+)+([\w\-\.,@?^=%&:\/~\+#]*[\w\-\@?^=%&\/~\+#])?/,
    addpattern: /http/,
    color:'#7265e6',
    username:"未登录",
  },
  methods: {
    handleScroll:function() {
      if ((window.pageYOffset || document.documentElement.scrollTop || document.body.scrollTop) == 0) {
        this.scrolled = false;
      }else {
        this.scrolled = true;
      }
    },
    hidesug:function(item){
      if (item == "all") {
        this.isShow = false;
        this.isShowSelect = false;
      }else if (item == "sug") {
        this.isShow = false;
      }else {
        this.isShowSelect = false;
        this.sugflag = ~ this.sugflag;
        if (this.sugflag) {
          this.isShow = true;
        }else {
          this.isShow = false;
        }
      }
    },
    changeMarchine:function() {
      this.isShowSelect = ~ this.isShowSelect;
      this.isShow = false;//收起搜索建议
    },
    //选择搜索引擎
    selectMarchine:function(index){
      this.button_value = this.Marchinelist[index].button_value;
      this.searApi = this.Marchinelist[index].searApi;
      this.searApi_weizui = this.Marchinelist[index].searApi_weizui;
      this.searchEngineindex = index;
      localStorage.searApi = this.searApi;
      localStorage.searchEngine = this.searchEngineindex;
    },
    //发起搜索
    baiduyixia:function (){
      this.isShowSelect = false;
      if (this.pattern.test(this.keyword)) {//判断是否是网址
        if (this.flag == "phone") {
          window.location.href=this.keyword;
        }else {
          window.open(this.keyword);
        }
      }else {
        if (this.flag == "phone") {
          window.location.href=this.searApi+this.keyword+this.searApi_weizui;
        }else {
          window.open(this.searApi+this.keyword+this.searApi_weizui);
        }
      }
    },
    selectDown:function () {
        this.sel_index = ++this.sel_index%this.myData.length;
        this.keyword=this.myData[this.sel_index];
    },
    selectUp:function () {
        this.sel_index = (this.myData.length+(--this.sel_index))%this.myData.length;
        this.keyword=this.myData[this.sel_index];
    },
    //请求搜索建议数据
    requestData:function(){
      this.$http.jsonp(this.apiUrl,{
           wd:this.keyword
      },{
           jsonp:'cb'
      }).then(function (res) {
           this.myData=res.data.s;
           this.myData.splice(0,0,this.keyword);
      },function () {

      });
      this.sel_index = 0;
      if (this.keyword.replace(/(^s*)|(s*$)/g, "")!="") {
        this.isShow = true;
      }else {
        this.isShow = false;
      }
    },
    //清空输入框
    cleanKeyword:function(){
      this.keyword = '';
      this.requestData();
      if (this.flag != "phone") {
        this.$refs.input_area.focus();
      }
    },
    //删除网站
    deleteItem:function (category_index,index){
      this.categorylist[category_index].sitelist.splice(index, 1);
      if(this.categorylist[category_index].sitelist.length<1){
        this.categorylist.splice(category_index,1);
      }
    },
    addItem:function (category_index){
      if (!(this.addpattern.test(this.inputUrl))) {
        this.inputUrl = "http://"+this.inputUrl;
        console.log("没有https");
      }
      var newSite = {site_name:this.inputSitename,url:this.inputUrl};
      this.categorylist[category_index].sitelist.push(newSite);
      //清空两个输入框
      this.inputSitename="";
      this.inputUrl="";
      this.categorylist[category_index].isAdd = false;
    },
    //添加分区
    addCate:function(){
      var newCate = {
        categoryname:"",
        isAdd:false,
        sitelist:[],
      };
      this.categorylist.push(newCate);
    },
    //删除分区
    deleteCate:function(category_index){
      this.categorylist.splice(category_index,1);
    },
    editMode:function(){
      this.edit = ~this.edit;
    },
    //判断设备
    judge:function(){
      var sUserAgent=navigator.userAgent;
      var mobileAgents=['Android','iPhone','Symbian','WindowsPhone','iPod','BlackBerry','Windows CE'];
      for( var i=0;i<mobileAgents.length;i++){
        if(sUserAgent.indexOf(mobileAgents[i]) > -1){
            this.flag = "phone";
            break;
        }
      }
    },
    postdata:function(){//上载数据
      this.$http.post("http://nav.ailuoku6.top/postdata.php",{
        "name":this.formInline.user,
        "passwoed":this.formInline.password,
        "userdata":localStorage.siteData1,
      },{emulateJSON:true})
      .then(
        (response)=>{
          // console.log(response);
          if (response.data.code==0) {
            // console.log("succ");
          }
        },
        (error)=>{
          console.log(error);
        }
      );
    },
    sycndata:function(){//下载数据
      this.$http.post("http://nav.ailuoku6.top/signin.php",{
        "name":this.formInline.user,
        "passwoed":this.formInline.password,
      },{emulateJSON:true})
      .then(
        (response)=>{
          // console.log(response);
          if (response.data.code==0) {
            // console.log("succ");
            this.categorylist = JSON.parse(response.data.msg);
          }else {
            if (localStorage.siteData1) {
              this.categorylist=JSON.parse(localStorage.siteData1);
            }else {
              localStorage.siteData1 = JSON.stringify(this.categorylist);
            }
          }
        },
        (error)=>{
          console.log(error);
          if (localStorage.siteData1) {
            this.categorylist=JSON.parse(localStorage.siteData1);
          }else {
            localStorage.siteData1 = JSON.stringify(this.categorylist);
          }
        }
      );
    },
    //初始化
    page_init:function(){
      //初始化搜索建议框长度
      this.$refs.sug.style.width = this.$refs.input_area.clientWidth + 25 + 'px';
      if (localStorage.searApi) {//初始化searapi
        this.searApi = localStorage.searApi;
      }
      else {
        this.searApi = "https://www.baidu.com/s?wd=";
        localStorage.searApi = this.searApi;
      }
      if (localStorage.searchEngine||localStorage.searchEngine==0) {//初始化searchEngine
        this.searchEngineindex = localStorage.searchEngine;
      }
      else {
        this.searchEngineindex = 0;
        localStorage.searchEngine = this.searchEngineindex;
      }
      this.selectMarchine(this.searchEngineindex);
      if (localStorage.userpre) {
        this.formInline = JSON.parse(localStorage.userpre);
        if (this.formInline.user) {
          this.username = this.formInline.user;
        }
      }
      this.sycndata();
    },
  },
  watch:{
    'categorylist':{
      handler:function(newValue,oldValue){
        var data = JSON.stringify(newValue);
        localStorage.siteData1 = data;
        this.postdata();
      },
      deep:true,
    }
  },
  mounted:function () {
    window.addEventListener('scroll', this.handleScroll);
    this.judge();
    this.page_init();
  },
  destroyed:function () {
    window.removeEventListener('scroll', this.handleScroll)
  },
});
