
var app = new Vue({
  el: '#app',
  data:{
    signup:true,
    loged:false,
    err_tip:'',
    formInline: {
        user: '',
        password: '',
        comfpassword:''
    },
    ruleInline: {
        user: [
            { required: true, message: 'Please fill in the user name', trigger: 'blur' }
        ],
        password: [
            { required: true, message: 'Please fill in the password.', trigger: 'blur' },
            { type: 'string', min: 6, message: 'The password length cannot be less than 6 bits', trigger: 'blur' }
        ]
    },
    color:'#7265e6',
  },
  methods:{
    stateChange:function(){
      localStorage.logstate = this.signup;
    },
    login:function(){
      //console.log("gy");
      this.$http.post("http://nav.ailuoku6.top/signin.php",{
        "name":this.formInline.user,
        "passwoed":this.formInline.password
      },{emulateJSON:true})
      .then(
        (response)=>{
          if (response.data.code==0) {
            console.log("succ");
            this.loged = true;
            localStorage.siteData1 = response.data.msg;
            localStorage.userpre = JSON.stringify(this.formInline);
            localStorage.loged = this.loged.toString();
            window.location.href="index.html";
          }else {
            this.err_tip= "用户名或密码错误!";
          }
        },
        (error)=>{
          console.log(error);
        }
      );
    },
    logup:function(){
      this.$http.post("http://nav.ailuoku6.top/signup.php",{
        "name":this.formInline.user,
        "passwoed":this.formInline.comfpassword,
        "userdata":localStorage.siteData1,
      },{emulateJSON:true})
      .then(
        (response)=>{
          console.log(response);
          if (response.data.code==1) {
            console.log("succ");
            this.loged = true;
            localStorage.userpre = JSON.stringify(this.formInline);
            localStorage.loged = this.loged.toString();
            window.location.href="index.html";
          }else {
            this.err_tip = "用户名已存在";
          }
        },
        (error)=>{
          console.log(error);
        }
      );
    },
    logout:function(){
      this.loged=false;
      localStorage.loged = this.loged.toString();
      this.formInline.user =this.formInline.password=this.formInline.comfpassword= "";
      localStorage.userpre = JSON.stringify(this.formInline);
    },
    page_init:function(){
      if (localStorage.logstate) {
        this.signup = localStorage.logstate ==="false" ? false : true;
      }
      else {
        localStorage.logstate = this.signup.toString();
      }
      if (localStorage.loged) {
        this.loged = localStorage.loged==="false" ? false : true;
      }
      if (localStorage.userpre) {
        this.formInline = JSON.parse(localStorage.userpre);
      }
    },
  },
  watch:{
    'formInline':{
      handler:function(newValue,oldValue){
        this.err_tip = '';
      },
      deep:true,
    },
    'signup':{
      handler:function(newValue,oldValue){
        this.err_tip = '';
      },
    }
  },
  mounted:function () {
    this.page_init();
  },
});
