<template>
  <div id="allsite" @click="hidesug('all')">
    <header class="nav-header">
      <div class="gy-nav-header" v-bind:class="{'gy-shadow-2': scrolled,'gy-hoverable': flag!='phone'}">
        <!-- 搜索框 -->
        <div class="sear_wrap" @click.stop="" :style="{'border-color': Marchinelist[searchEngineindex].color,'border-width':border_width+'px'}">
          <div class="sear_marchine" @click="changeMarchine()">
            <mu-icon value="expand_more" size="15"></mu-icon>
            <mu-expand-transition>
              <ul class="sug" id="sear_marchine_select" v-show="isShowSelect">
                <a v-for="(marchinelist,index) in Marchinelist" @click="selectMarchine(index)" :class="{selected:searchEngineindex==index}" class="sug_list">{{marchinelist.Marchine_name}}</a>
              </ul>
            </mu-expand-transition>
          </div>
          <div id="seacing_bar">
            <input type="text" id="input_bar" placeholder="搜你所想" v-model="keyword" @keyup.enter.prevent="baiduyixia" @keydown.down.prevent="selectDown" @keydown.up.prevent="selectUp" ref="input_area" autocomplete="off" @click="hidesug()" @input="requestData">
            <div style="display:  flex;align-items:  center;" v-if="keyword" @click="cleanKeyword()">
              <mu-icon value="cancel" size="15"></mu-icon>
            </div>
          </div>
          <div class="gy-button" id="seaching" @click="baiduyixia()" :style="{'background-color': Marchinelist[searchEngineindex].color}">{{button_value}}</div>
          <ul class="sug" v-show="isShow" ref="sug">
            <a v-for="(value,index) in myData" v-show="index!=0" :class="{selected:index==sel_index}" v-bind:href="[searApi+encodeURIComponent(value)+searApi_weizui]" target="_blank" class="sug_plus"><div class="sugindex" :style="{'background-color': (index>3) ? '#afaea0' : '#3b4042'}">{{index}}</div>{{value}}</a>
            <!-- <a v-for="(value,index) in myData" v-show="index!=0" :class="{selected:index==sel_index}" v-bind:href="[searApi+value+searApi_weizui]" target="_blank" class="sug_plus"><div class="sugindex" :style="{'background-color': (index>3) ? '#afaea0' : '#3b4042'}">{{index}}</div>{{value}}</a> -->
          </ul>
        </div>
      </div>
    </header>

    <div class="gy-container gy-shadow-2" id="first_container">
      <div class="title" id="">常用站点</div>
      <div class="gy-divider gy-divider-coustom"></div>
      <mu-row>
        <div  v-for="sitelist in comsitelist" class="gy-cell">
          <li class="site gy-hoverable">
            <a v-bind:href="sitelist.url" target="_blank">
              <div>
                <img v-bind:src="sitelist.icon" class="site-icon">
              </div>
              <span class="site-title">{{sitelist.site_name}}</span>
            </a>
          </li>
        </div>
      </mu-row>
    </div>

    <div class="gy-container-full">
      <mu-row gutter justify-content="center">
        <mu-col span="12" sm="6" lg="4" v-for="(category,category_index) in categorylist">
          <div class="site-card gy-shadow-2">
            <div class="title" v-if="~edit">{{category.categoryname}}</div>
            <div style="margin-bottom: -28px;" v-else>
              <mu-text-field v-model="category.categoryname" placeholder="输入分区名" style="max-width: 50%;"></mu-text-field>
              <mu-button color="error" small @click="deleteCate(category_index)">删除分区</mu-button>
              <mu-button fab small color="red" @click="category.isAdd = !category.isAdd" style="width: 30px;height: 30px;bottom:-3px;margin-left:15px;">
                <mu-icon value="add"></mu-icon>
              </mu-button>
            </div>
            <div class="gy-divider"></div>
            <div class="gy-list">
              <li v-for="(sitelist,index) in category.sitelist" class="site-noicon gy-hoverable">
                <div class="delete-button" v-show="edit" @click="deleteItem(category_index,index)">
                  <mu-icon value="clear" color="#ffffff" size="10"></mu-icon>
                </div>
                <a v-bind:href="sitelist.url" target="_blank">{{sitelist.site_name}}</a>
              </li>
            </div>
            <mu-expand-transition>
              <div class="add-form" v-if="category.isAdd&&edit">
                <mu-text-field v-model="inputSitename" placeholder="输入网站名" style="width:60%;"></mu-text-field>
                <mu-text-field v-model="inputUrl" placeholder="输入网址" style="width:60%;"></mu-text-field>
                <mu-button round color="success" @click="addItem(category_index)" :disabled="(inputSitename == '')||(inputUrl == '')">添加</mu-button>
              </div>
            </mu-expand-transition>
          </div>
        </mu-col>
        <mu-expand-transition>
          <mu-col span="12" sm="6" lg="4" v-show="edit">
            <div class="site-card gy-shadow-2" style="height: 120px;">
              <div class="site-card-last">
                <mu-button fab small color="blue" @click="addCate" style="width: 30px;height: 30px;">
                  <mu-icon value="add"></mu-icon>
                </mu-button>
              </div>
            </div>
          </mu-col>
        </mu-expand-transition>
      </mu-row>
    </div>
    <div id="red_packet" @click="openSimpleDialog">
      <img src="img/red_packet.png" style="height: 25px;">
    </div>
    <mu-dialog title="有你的支持，我们走的更远..." width="360" :open.sync="openSimple">
      <p style="font-size: 14px;">
        GY导航上线近一周年了!由最初的一个挂在github的静态页,变成了一个比较完善的网站...上线以来,一直坚持免费,开源且无广告.</br>
        如果你喜欢本站,领个红包帮作者分担一下服务器费用吧...
      </p>
      <div width = "100%" style="display: flex;height: 190px;align-items: center;justify-content: center;">
        <img src="img/red_packet_m.png" style="max-width: 200px;">
      </div>
      <mu-button slot="actions" flat color="primary" @click="closeSimpleDialog">不用了</mu-button>
    </mu-dialog>
    <mu-tooltip placement="top" :content="username">
      <mu-button fab class="floatButton-wrap floatButton" href="login.html" :style="{'background-color': Marchinelist[searchEngineindex].color,bottom: '77px',width:'30px',height:'30px'}">
        <mu-avatar style="background-color: rgba(255, 255, 255, 0);" size="20">
          {{username[0]}}
        </mu-avatar>
      </mu-button>
    </mu-tooltip>
    <mu-button fab @click="editMode()"  class="floatButton-wrap floatButton" :style="{'background-color': Marchinelist[searchEngineindex].color,width:'30px',height:'30px'}">
      <mu-icon size="15" value="settings" color="#ffffff" v-if="~edit"></mu-icon>
      <mu-icon size="15" value="check" color="#ffffff" v-else></mu-icon>
    </mu-button>
    <div class="footer gy-shadow-2">
      友情链接:
      <div class="gy-list" style="padding:  0;">
        <li v-for="(sitelist,index) in friendlink" class="site-noicon gy-hoverable" style="padding: 2px 5px;">
          <a v-bind:href="sitelist.url" target="_blank">{{sitelist.site_name}}</a>
        </li>
      </div>
    </div>
    <footer>
      <div class="about">
        <div>BY <a href="http://weibo.com/ailuoku6" target="_blank">@爱咯酷6</a> | 论坛: <a href="http://bbs.ailuoku6.top" target="_blank"><img src="img/bbs.png"></a></div>
        <div>网站备案号:桂ICP备18003700号</div>
      </div>
    </footer>
    <mu-snackbar position="bottom" :open="bar_open">
      操作成功!
      <mu-button flat slot="action" color="secondary" @click="cancelDelete">撤销</mu-button>
    </mu-snackbar>
  </div>
