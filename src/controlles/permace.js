import Controlles from './controlles';
import path from 'path';
import fs from 'fs';
import redisTool from './redisTool';
let RedisTool = new redisTool();
class Permace extends Controlles {
    constructor() {
        super();
    }
    async insetModePermace(ctx) { //上报项目性能指标，并存储在本地logs文件夹下，并缓存最新的20条数据至redis
        ctx.status = 200;
        let request = JSON.parse(ctx.request.body);
        let model = request.module;//项目名称
        let permaceName = request.metricName;//指标名称
        let dirPath = path.join(__dirname, '../logs/' + `${model}`);
        let filePath = path.join(__dirname, '../logs/' + `${model}/`) + `${permaceName}.log`;
        if (!fs.existsSync(filePath)) { //当前文件夹若不存在，则创建该文件
            if (!fs.existsSync(dirPath)) {
                await fs.mkdirSync(dirPath);
            }
            fs.appendFileSync(filePath, JSON.stringify([]));
            RedisTool.setHsData(global.redisClient, model, permaceName, JSON.stringify([]));
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
                fileData.push(request);
                if (fileData.length > 20) {
                    redisPermaceData = fileData.slice(fileData.length - 20, fileData.length);
                } else {
                    redisPermaceData = fileData;
                }
                RedisTool.setHsData(global.redisClient, model, permaceName, JSON.stringify(redisPermaceData));
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
        /**
         * post提交的时候，数据在payload里面，但是request headers里面content-type是text-plain；xxx 而不是 json/application。因此node服务器如果你用了koa-bodyparser中间件的话(其他类似的中间件也有可能会有这个问题)，你是拿不到提交上来的参数的(研究了下koa-bodyparser的源码，关键问题就在这个content-type上，添加设置extendTypes也不行)
            sendBeacon方法具有如下特点：
            发出的是异步请求，并且是POST请求，后端解析参数时，需要注意处理方式；
            发出的请求，是放到的浏览器任务队列执行的，脱离了当前页面，所以不会阻塞当前页面的卸载和后面页面的加载过程，用户体验较好；
            只能判断出是否放入浏览器任务队列，不能判断是否发送成功；
            Beacon API不提供相应的回调，因此后端返回最好省略response body。
        */
    }
    async getPermaceByName(ctx) {//获取性能指标
        ctx.status = 200;
        let request = JSON.parse(ctx.request.body);
        let perName = request.name;
        await RedisTool.getHsData(global.redisClient, request.model).then(res => {
            let obj = {message:'请求成功',result:{},status:200};
            perName.forEach((item)=>{
                obj.result[item] = JSON.parse(res[item]);
            })
            ctx.body = obj;
        })
    }
}
export default Permace;