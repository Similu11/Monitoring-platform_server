class ErrHandler {
    static err(app,logger){
        app.use(async (ctx,next)=>{
            try {
                await next();
                if(ctx.status === 404){
                    ctx.body = '404';
                }
            } catch (error) {
                logger.error(error);//日志写入
                ctx.body = '500,服务挂掉了。。。';
            }
        })
    }
}
export default ErrHandler;
//module.exports = ErrHandler;