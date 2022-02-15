import Koa from 'koa';
import config from './config/index.js';
import initControlles from './controlles/index.js';
import cors from 'koa2-cors';
import { createClient } from 'redis';
import koaBody from 'koa-body';
// import render from 'koa-swig';
import co from 'co';
import staticServer from 'koa-static';
import { historyApiFallback } from 'koa2-connect-history-api-fallback';
import errHandler from './middlewares/ErrHandler';
import log4js from "log4js";
const logger = log4js.getLogger('globalError');
const app = new Koa();
app.use(cors());
app.use(koaBody({ multipart: true, jsonLimit: "5MB", textLimit: "5MB", formLimit: "5MB" }));
/** koaBody 需要配置请求体大小，特别是上传rrweb视频信息时 */
// jscpd 测试软件代码重复率
log4js.configure({
  appenders: { globalError: { type: "file", filename: "./dist/logs/error.log" } },//日志存放目录
  categories: { default: { appenders: ["globalError"], level: "error" } }//日志分类
});
// app.context.render = co.wrap(render({
//   root: config.viewDir,
//   autoescape: true,
//   cache: config.cache,
//   ext: 'html',
//   varControls: ['[[', ']]']//koa-swig 模板{{}}容易与vue模板{{}}冲突，所以该属性将koa-swig 模板{{}}改为[[]]
// }));
app.use(historyApiFallback({ //路由兜底，转向默认地址
  index: '/',
  whiteList: ['/']
}));
errHandler.err(app,logger);//容错，路由兜底，模板渲染都必须在路由初始化之前
(async () => {
  const client = createClient({
    socket: {
      host: config.redisConfig.host,
      port: config.redisConfig.port
    }
  });
  //把redis连接做一下封装，抛出一个实例，在各个路由中处理调用
  client.on('error', (err) => console.log('Redis Client Error', err));
  await client.connect();
  global.redisClient = client;
  global.model = 'vue-hjgh';
  initControlles(app);//路由初始化
})();
app.use(staticServer(config.staticDir));//静态资源
app.listen(config.port, () => {
  console.log(`server is running ${config.port}`);
});