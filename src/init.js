import { downloadLocal } from './utils/get';
import ora from 'ora';
import inquirer from 'inquirer';
import fs from 'fs';
import chalk from 'chalk';
import symbol from 'log-symbols';
import yaml from 'js-yaml'


let init = async() => {
    //项目不存在
    inquirer.prompt([{
            name: "groupCode",
            message: '请输入应用编码:'
        },
        {
            name: "serverCode",
            message: '请输入服务编码:'
        },
        {
            name: "type",
            type: 'list',
            message: '请输入模板类型:',
            choices: [
                "Pc",
                "WeChat",
                "CC_app"
            ],
        },
        {
            name: "flag",
            type: 'confirm',
            message: '是否接入微服务管理平台',
            when: function(answers) {
                // PC才需要问接入微服务管理平台
                if (answers.type == 'Pc') {
                    return true
                } else {
                    return false
                }
            }
        },
        {
            name: "tcode",
            message: "请输入租户编码:",
            when: function(answers) {
                return answers.flag
            }
        },
        {
            name: "code",
            message: "请输入客户端编码:",
            when: function(answers) {
                return answers.flag
            }
        },
        {
            name: "systemCode",
            message: "请输入权限系统配置的编码:",
            when: function(answers) {
                return answers.flag
            }
        },
    ]).then(async(answer) => {
        let loading = ora('正在下载模板中 ...');
        loading.start();
        let serverCode = answer.serverCode; // 服务编码
        let groupCode = answer.groupCode; // 项目编码
        let type = answer.type // 模板类型
        let flag = answer.flag // 是否接入微服务管理平台
        let tcode = answer.tcode; // 租户编码
        let code = answer.code; // 客户端编码
        let systemCode = answer.systemCode // 权限系统配置的编码
        if (fs.existsSync(serverCode)) {
            //项目已经存在
            console.log(symbol.error, chalk.red('项目已经存在'));
            loading.fail();
            return;
        }
        downloadLocal(type, serverCode).then(() => {
            // 修改文件目录名(只针对Pc和cc_app)
            if (type == 'Pc' || type == "CC_app") {
                fs.renameSync(`${serverCode}/charts/element-web-demo/templates/element-web-demo`, `${serverCode}/charts/element-web-demo/templates/${serverCode}`, (err) => {
                    if (err) {
                        console.log(err);
                        return
                    }
                });
                fs.renameSync(`${serverCode}/charts/element-web-demo/templates/element-web-demo-docs`, `${serverCode}/charts/element-web-demo/templates/${serverCode}-docs`, (err) => {
                    if (err) {
                        console.log(err);
                        return
                    }
                });
                fs.renameSync(`${serverCode}/charts/element-web-demo`, `${serverCode}/charts/${serverCode}`, (err) => {
                    if (err) {
                        console.log(err);
                        return
                    }
                });
            }
            // 文件修改
            const packagefile = `${serverCode}/package.json`; //修改package.json
            const projectConfig = `${serverCode}/project.config.json`; //修改project.config.json
            const values = `${serverCode}/charts/${serverCode}/values.yaml`; //修改values.yaml
            const chart = `${serverCode}/charts/${serverCode}/Chart.yaml`; //修改chart.yaml
            const constant = `${serverCode}/src/public/constant.js`; // 修改constant.js
            const authorize = `${serverCode}/src/public/authorize.js`; // authorize.js
            const index = `${serverCode}/src/views/home/index.vue`; // 修改home/index.vue
            const vuese = `${serverCode}/.vueserc` //修改.vueserc

            // 修改package.json的name
            if (fs.existsSync(packagefile)) {
                const data = fs.readFileSync(packagefile).toString();
                let json = JSON.parse(data);
                json.name = serverCode;
                fs.writeFileSync(packagefile, JSON.stringify(json, null, '\t'), 'utf-8');
            }
            // 修改小程序的project.config.json的projectname
            if (fs.existsSync(projectConfig)) {
                const data = fs.readFileSync(projectConfig).toString();
                let json = JSON.parse(data);
                json.projectname = serverCode;
                fs.writeFileSync(projectConfig, JSON.stringify(json, null, '\t'), 'utf-8');
            }
            //修改values.yaml
            if (fs.existsSync(values)) {

                let contents = fs.readFileSync(values, 'utf-8');
                let data = yaml.safeLoad(contents);
                //修改变量
                data.groupName = groupCode
                data.projectName = serverCode
                    // 仓库初始化
                data.image.repository = `harbor.prod.k8s.lesso.com/operation-${groupCode}/${serverCode}`
                data.image.docsRepository = `harbor.prod.k8s.lesso.com/operation-${groupCode}/${serverCode}-docs`
                    // 更改名字
                data.service.web.name = `${serverCode}`
                data.service.web_docs.name = `${serverCode}-docs`
                    // 修改域名
                data.ingress.web.host = `${groupCode}.${serverCode}.172.16.90.27.xip.io`
                data.ingress.web_docs.host = `${groupCode}.${serverCode}-docs.172.16.90.27.xip.io`
                data.matchExpressions.values[0] = 'dev-work-app'

                let yamlStr = yaml.safeDump(data);
                fs.writeFileSync(values, yamlStr, 'utf-8');
            }
            // 修改chart.yaml
            if (fs.existsSync(chart)) {
                let contents = fs.readFileSync(chart, 'utf-8');
                let data = yaml.safeLoad(contents);
                // 更改名字和描述
                data.name = serverCode;
                data.description = `${serverCode}的chart配置`;
                let yamlStr = yaml.safeDump(data);
                fs.writeFileSync(chart, yamlStr, 'utf-8');
            }
            // 是否接入微服务管理平台
            if (flag) {
                // 修改租户编码
                if (fs.existsSync(constant)) {
                    let data = fs.readFileSync(constant).toString();
                    data = data.replace('code:"auth-admin"', `code:"${code}"`);
                    data = data.replace('tcode:"platform-group"', `tcode:"${tcode}"`);
                    fs.writeFileSync(constant, data, 'utf-8');
                }
                // 解除代码
                if (fs.existsSync(index)) {
                    let indexVue = fs.readFileSync(index).toString();
                    indexVue = indexVue.replace('// this.getAuthResource();', 'this.getAuthResource();');
                    fs.writeFileSync(index, indexVue, 'utf-8');
                }
                // 修改systemCode变量
                if (fs.existsSync(authorize)) {
                    let data = fs.readFileSync(authorize).toString();
                    data = data.replace("let systemCode = 'mt';", `let systemCode = '${systemCode}'`);
                    fs.writeFileSync(authorize, data, 'utf-8');
                }
            }
            // 修改.vueserc
            if (fs.existsSync(vuese)) {
                const data = fs.readFileSync(vuese).toString()
                let json = JSON.parse(data);
                json.title = `${serverCode}前端开发文档`;
                fs.writeFileSync(vuese, JSON.stringify(json, null, '\t'), 'utf-8')
            }
            loading.succeed();
            console.log(symbol.success, chalk.green('项目初始化完成!'));
        }, () => {
            loading.fail();
        })
    })
}

module.exports = init;