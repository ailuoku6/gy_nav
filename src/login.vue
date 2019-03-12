<template>
    <div id="allsite">
        <mu-card style="width:350px;" v-if="loged">
            <mu-card-title title="Hello!" :sub-title="formInline.user"></mu-card-title>
            <mu-divider></mu-divider>
            <div style="display:flex;justify-content:center;margin-top: 20px;">
                <mu-avatar style="background-color: #02a9f3;" size="60">
                    {{formInline.user[0]}}
                </mu-avatar>
            </div>
            <mu-card-actions  style="display:flex;justify-content:center;">
                <mu-button color="primary" href="http://nav.ailuoku6.top">返回</mu-button>
                <mu-button @click="logout()">登出</mu-button>
            </mu-card-actions>
        </mu-card>

        <mu-card style="width: 98%; max-width: 475px; margin: 0 auto;" v-else>
            <mu-flex class="select-control-row" style="margin: 15px;">
                <mu-switch v-model="signup" :label="signup?'注册':'登陆'"></mu-switch>
            </mu-flex>
            <mu-divider></mu-divider>
            <mu-form ref="form" :model="formInline" style="width: 93%;margin: 15px;">
                <mu-form-item label="用户名" prop="username">
                    <mu-text-field v-model="formInline.user" prop="username"></mu-text-field>
                </mu-form-item>
                <mu-form-item label="密码" prop="password">
                    <mu-text-field type="password" v-model="formInline.password" prop="password" @keyup.enter="onEnterlogin()"></mu-text-field>
                </mu-form-item>
                <mu-form-item label="确认密码" prop="password"  v-show="signup">
                    <mu-text-field type="password" v-model="formInline.comfpassword" prop="password" @keyup.enter="onEnterlogup()"></mu-text-field>
                    <div v-show="(formInline.password!=formInline.comfpassword)&&formInline.comfpassword" style="color: #75723d;margin: 12px 0px -8px 5px;font-size: 12px;">两次密码不一致</div>
                    <div v-show="formInline.user.length>9" style="color: #75723d;margin: 12px 0px -8px 5px;font-size: 10px;">用户名长度应少于9个字符(字母、数字、中文、符号可自由组合)</div>
                </mu-form-item>
                <div v-show="err_tip" style="color: #75723d;margin: 12px 0px -8px 5px;font-size: 12px;">{{err_tip}}</div>
                <mu-form-item>
                    <mu-button color="primary" @click="login()" :disabled="(formInline.user=='')||(formInline.password=='')" v-if="!signup">登陆</mu-button>
                    <mu-button color="primary" @click="logup()" :disabled="(formInline.password!=formInline.comfpassword)||formInline.password==''||formInline.user.length>9||formInline.user.length==0" v-else>注册</mu-button>
                </mu-form-item>
            </mu-form>
        </mu-card>
    </div>
</template>

<script>
    export default {
        name: "login",
        data() {
            return {
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
            }
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
    }
</script>

<style rel="stylesheet/css" lang="css" scoped>
    @import "~@/assets/login.css";
</style>