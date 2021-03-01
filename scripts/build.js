// 构建时的js，把packages下的所有包都进行打包
const fs = require('fs');
const execa = require('execa'); // 开启子进程进行打包，最终还是使用rollup来打包

// 获取打包目录packages下所有的目录，不包含文件
// 所有要打包的target
const targets = fs.readdirSync('packages').filter((f) => {
    // 如果是文件，则排除掉
    if(!fs.statSync(`packages/${f}`).isDirectory()) {
        return false
    }
    return true
})

// 开启进程
async function build(target) {
    // rollup：  使用rollup  进行打包
    // -c: 采用某个配置文件
    // --environment： 采用环境环境变量
    // {stdio: 'inherit'}： 希望子进程的输出共享到父进程里面
    await execa('rollup', ['-c', '--environment', `TARGET:${target}`], {stdio: 'inherit'})
}

// 对目标依次并行打包
function runParallel(targets, interatorFn) {
    const res = [];
    for(const item of targets) {
        const p = interatorFn(item);
        res.push(p);
    }
    return Promise.all(res);
}

runParallel(targets, build)


