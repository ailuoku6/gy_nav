var app = new Vue({
  el:"#app",
  data:{
    adminname:"",
    adminpassword:"",
    deleteuser:"",
    mes:"",
    api:"adminMan.php",
  },
  methods:{
    deleteyou:function(){
      this.$http.post(this.api,{
        "name":this.adminname,
        "passwoed":this.adminpassword,
        "deleteuser":this.deleteuser,
      },{emulateJSON:true})
      .then(
        (response)=>{
          if (response.data.code==0) {
            this.mes = "删除"+response.data.msg+"成功";
          }else if(response.data.code==1){
            this.mes= "用户名或密码错误!";
          }else{
            this.mes = "没有"+response.data.msg+"这个用户";
          }
          console.log(response.data);
        },
        (error)=>{
          console.log(error);
        }
      );
    },
  },
});
