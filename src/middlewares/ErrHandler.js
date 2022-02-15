class ErrHandler {
    static err(app, logger) {
        app.use(async (ctx, next) => {
            try {
                await next();
                if (ctx.status === 404 || ctx.status === 500) {
                    let obj = {};
                    if (ctx.request.method == 'GET') {
                        obj = { url: ctx.request.url, origin: ctx.request.origin, response: ctx.response.status };
                    } else if (ctx.request.method == 'POST') {
                        obj = { url: ctx.request.url, origin: ctx.request.origin, requestParams: ctx.request.body, response: ctx.response.status };
                    }
                    throw new Error(JSON.stringify(obj));
                }
            } catch (error) {
                logger.error(error);
                ctx.status = 500;
                ctx.body = '500,服务挂掉了。。。';
            }
        })
    }
}
export default ErrHandler;