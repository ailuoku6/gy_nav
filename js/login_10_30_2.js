'use strict';

var app = new Vue({
  el: '#app',
  data: {
    signup: true,
    loged: false,
    err_tip: '',
    formInline: {
      user: '',
      password: '',
      comfpassword: '',
    },
    color: '#7265e6',
    loginApi:"signin.php",
    logupApi:"signup.php",
  },
  methods: {
    stateChange: function stateChange() {
      localStorage.logstate = this.signup;
    },
    login: function login() {
      var _this = this;

      this.$http.post(_this.loginApi, {
        "name": this.formInline.user,
        "passwoed": this.formInline.password
      }, { emulateJSON: true }).then(function (response) {
        if (response.data.code == 0) {
          console.log("succ");
          _this.loged = true;
          localStorage.siteData1 = response.data.msg;
          localStorage.userpre = JSON.stringify(_this.formInline);
          localStorage.loged = _this.loged.toString();
          window.location.href = "index.html";
        } else {
          _this.err_tip = "用户名或密码错误!";
        }
      }, function (error) {
        console.log(error);
      });
    },
    onEnterlogin: function onEnterlogin() {
      if (this.signup||this.formInline.user===''||this.formInline.password==='') return;
      this.login();
    },
    logup: function logup() {
      var _this2 = this;

      this.$http.post(_this2.logupApi, {
        "name": this.formInline.user,
        "passwoed": this.formInline.comfpassword,
        "userdata": localStorage.siteData1
      }, { emulateJSON: true }).then(function (response) {
        // console.log(response);
        if (response.data.code == 1) {
          console.log("succ");
          _this2.loged = true;
          localStorage.userpre = JSON.stringify(_this2.formInline);
          localStorage.loged = _this2.loged.toString();
          window.location.href = "index.html";
        } else {
          _this2.err_tip = "用户名已存在";
        }
      }, function (error) {
        console.log(error);
      });
    },
    onEnterlogup:function onEnterlogup() {
      if (!this.signup||this.formInline.user===''||this.formInline.password===''||this.formInline.password!=this.formInline.comfpassword||this.formInline.user.length>9) return;
      this.logup();
    },
    logout: function logout() {
      this.loged = false;
      localStorage.loged = this.loged.toString();
      this.formInline.user = this.formInline.password = this.formInline.comfpassword = "";
      localStorage.userpre = JSON.stringify(this.formInline);
    },
    page_init: function page_init() {
      if (localStorage.logstate) {
        this.signup = localStorage.logstate === "false" ? false : true;
      } else {
        localStorage.logstate = this.signup.toString();
      }
      if (localStorage.loged) {
        this.loged = localStorage.loged === "false" ? false : true;
      }
      if (localStorage.userpre) {
        this.formInline = JSON.parse(localStorage.userpre);
      }
    }
  },
  watch: {
    'formInline': {
      handler: function handler(newValue, oldValue) {
        this.err_tip = '';
      },
      deep: true
    },
    'signup': {
      handler: function handler(newValue, oldValue) {
        this.err_tip = '';
      }
    }
  },
  mounted: function mounted() {
    this.page_init();
  }
});
