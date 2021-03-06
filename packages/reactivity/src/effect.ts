// 第一个参数是回调函数
// 第二个参数是可选项
export function effect(fn, options: any = {}) {
    // 需要让effect 变成响应式的api，在数据发生变化时，重新执行effect
    // 所以要创建一个响应式的effect
    const effect = createReactiveEffect(fn, options);

    // 如果没有lazy参数的话，默认该effect会先执行一次；lazy参数默认为false
    if (!options.lazy) {
        effect();
    }

    return effect;
}

// 全局变量
let uid = 0;
// 返回一个函数
function createReactiveEffect(fn, options) {
    const effect = function reactiveEffect() {
        // 默认执行时，会执行fn；执行函数时，获取属性值，会调用响应式的get的方法
        fn();
    }

    // 三大特点:  id _isEffect row
    effect.id = uid++;  // 制作一个标识，用于区分不同的effect，源码中用uid做排序，使用uid做标识，用于在组件更新的时候查找对应的effect
    effect._isEffect = true;    // 用于标识这是一个响应式effect（effect函数 私有变量）
    effect.row = fn;    // 用于保存effect对应的原来的函数，根据fn创建的effct，创建二者映射关系
    effect.options = options;   // 在effect上保存用户的属性

    return effect;
}

export function track() {
    
}