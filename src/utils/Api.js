const SUGTIP = "https://suggestion.baidu.com/su?wd=";//参数wd,GET
const BaseUrl_dev = "http://127.0.0.1:7001";
const BaseUrl_prod = "";
const BaseUrl = BaseUrl_prod;

const Signin = '/api/login';
const SignUp = '/api/signup';
const GetPartData = "/api/getPartData";
const UpPartData = "/api/upPartData"
const ValidToken = 'api/veriToken'
const GetAllFS = "/api/getAllFS"
const WriteRemoteClipBoard = "/api/writeClipBoard";
const GetRemoteClipBoard = "/api/getClipBoard";

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
    GetAllFS,
    WriteRemoteClipBoard,
    GetRemoteClipBoard
}
