import { getAll } from './rc';
import downloadGit from 'download-git-repo';

export const downloadLocal = async(type, serverCode) => {
    let config = await getAll();
    let api;
    switch (type) {
        case "Pc":
            api = config.pc_Url
            break;
        case "WeChat":
            api = config.WeChat_Url
            break;
        case "CC_app":
            api = config.CC_app_Url
            break;
    }
    return new Promise((resolve, reject) => {
        downloadGit(api, serverCode, { clone: true }, (err) => {
            if (err) {
                reject(err)
            }
            resolve();
        })
    })
}