</template>

<script>

export default {
  name: 'allsite',
  data() {
    //常用栏列表
    return {
      comsitelist:[
        {site_name:"百度",url:"https://www.baidu.com/",icon:"img/baidu.png"},
        {site_name:"淘宝",url:"https://www.taobao.com",icon:"img/taobao.png"},
        {site_name:"京东",url:"https://www.jd.com",icon:"img/jd.png"},
        {site_name:"知乎",url:"https://www.zhihu.com",icon:"img/zhihu.png"},
        {site_name:"谷歌翻译",url:"https://translate.google.cn/",icon:"img/googlefanyi.png"},
        {site_name:"Github",url:"https://github.com/",icon:"img/github.png"},
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
            {site_name:"图片在线压缩",url:"http://cut.ailuoku6.top/"},
            {site_name:"图片无损放大",url:"http://waifu2x.udp.jp/"},
            {site_name:"草料二维码",url:"https://cli.im/"},
            {site_name:"PS网页版",url:"http://www.uupoop.com/"},
            {site_name:"在线进制转换",url:"http://tool.lu/hexconvert/"},
            {site_name:"邮编区号查询",url:"http://tool.lu/zipcode/"},
            {site_name:"百度网盘搜索",url:"http://www.pansoso.com/"},
            {site_name:"微词云",url:"https://minitagcloud.com/"},
            {site_name:"更多在线工具",url:"http://tool.lu/"},
          ],
        },
      ],
      Marchinelist:[
        {Marchine_name:"百度",button_value:"百度一下",searApi:"https://www.baidu.com/s?wd=",searApi_weizui:"",color:"#38F"},
        {Marchine_name:"谷歌",button_value:"谷歌一下",searApi:"https://www.google.com/#q=",searApi_weizui:"",color:"#3b78e7"},
        {Marchine_name:"搜狗",button_value:"搜狗搜索",searApi:"https://www.sogou.com/web?query=",searApi_weizui:"",color:"#ff5943"},
        {Marchine_name:"360搜索",button_value:"360搜",searApi:"https://www.so.com/s?ie=utf-8&fr=none&src=360sou_newhome&q=",searApi_weizui:"",color:"#19b955"},
        {Marchine_name:"必应搜索",button_value:"必应搜索",searApi:"https://www.bing.com/search?q=",searApi_weizui:"",color:"#1688b1"},
        {Marchine_name:"Github",button_value:"Github",searApi:"https://github.com/search?q=",searApi_weizui:"",color:"#00302e"},
        {Marchine_name:"知乎搜索",button_value:"知乎搜索",searApi:"https://www.zhihu.com/search?type=content&q=",searApi_weizui:"",color:"#0077e6"},
        {Marchine_name:"百度文库",button_value:"搜文库",searApi:"https://wk.baidu.com/search?word=",searApi_weizui:"",color:"#38F"},
        {Marchine_name:"图片搜索",button_value:"图片搜索",searApi:"http://image.so.com/i?q=",searApi_weizui:"&src=srp",color:"#19b955"},
        {Marchine_name:"贴吧",button_value:"贴吧搜索",searApi:"https://tieba.baidu.com/f?kw=",searApi_weizui:"",color:"#38F"},
        {Marchine_name:"知道",button_value:"百度知道",searApi:"https://zhidao.baidu.com/search?word=",searApi_weizui:"",color:"#38F"},
        {Marchine_name:"网盘",button_value:"搜网盘",searApi:"http://www.panduoduo.net/s/name/",searApi_weizui:"",color:"#3f51b5"},
        {Marchine_name:"csdn",button_value:"搜csdn",searApi:"http://so.csdn.net/so/search/s.do?q=",searApi_weizui:"",color:"#be1a21"},
      ],
      friendlink:[
        {site_name:"爱达杂货铺",url:"https://adzhp.cn/"},
        {site_name:"小呆导航",url:"http://webjike.com/"},
        {site_name:"悠悠导航",url:"https://uu456.cn/"},
        {site_name:"龙喵导航",url:"http://ailongmiao.com/"},
        {site_name:"聚神铺导航",url:"http://jspoo.com/"},
        {site_name:"RioHsc",url:"https://riohsc.github.io/"},
        {site_name:"电影网址导航",url:"https://www.dianyingdh.com"},
        {site_name:"野创导航",url:"http://www.yechuang.top/"},
        {site_name:"安逸导航",url:"https://anyi.life/"},
        {site_name:"微词云",url:"https://minitagcloud.cn/"},
        {site_name:"果汁导航",url:"http://guozhivip.com/nav/"},
        {site_name:"友链申请",url:"http://mail.qq.com/cgi-bin/qm_share?t=qm_mailme&email=zK2loLmjp7n6jL294q_joQ"},
      ],
      formInline: {
        user: '',
        password: '',
        comfpassword: ''
      },
      button_value: "百度一下",
      searApi: "",
      searApi_weizui: "",
      searchEngineindex: 0,
      scrolled: false,
      myData: [],
      keyword: '',
      keysug: '',
      sel_index: 0,
      isShow: false,
      isShowSelect: false,
      flag: "pc",
      sugflag: false,
      edit: false,
      inputSitename: "",
      inputUrl: "",
      apiUrl: 'https://sp0.baidu.com/5a1Fazu8AA54nxGko9WTAnF6hhy/su?wd',
      sycndataApi:"signin.php",
      postdataApi:"postdata.php",
      pattern: /(http|ftp|https):\/\/[\w\-_]+(\.[\w\-_]+)+([\w\-\.,@?^=%&:\/~\+#]*[\w\-\@?^=%&\/~\+#])?/,
      addpattern: /http/,
      color: '#7265e6',
      username: "未登录",
      border_width: 0.5,
      bar_open: false,
      timer: null,
      tempCategorylist: null,
      changeTime: 0,
      openSimple: false
    }
  },
  methods: {
    handleScroll: function handleScroll() {
      if ((window.pageYOffset || document.documentElement.scrollTop || document.body.scrollTop) <= 0) {//safari浏览器的拖动会使其为负数
        this.scrolled = false;
      } else {
        this.scrolled = true;
      }
    },
    hidesug: function hidesug(item) {
      if (item == "all") {
        this.isShow = false;
        this.isShowSelect = false;
      } else if (item == "sug") {
        this.isShow = false;
      } else {
        this.isShowSelect = false;
        this.sugflag = ~this.sugflag;
        if (this.sugflag) {
          this.isShow = true;
        } else {
          this.isShow = false;
        }
      }
    },
    changeMarchine: function changeMarchine() {
      this.isShowSelect = ~this.isShowSelect;
      this.isShow = false; //收起搜索建议
    },
    //选择搜索引擎
    selectMarchine: function selectMarchine(index) {
      this.button_value = this.Marchinelist[index].button_value;
      this.searApi = this.Marchinelist[index].searApi;
      this.searApi_weizui = this.Marchinelist[index].searApi_weizui;
      this.searchEngineindex = index;
      localStorage.searApi = this.searApi;
      localStorage.searchEngine = this.searchEngineindex;
    },
    //发起搜索
    baiduyixia: function baiduyixia() {
      this.isShowSelect = false;
      if (this.pattern.test(this.keyword)) {
        //判断是否是网址,是就直接跳转
        if (this.flag == "phone") {
          window.location.href = this.keyword;
        } else {
          window.open(this.keyword);
        }
      } else {
        if (this.flag == "phone") {
          window.location.href = this.searApi + encodeURIComponent(this.keyword) + this.searApi_weizui;
        } else {
          window.open(this.searApi + encodeURIComponent(this.keyword) + this.searApi_weizui);
        }
      }
    },
    selectDown: function selectDown() {
      this.sel_index = ++this.sel_index % this.myData.length;
      this.keyword = this.myData[this.sel_index];
    },
    selectUp: function selectUp() {
      this.sel_index = (this.myData.length + --this.sel_index) % this.myData.length;
      this.keyword = this.myData[this.sel_index];
    },
    //请求搜索建议数据
    requestData: function requestData() {
      this.$http.jsonp(this.apiUrl, {
        wd: this.keyword
      }, {
        jsonp: 'cb'
      }).then(function (res) {
        this.myData = res.data.s;
        this.myData.splice(0, 0, this.keyword);
      }, function () {});
      this.sel_index = 0;
      if (this.keyword.replace(/(^s*)|(s*$)/g, "") != "") {
        this.isShow = true;
      } else {
        this.isShow = false;
      }
    },
    //清空输入框
    cleanKeyword: function cleanKeyword() {
      this.keyword = '';
      this.requestData();
      if (this.flag != "phone") {
        this.$refs.input_area.focus();
      }
    },
    //删除网站
    deleteItem: function deleteItem(category_index, index) {
      this.categorylist[category_index].sitelist.splice(index, 1);
      if (this.categorylist[category_index].sitelist.length < 1) {
        this.categorylist.splice(category_index, 1);
      }
    },
    addItem: function addItem(category_index) {
      if (!this.addpattern.test(this.inputUrl)) {
        this.inputUrl = "http://" + this.inputUrl;
        // console.log("没有https");
      }
      var newSite = { site_name: this.inputSitename, url: this.inputUrl };
      this.categorylist[category_index].sitelist.push(newSite);
      //清空两个输入框
      this.inputSitename = "";
      this.inputUrl = "";
      this.categorylist[category_index].isAdd = false;
    },
    //添加分区
    addCate: function addCate() {
      var newCate = {
        categoryname: "",
        isAdd: false,
        sitelist: []
      };
      this.categorylist.push(newCate);
    },
    //删除分区
    deleteCate: function deleteCate(category_index) {
      this.tempCategorylist = [].concat(this.categorylist);
      this.categorylist.splice(category_index, 1);
      this.openNormalSnackbar();
    },
    openNormalSnackbar: function openNormalSnackbar() {
      var _this = this;

      if (this.timer) clearTimeout(this.timer);
      this.bar_open = true;
      this.timer = setTimeout(function () {
        _this.bar_open = false;
        _this.tempCategorylist = null;
      }, 3000);
    },
    cancelDelete: function cancelDelete() {
      this.categorylist = [].concat(this.tempCategorylist);
      this.bar_open = false;
    },
    editMode: function editMode() {
      this.edit = ~this.edit;
    },
    //判断设备
    judge: function judge() {
      var sUserAgent = navigator.userAgent;
      var mobileAgents = ['Android', 'iPhone', 'Symbian', 'WindowsPhone', 'iPod', 'BlackBerry', 'Windows CE'];
      for (var i = 0; i < mobileAgents.length; i++) {
        if (sUserAgent.indexOf(mobileAgents[i]) > -1) {
          this.flag = "phone";
          this.border_width = 1;
          break;
        }
      }
    },
    postdata: function postdata() {
      //上载数据
      this.$http.post(this.postdataApi, {
        "name": this.formInline.user,
        "passwoed": this.formInline.password,
        "userdata": localStorage.siteData1
      }, { emulateJSON: true }).then(function (response) {
        // console.log(response);
        if (response.data.code == 0) {
          // console.log("succ");
        }
      }, function (error) {
        console.log(error);
      });
    },
    sycndata: function sycndata() {
      var _this2 = this;

      //下载数据
      this.$http.post(_this2.sycndataApi, {
        "name": this.formInline.user,
        "passwoed": this.formInline.password
      }, { emulateJSON: true }).then(function (response) {
        // console.log(response);
        if (response.data.code == 0) {
          // console.log("succ");
          _this2.categorylist = JSON.parse(response.data.msg);
        } else {
          if (localStorage.siteData1) {
            _this2.categorylist = JSON.parse(localStorage.siteData1);
          } else {
            localStorage.siteData1 = JSON.stringify(_this2.categorylist);
          }
        }
      }, function (error) {
        console.log(error);
        if (localStorage.siteData1) {
          _this2.categorylist = JSON.parse(localStorage.siteData1);
        } else {
          localStorage.siteData1 = JSON.stringify(_this2.categorylist);
        }
      });
    },
    //初始化
    page_init: function page_init() {
      //初始化搜索建议框长度
      this.$refs.sug.style.width = this.$refs.input_area.clientWidth + 18 + 'px';
      if (localStorage.searApi) {
        //初始化searapi
        this.searApi = localStorage.searApi;
      } else {
        this.searApi = "https://www.baidu.com/s?wd=";
        localStorage.searApi = this.searApi;
      }
      if (localStorage.searchEngine || localStorage.searchEngine == 0) {
        //初始化searchEngine
        this.searchEngineindex = localStorage.searchEngine;
      } else {
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
    openSimpleDialog () {
      this.openSimple = true;
    },
    closeSimpleDialog () {
      this.openSimple = false;
    }
  },
  watch: {
    'categorylist': {
      handler: function handler(newValue, oldValue) {
        var data = JSON.stringify(newValue);
        localStorage.siteData1 = data;
        if (this.changeTime++) {
          this.postdata();
        }
      },
      deep: true
    }
  },
  mounted: function mounted() {
    window.addEventListener('scroll', this.handleScroll);
    this.judge();
    this.page_init();
  },
  destroyed: function destroyed() {
    window.removeEventListener('scroll', this.handleScroll);
  }
}
</script>

<style rel="stylesheet/css" lang="css" scoped>
  @import "~@/assets/index.css";
</style>
