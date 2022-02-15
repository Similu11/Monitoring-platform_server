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
    async uploadSourceMap(ctx) { //在线解析sourcemap上传接口
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

    async getSourceMapVersion(ctx) { //在线解析获取sourcemap版本接口
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

    async analysisFile(ctx) { //在线解析sourcemap接口
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
                    line: errFileInfo.lineno, // 压缩后的行号
                    column: errFileInfo.colno, // 压缩后的列号
                });
                // console.log(consumer.sources); //[ 'webpack://sourcemap-demo/src/index.js' ]
                // let s = consumer.sources.indexOf(result.source);//0
                // let sm = consumer.sourcesContent[s];
                // const rawLines = sm.split(/\r?\n/g)
                // console.log(rawLines[result.line -2],rawLines[result.line -1],rawLines[result.line]);
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

    async insertSourceMapLog(ctx) { //sourcemap错误日志存储接
        ctx.status = 200;
        ctx.body = {};
        let requestData = JSON.parse(ctx.request.body);
        let module = requestData.module;
        let dirPath = path.join(__dirname, '../logs/' + `${module}`);
        let filePath = path.join(__dirname, '../logs/' + `${module}`) + '/sourceMapError.log';
        if (!fs.existsSync(filePath)) { //当前文件夹若不存在，则创建该文件
            if (!fs.existsSync(dirPath)) {
                await fs.mkdirSync(dirPath);
            }
            fs.appendFileSync(filePath, JSON.stringify([]));
            RedisTool.setHsData(global.redisClient, model, 'sourceMapError', JSON.stringify([]));
        } else {
            let fileStream = fs.createReadStream(filePath, { encoding: 'utf8' });
            let fileData = '';
            let redisPermaceData = [];
            fileStream.on('data', data => {
                fileData += data;
            })
            fileStream.on('end', data => {
                try {
                    fileData = JSON.parse(fileData);
                } catch (error) {
                    fileData = [];
                }
                fileData.push(requestData);
                if (fileData.length > 20) {
                    redisPermaceData = fileData.slice(fileData.length - 20, fileData.length);
                } else {
                    redisPermaceData = fileData;
                }
                RedisTool.setHsData(global.redisClient, model, 'sourceMapError', JSON.stringify(redisPermaceData));
                let writeFileStream = fs.createWriteStream(filePath);
                writeFileStream.write(JSON.stringify(fileData));
                writeFileStream.end();
                writeFileStream.on('finish', (err) => {
                    if (err) {
                        console.log('写入失败');
                    }
                })
            })
        }
    }

    async getSourceMapLog(ctx) {
        let module = JSON.parse(ctx.request.body).model;
        await RedisTool.getHsData(global.redisClient, module, 'sourceMapError').then(res => {
            ctx.status = 200;
            ctx.body = {
                status: 200,
                result: res['sourceMapError']
            };
        });
    }

    async analysisSourceMapLog(ctx) {
        let body = JSON.parse(ctx.request.body);
        let obj = {};
        ctx.status = 200;
        if (body.scriptURI) {
            let fileUrl = path.join('../sourcemap/' + `${body.module}/` + `${body.scriptURI.substring(body.scriptURI.lastIndexOf('/') + 1).trim()}.map`);
            let dirPath = path.join(__dirname, '../sourcemap/' + `${body.module}`);
            if (!fs.existsSync(path.join(__dirname, fileUrl))) {
                obj = {
                    success: false,
                    status: 500,
                    msg: '未找到当前文件，请上传该sourceMap源文件'
                }
                if (!fs.existsSync(dirPath)) {
                    await fs.mkdirSync(dirPath);
                }
            } else {
                let consumer = await new sourceMap.SourceMapConsumer(
                    fs.readFileSync(resolve(fileUrl), 'utf8')
                );
                let result = consumer.originalPositionFor({
                    line: body.lineno, // 压缩后的行号
                    column: body.colno, // 压缩后的列号
                });
                //console.log(consumer.sources); //[ 'webpack://sourcemap-demo/src/index.js' ]
                let s = consumer.sources.indexOf(result.source);//0
                let sm = consumer.sourcesContent[s];
                const rawLines = sm.split(/\r?\n/g)
                //console.log(rawLines[result.line -2],rawLines[result.line -1],rawLines[result.line]);
                obj = {
                    success: true,
                    status: 200,
                    msg: '分析成功',
                    result: JSON.stringify(result),
                    code: rawLines[result.line - 2]+'\n'+rawLines[result.line - 1]+'\n'+rawLines[result.line]
                }
            }
        }
        ctx.body = obj;
    }

    async uploadSourceMapByLog(ctx) {
        let file = ctx.request.files.file;
        let module = ctx.request.body.model;
        let fileUrl = path.join('../sourcemap/' + `${module}/`) + `${file.name}`;
        let filePath = path.join(__dirname, fileUrl);
        const reader = fs.createReadStream(file.path);
        let writeFileStream = fs.createWriteStream(filePath);
        await reader.pipe(writeFileStream);
        ctx.status = 200;
        ctx.body = {
            success: true,
            status: 200,
            msg: '上传成功'
        };
    }
}
export default sourceMapColles;