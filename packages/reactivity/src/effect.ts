import { isArray, isIntegerKey } from "@vue/shared/src";
import { TriggerOperatorsTypes } from "./operators";

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
function cleanup(effect) {
    const {deps}  = effect;
    if(deps.length) {
        for(let i = 0; i<deps.length; i++) {
            deps[i].delete(effect);
        }
        deps.length = 0; //找到effect的deps属性循环，并且删除掉，重写收集
    }
    
}

// 返回一个函数
function createReactiveEffect(fn, options) {
    const effect = function reactiveEffect() {
        // 将effect加入栈中之前，先判断栈中是否已经包含该effect，避免反复更新属性值，反复调用effect，造成死循环
        if (!effectStack.includes(effect)) {
            // 如果栈中已经已经有了当前的effect，就需要重写收集依赖，每次重写执行effect都会取值，调用get方法，重新进行依赖收集
            cleanup(effect);
            // 函数可能会发生异常，所以使用try
            try {
                // 暂停收集
                // enableTracking()
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

                // 恢复收集
                // resetTracking()
                activeEffect = effectStack[effectStack.length - 1];
            }
        }
    }

    // 三大特点:  id _isEffect row
    effect.id = uid++;  // 制作一个标识，用于区分不同的effect，源码中用uid做排序，使用uid做标识，用于在组件更新的时候查找对应的effect
    effect._isEffect = true;    // 用于标识这是一个响应式effect（effect函数 私有变量），判断参数是否为函数已经被effect后的返回值
    effect.row = fn;    // 用于保存effect对应的原来的函数，根据fn创建的effct，创建二者映射关系，如果一个函数被过后的值，再次被effect，则fn为第一次的方法，但是前后两个fn是不一样的
    effect.options = options;   // 在effect上保存用户的属性
    effect.allowRecurse = !!options.allowRecurse;   // 是否允许effect重复执行
    effect.active = true;   // effect是否是激活状态
    effect.deps = []    //effect对应的属性
    effect.options = options;

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
const targetMap = new WeakMap();
// map的key是对象
// map的值是 一个map
// 只有在effect取值的属性才走这里，收集依赖的函数
export function track(target, type, key) {
    // 可以拿到当前的effect
    // 如果当前activeEffect为空，则表示不用收集
    if (activeEffect === undefined) {
        return;
    }

    // 例如：
    // target = { name: 'qiao', age: 22 };
    // key 对应的是name，age
    // depsMap = {  //map数组
    //     ({ name: 'qiao', age: 22 }) => { 
    //         name => [effect1, effect2],//这里是一个set数组
    //         age => [effect1, effect2]
    //     }
    // }
    // 查找map中有没有target对应的map值
    let depsMap = targetMap.get(target);
    // 如果没有的话，将target存储到map中，key值是target对象，value值是空的map对象
    if (!depsMap) {
        targetMap.set(target, (depsMap = new Map()));
    }

    // 查找有没有该key值对应的map值（map值为set数组）
    let dep = depsMap.get(key);
    // 如果不存在，则存储一个set数组（set可以在反复调用的时候，防止反复收集）
    if (!dep) {
        depsMap.set(key, (dep = new Set()));
    }

    // 如果set数组中不存在activeEffect，则往set里面存储activeEffect
    // 完成收集
    if (!dep.has(activeEffect)) {
        dep.add(activeEffect)   // 将属性和effect关联起来，通过属性可以找到effect 也可以通过effect找到属性
        activeEffect.deps.push(dep)
    }
}

// 找到属性对应的effect函数，执行
export function trigger(target, type, key?, newValue?, oldValue?) {
    // 如果这个属性没有被收集过effect，则不需要做任何操作
    // map的key是target
    const depsMap = targetMap.get(target);
    if (!depsMap) {
        return
    }

    // 将所有要执行的effect 全部存到一个新的集合中，最终一起执行
    // 使用set保存对相同的effect进行去重，比如修改一个数组的length属性，可能会有多个相同的effect，避免重复调用（修改一个属性的时候避免重复更新，不包括多次修改一个属性的时候（节流））
    const effects = new Set();
    // 收集要执行的effect
    const add = (effectsToAdd) => {
        // 也有可能是多个
        if (effectsToAdd) {
            effectsToAdd.forEach(effect => {
                effects.add(effect)
            });
        }
    }

    // 特殊情况：1. 判断修改的是不是数组的长度；修改数组的长度影响较大；
    // - 判断target是不是数组（不排除对象里含有length属性的情况）
    if (key === 'length' && isArray(target)) {
        // 1. 如果对应的长度有依赖收集需要更新（即：effect中使用了数组的长度这个值）
        depsMap.forEach((dep, depKey) => {
            // - 如果effect中使用到了数组的length属性
            // - 或者effect中使用的数组下标，大于数组被重新设置的长度
            // - 如果更改的长度小于收集的索引，那么这个索引也需要触发effect重新执行
            if (depKey === 'length' || depKey > newValue) {
                console.log(dep, depKey)
                // 收集dep，dep为要执行的effect函数
                add(dep);
            }
        });

    } else {
        // 如果是对象，或修改数组的索引（索引小于数组长度时），直接触发key对应的effect
        if (key !== undefined) {    // key值存在，修改对象的值
            // 把之前key对应的effect放到effects去执行
            add(depsMap.get(key))
        }

        switch (type) {
            case TriggerOperatorsTypes.ADD:
                // 如果是数组，并且key是数组的索引，则把length对应的effect重新执行；修改了索引的值（索引大于数组长度时），触发length的对应的effect
                if (isArray(target) && isIntegerKey(key)) {
                    add(depsMap.get('length'))
                }
        }

    }
    function run() {
        // 如果effect的第二个参数有onTrigger选项，且选项是个函数，则执行onTrigger

        // 如果effect的第二个参数里面有sheduler选项，且选项是个函数，参数为effect， 则执行sheduler（走自己定义的更新逻辑）

        // 否则，执行effect
        // effect()

    }
    // 执行更新（源码这里执行的是run方法， 我们简写了）
    effects.forEach((effect: any) => { effect(); })
}

// watchApi和组件都是基于effect
// reactive对应 observe effect对应watch