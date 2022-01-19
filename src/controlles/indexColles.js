import Controlles from './controlles';
class IndexControlles extends Controlles {
    constructor() {
        super();
    }
    async actionIndex(ctx) {
        //throw new Error('自定义错误');
        // ctx.body = await ctx.render('indexer/pages/load',{message:'我是项目首页'});
        ctx.body = '111';
    }
}
export default IndexControlles;
