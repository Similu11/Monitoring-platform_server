import Router from '@koa/router';
import IndexControlles from './indexColles';
import SourceMapColles from './sourceMapColles';
import ModelVsrsion from './modleVerson';
import Permace from './permace';
import RrWeb from './rrWebColles'
const router = new Router();
const indexControlle = new IndexControlles();
const sourceControlle = new SourceMapColles();
const modelVsrsion = new ModelVsrsion();
const permace = new Permace();
const rrweb = new RrWeb();
function initControlles(app) {
    router.get('/', indexControlle.actionIndex);
    router.post('/uploadSour', sourceControlle.uploadSourceMap);
    router.get('/getSourceMapVersion',sourceControlle.getSourceMapVersion);
    router.post('/analysisFile',sourceControlle.analysisFile);
    router.get('/modelVsrsion',modelVsrsion.getModelVersion);
    router.post('/reloadModelVsrsion',modelVsrsion.setModelVersion);
    router.post('/uploadPermace',permace.insetModePermace);
    router.post('/insertSourceMapLog',sourceControlle.insertSourceMapLog);
    router.post('/insertRrwebLog',rrweb.insertRrwebLog);
    router.post('/getPermaceByName',permace.getPermaceByName);
    router.post('/getSourceMapLog',sourceControlle.getSourceMapLog);
    router.post('/getRrwebLog',rrweb.getRrwebLog);
    router.post('/analysisSourceMapLog',sourceControlle.analysisSourceMapLog);
    router.post('/uploadSourceMapByLog',sourceControlle.uploadSourceMapByLog);
    app.use(router.routes())
    .use(router.allowedMethods());//可以获取请求头，可以再response响应头中设置特定参数    
}

module.exports = initControlles;