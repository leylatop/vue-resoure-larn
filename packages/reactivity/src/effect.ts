// 第一个参数是回调函数
// 第二个参数是可选项
// effect相当于vue2的watcher
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
// 存储当前的effect
let activeEffect = null;
// effect 执行栈
let effectStack = [];

// 返回一个函数
function createReactiveEffect(fn, options) {
    const effect = function reactiveEffect() {
        // 将effect加入栈中之前，先判断栈中是否已经包含该effect，避免反复更新属性值，反复调用effect，造成死循环
        if (!effectStack.includes(effect)) {
            // 函数可能会发生异常，所以使用try
            try {
                // 正在执行的函数当前对应到effect
                activeEffect = effect;
                // 若effect回调函数中嵌套了effect，会导致内部effect执行完毕后，再调用属性值到时候，activeEffect还是内部的effct，所以我们使用一个栈来操作
                // 函数执行时，将effect（的引用地址）推入栈中，并且标识当前fn对应的effect
                effectStack.push(effect);
                // 默认执行时，会执行fn；执行函数时，获取属性值，会调用响应式的get的方法
                return fn();
            } finally { //执行完毕，使用 finally
                // 函数执行完毕之后，将effect从栈中弹出，并且标识当前活动effect为栈中最后一个effect
                effectStack.pop();
                activeEffect = effectStack[effectStack.length - 1];
            }
        }
    }

    // 三大特点:  id _isEffect row
    effect.id = uid++;  // 制作一个标识，用于区分不同的effect，源码中用uid做排序，使用uid做标识，用于在组件更新的时候查找对应的effect
    effect._isEffect = true;    // 用于标识这是一个响应式effect（effect函数 私有变量）
    effect.row = fn;    // 用于保存effect对应的原来的函数，根据fn创建的effct，创建二者映射关系
    effect.options = options;   // 在effect上保存用户的属性

    return effect;
}

// 非常严重的问题
// effect(() => {// effect1
//     state.name; // =>effect1
//     effect(() => {//effect2
//         state.age;  // =>effect2
//     })
//     state.address;      // =>effect1(如果只使用全局变量，不使用栈的情况下，此处会是effect1)
// })


// 让某个对象中的属性，收集它当前对应的effect
// 只有取值才可以走这里 

export function track(target, type, key) {
    // 可以拿到当前的effect
    activeEffect
}