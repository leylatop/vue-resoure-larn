// rullup配置（每次打包都会走这个文件）
// 对路径进行处理
import path from 'path';

// 三个插件
// 对json进行处理
import json from '@rollup/plugin-json';
// 对第三方模块进行处理
import resolvePlugin from '@rollup/plugin-node-resolve' 
// 解析ts
import ts from 'rollup-plugin-typescript2'


// 根据环境变量中的target属性，获取对应模块的packages.json
// 找到packages
const packagesDir = path.resolve(__dirname, 'packages');

// packageDir 打包的基准目录
// 找到要打包的那个包
const packageDir = path.resolve(packagesDir, process.env.TARGET);

// 永远针对的是某个模块
const resolve = (p) => path.resolve(packageDir, p)

// 获取该模块的文件名（也可以使用process.env.TARGET获取）
const name = path.basename(packageDir);

// 拿到模块下面的package.json
const pkg = require(resolve('package.json'));

// 对打包类型，自定义一个映射表，根据提供的formats来格式化需要打包的内容
const outputConfig = {
    // es6
    'esm-bundler': {
        file: resolve(`dist/${name}.esm-bundler.js`),
        fromat: 'es'
    },
    // nodejs
    'cjs': {
        file: resolve(`dist/${name}.cjs.js`),
        format: 'cjs'
    },
    'global': {
        file: resolve(`dist/${name}.global.js`),
        format: 'iife', //立即执行函数
    }
}

const options = pkg.buildOptions; // 各自模块中自定义的要打包的类型

function createConfig(format, output) {
    output.name = options.name;
    output.sourcemap = true;    // 生成sourcemap文件

    // 生成rollup配置
    return {
        input: resolve('src/index.ts'),
        output,
        // 插件是有顺序的，从上到下依次执行
        plugins: [
            json(),
            ts({
                // tsconfig 配置文件，在根目录下
                tsconfig: path.resolve(__dirname, 'tsconfig.json')
            }),       //要有对应的tsconmfig.json   使用npx tsc --init，执行nodemodules下 .bin文件夹下tsc.cmd命令，自动生成tsconfig.json文件
            resolvePlugin(),    // 解析第三方模块
        ]
    }
}

// 最终需要导出配置，告诉子进程帮我打一下这些包
export default options.formats.map((format) => {
    // 告诉进程帮我为这个格式加工一个config
    return createConfig(format, outputConfig[format])
});


