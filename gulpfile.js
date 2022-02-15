const gulp = require('gulp');
const babel = require('gulp-babel');
const watch = require('gulp-watch');
const plumber = require('gulp-plumber');
const rollup = require('gulp-rollup');
const replace = require('@rollup/plugin-replace');
const uglify = require('gulp-uglify');
const entry = './src/**/*.js';
const clearEntry = './src/middlewares/ErrHandler.js'; //流清洗文件路径
//开发环境任务
function buildDev() {
    return watch(entry, {
        ignoreInitial: false //是否忽略初始化打包，设为false在执行命令的时候就会运行打包，否则只有当我们改动服务端文件下的文件时才会触发打包
    }, function () {
        gulp.src(entry)
            .pipe(plumber())//生产环境如果代码更改时报错，保证服务不会挂掉
            .pipe(babel({
                babelrc: false,
                "plugins": ["@babel/plugin-transform-modules-commonjs"]
            }))
            .pipe(gulp.dest('./dist'));
    })
}

//生产环境任务
function buildProd() {
    return gulp.src(entry)
        .pipe(babel({
            babelrc: false,//不使用全局的.babelrc文件
            ignore: [clearEntry],//忽略某个文件
            "plugins": ["@babel/plugin-transform-modules-commonjs"]
        }))
        .pipe(uglify())
        .pipe(gulp.dest('./dist'));
}

//流清洗的任务

function buildConfig() {
    //treeshaking 摇树优化旨在消除项目中的多余代码，最早是在gulp-rollup中的思想，后webpack借鉴至自己
    var caches = {};
    return gulp.src(entry)
        .pipe(rollup({
            input: clearEntry,
            output: {
                format: 'cjs'
            },
            plugins: [
                replace({
                    'process.env.NODE_ENV': JSON.stringify('production'),
                })
            ]
        }))
        .pipe(uglify())
        .pipe(gulp.dest('./dist'));
}

let build = gulp.series(buildDev);
if (process.env.NODE_ENV === 'production') {
    build = gulp.series(buildProd, buildConfig);
}
gulp.task('default', build);