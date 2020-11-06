import { version } from '../../package.json';

//当前 package.json 的版本号
export const VERSION = version;

// 用户的根目录
const HOME = process.env[process.platform === 'win32' ? 'USERPROFILE' : 'HOME'];

// 配置文件目录
// export const RC = `${HOME}/.eosrc`;
// 全局配置文件 ./templateConfig
export const RC = './.templateConfig'

// RC 配置下载模板的地方，给 github 的 api 使用
export const DEFAULTS = {
    pc_Url: "direct:http://gitlab.dev.k8s.lesso.com/operation-platform-group/element-web-demo.git",
    WeChat_Url: "direct:http://gitlab.dev.k8s.lesso.com/operation-platform-group/demo-wechat.git",
    CC_app_Url: ""
}