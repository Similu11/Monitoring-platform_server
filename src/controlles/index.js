import Router from '@koa/router';
import IndexControlles from './indexColles';
import SourceMapColles from './sourceMapColles';
import ModelVsrsion from './modleVerson';
const router = new Router();
const indexControlle = new IndexControlles();
const sourceControlle = new SourceMapColles();
const modelVsrsion = new ModelVsrsion();
function initControlles(app,redisClient) {
    router.get('/', indexControlle.actionIndex);
    router.post('/uploadSour', sourceControlle.uploadSourceMap);
    router.get('/getSourceMapVersion',sourceControlle.getSourceMapVersion);
    router.post('/analysisFile',sourceControlle.analysisFile);
    router.get('/modelVsrsion',modelVsrsion.getModelVersion);
    router.post('/reloadModelVsrsion',modelVsrsion.setModelVersion);
    app.use(router.routes())
    .use(router.allowedMethods());//可以获取请求头，可以再response响应头中设置特定参数    
}

module.exports = initControlles;