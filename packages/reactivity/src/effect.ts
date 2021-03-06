// 第一个参数是回调函数
// 第二个参数是可选项
export function effect(fn, options:any = {}) {
    // 需要让effect 变成响应式的api，在数据发生变化时，重新执行effect
    // 所以要创建一个响应式的effect
    const effect = createReactiveEffect(fn, options);

    // 如果没有lazy参数的话，默认该effect会先执行一次；lazy参数默认为false
    if (options.lazy) {
        effect();
    }

    return effect;
}

// 返回一个函数
function createReactiveEffect(fn, options) {
    const effect = function reactiveEffect() {

    }

    return effect;
}