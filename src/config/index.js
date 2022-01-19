import path from 'path';
let config = {
    viewDir: path.join(__dirname, '../../', './dist/views'),
    staticDir: path.join(__dirname, '../../', './dist/assets'),
    redisConfig:{
        port:'6379',
        host:'127.0.0.1',
        pass:""
    }
};
if (process.env.NODE_ENV === 'development') {
    const devConfig = {
        port: 8852,
        cache: false,
    };
    config = {
        ...config,
        ...devConfig
    }
}

if (process.env.NODE_ENV === 'production') {
    const prodConfig = {
        port: 8857,
        cache: 'memory',
    };
    config = {
        ...config,
        ...prodConfig
    }
}
export default config;
