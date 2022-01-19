import Controlles from './controlles';
class ModelVsrsion extends Controlles {
    constructor() {
        super();
    }
    async getModelVersion(ctx) {
        let obj = {
            result: [{ key: 'vue-hjgh', value: 'vue-hjgh' }, { key: 'vue-ycl', value: 'vue-ycl' }],
            status: 200,
            msg: '请求成功'
        };
        ctx.body = obj;
    }
    async setModelVersion(ctx) {
        global.model = ctx.request.body;
        let obj = {
            result: [],
            status: 200,
            msg: '模块设置完成'
        };
        ctx.body = obj;
    }
}
export default ModelVsrsion;