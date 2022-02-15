import Controlles from './controlles';
import path from 'path';
import fs from 'fs';
import redisTool from './redisTool';
let RedisTool = new redisTool();
class RrWeb extends Controlles {
    constructor() {
        super();
    }
    async insertRrwebLog(ctx) {
        let requestData = JSON.parse(ctx.request.body);
        let module = requestData.module;
        let dirPath = path.join(__dirname, '../logs/' + `${module}`);
        let filePath = path.join(__dirname, '../logs/' + `${module}/`) + 'rrwebInfo.log';
        if (!fs.existsSync(filePath)) { //当前文件夹若不存在，则创建该文件
            if (!fs.existsSync(dirPath)) {
                await fs.mkdirSync(dirPath);
            }
            fs.appendFileSync(filePath, JSON.stringify([]));
            RedisTool.setHsData(global.redisClient, module, 'rrwebInfo', JSON.stringify([]));
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
                RedisTool.setHsData(global.redisClient, module, 'rrwebInfo', JSON.stringify(redisPermaceData));
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
        ctx.status = 200;
        ctx.body = {};
    }

    async getRrwebLog(ctx) {
        let requestData = JSON.parse(ctx.request.body);
        let module = requestData.module;
        await RedisTool.getHsData(global.redisClient, module, 'rrwebInfo').then(res => {
            ctx.status = 200;
            ctx.body = {
                status: 200,
                result: res['rrwebInfo']
            };
        });
    }
}
export default RrWeb;