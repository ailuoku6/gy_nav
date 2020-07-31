const SUGTIP = "http://suggestion.baidu.com/su?wd=";//参数wd,GET
const BaseUrl_dev = "http://127.0.0.1:7001";
const BaseUrl_prod = "http://47.106.131.84:2710";
const BaseUrl = BaseUrl_prod;

const Signin = '/api/login';
const SignUp = '/api/signup';
const GetPartData = "/api/getPartData";
const UpPartData = "/api/upPartData"
const ValidToken = 'api/veriToken'
const GetAllFS = "/api/getAllFS"

const GetInitData = 'getInitData';

export {
    SUGTIP,
    BaseUrl,
    Signin,
    SignUp,
    GetInitData,
    ValidToken,
    GetPartData,
    UpPartData,
    GetAllFS
}
