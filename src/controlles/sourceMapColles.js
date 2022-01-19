import Controlles from './controlles';
import redisTool from './redisTool';
import path from 'path';
import fs from 'fs';
import sourceMap from 'source-map';
let RedisTool = new redisTool();
const resolve = (file) => path.resolve(__dirname, file);
class sourceMapColles extends Controlles {
    constructor() {
        super();
    }
    async uploadSourceMap(ctx) {
        let version = ctx.request.body.version;
        global.model = ctx.request.body.model;
        const file = ctx.request.files.file; // 获取上传文件
        //创建可读流
        if (file) {
            if (file.forEach) {
                file.forEach((item) => {
                    writeFile(item);
                })
            } else {
                writeFile(file);
            }
            ctx.status = 200;
            ctx.body = {
                message: '上传成功',
                success: true
            };
        }

        function writeFile(item) {
            const reader = fs.createReadStream(item.path);
            let filePath = path.join(__dirname, '../upload/' + `${version}/`) + `${item.name}`;
            let dirPath = path.join(__dirname, '../upload/' + `${version}`);
            if (!fs.existsSync(dirPath)) {
                RedisTool.getHsData(global.redisClient, global.model, 'version').then(res => {
                    let arr;
                    if (res.version) {
                        arr = JSON.parse(res.version);
                    } else {
                        arr = [];
                    }
                    arr.push(version);
                    RedisTool.setHsData(global.redisClient, global.model, 'version', JSON.stringify(arr)).then(res => { });
                })
                fs.mkdirSync(dirPath, (err) => {
                    if (err) {
                        throw new Error(err);
                    }
                })
            }
            const upStream = fs.createWriteStream(filePath);// 创建可写流
            reader.pipe(upStream);// 可读流通过管道写入可写流
        }
    }

    async getSourceMapVersion(ctx) {
        // RedisTool.delHsData(global.redisClient, 'vue-hjgh').then(res => {}); //重置'vue-hjgh'模块的redis数据
        await RedisTool.getHsData(global.redisClient, global.model, 'version').then(res => {
            let obj = {
                fileVersion: [],
                status: 200,
                msg: '请求成功'
            };
            if (res.version) {
                let arr = JSON.parse(res.version);
                arr.forEach((item) => {
                    let o = {
                        key: item,
                        value: item
                    }
                    obj.fileVersion.push(o);
                })
            }
            ctx.status = 200;
            ctx.body = obj;
        });
    }

    async analysisFile(ctx) {
        let body = JSON.parse(ctx.request.body);
        ctx.status = 200;
        let obj = {};
        let errFileInfo;
        try {
            errFileInfo = JSON.parse(body.errFileInfo);
        } catch (error) {
            obj = {
                success: false,
                status: 500,
                msg: '请检查输入的sourceMap错误信息是否有误'
            }
            ctx.body = obj;
            return;
        }
        let errFileVersion = body.errFileVersion;
        if (errFileInfo.scriptURI) {
            let fileUrl = path.join('../upload/' + `${errFileVersion}/` + `${errFileInfo.scriptURI.substring(errFileInfo.scriptURI.lastIndexOf('/') + 1).trim()}.map`);
            if (!fs.existsSync(path.join(__dirname, fileUrl))) {
                obj = {
                    success: false,
                    status: 500,
                    msg: '未找到当前文件，请上传该sourceMap源文件'
                }
            } else {
                let consumer = await new sourceMap.SourceMapConsumer(
                    fs.readFileSync(resolve(fileUrl), 'utf8')
                );
                let result = consumer.originalPositionFor({
                    line: errFileInfo.lineNo, // 压缩后的行号
                    column: errFileInfo.columnNo, // 压缩后的列号
                });
                obj = {
                    success: true,
                    status: 200,
                    msg: '分析成功',
                    result: JSON.stringify(result)
                }
            }
        }
        ctx.body = obj;
    }
}
export default sourceMapColles;