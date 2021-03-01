// 开发执行的js，只针对某个包的

// 构建时的js，把packages下的所有包都进行打包
const fs = require('fs');
const execa = require('execa'); // 开启子进程进行打包，最终还是使用rollup来打包

// 打包目标
const target = 'reactivity';

async function build(target) {
    // rollup：  使用rollup  进行打包
    // -c: 采用某个配置
    // -cw: 可以在开发环境下，监控文件的变化，并且进行打包（动态打包）
    // --environment： 采用环境环境变量
    // {stdio: 'inherit'}： 希望子进程的输出共享到父进程里面
    await execa('rollup', ['-cw', '--environment', `TARGET:${target}`], {stdio: 'inherit'})
}
// 打包
build(target);


