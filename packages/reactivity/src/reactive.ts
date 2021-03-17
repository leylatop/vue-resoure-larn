import { isObject } from "@vue/shared/src";
import { 
    mutableHandlers, 
    readonlyHandlers, 
    shallowReactiveHandlers, 
    shallowReadonlyHandlers 
} from './baseHandlers';

// 响应式api
export function reactive(target) {
    // 如果方法已经被readonly代理过，则直接返回。被readonly代理过就会添加proxy，取值时会走get方法 reactive(readonly(obj))
    // 判断target上是否有isReadonly属性

    // 一个对象不能重复被代理
    // reactive(reactive(obj))
    return createReactiveObject(target, false, mutableHandlers);
}

export function shallowReactive(target) {
    return createReactiveObject(target, false, shallowReactiveHandlers);
}

export function readonly(target) {
    // 被reactive代理过的对象，可以继续被readonly处理
    // readonly(reactive(obj))
    return createReactiveObject(target, true, readonlyHandlers);

}
export function shallowReadonly(target) {
    return createReactiveObject(target, true, shallowReadonlyHandlers);
}

// 是否是只读、是不是深度
// 柯里化函数 根据外层方法传入参数，核心方法一致
// new Proxy 底层原理
// 需要拦截数据的读取和数据的修改（get set）

// WeakMap在垃圾回收的时候会自动回收，不会造成内存泄漏
// 使用map暂存已经代理过的对象
const reactiveMap = new WeakMap(); 
const readonlyMap = new WeakMap();  
export function createReactiveObject(target, isReadonly, baseHandlers) {
    // 1. 如果不是对象，则直接返回
    if (!isObject(target)) {
        return target
    }

    // 如果某个对象已经被代理过了，就不要再次代理了
    // 判断是否被代理过分为两种情况
    // 1. 对象第一次已经被代理过了，第二次传入的是第一次代理过的proxy（判断target是否有row属性，如果有row属性，就说明已经被代理过了，target是个proxy，返回target本身）
    // 2. 对象第一次被代理过，第二次又传入同名的target（在map中查找是否有对应的proxy对象，如果有的话，则已经被代理过，返回map中target对应的值）

    // 可能一个对象，第一次被深度代理，第二次被只读代理
    const proxyMap = isReadonly ? readonlyMap : reactiveMap;

    // 如果target已经被代理过，则直接返回
    const existProxy =  proxyMap.get(target);
    if (existProxy) {
       return existProxy
    }

    // 判断target的类型， COLLECTION 还是 COMMON 还是 INVALID ，根据target的类型使用不同的handler
    // switch (rawType) {
    //     case 'Object':
    //     case 'Array':
    //         return 1 /* COMMON */;
    //     case 'Map':
    //     case 'Set':
    //     case 'WeakMap':
    //     case 'WeakSet':
    //         return 2 /* COLLECTION */;
    //     default:
    //         return 0 /* INVALID */;
    // }
    // const targetType = getTargetType(target)
    // getTargetType会判断两种特殊情况：1. target是否有skip属性； 2. target是否是一个不可扩展对象，如果是，则返回INVALID

    // 若对象不可扩展，则直接返回

    // 2. 代理target
    // COLLECTION使用COLLECTION的handler ，COMMON使用COMMON的handler
    const proxy = new Proxy(target, baseHandlers);

    // 将代理暂存起来，避免被重复代理
    // map的key值为要代理的对象，map的value值为代理结果
    proxyMap.set(target, proxy);

    return proxy

}

// toRaw的本质是将proxy代理转回object对象
// 被代理过的对象会被添加__v_raw属性
// 内部会调用一次observed['__v_raw'],触发get方法，然后判断map中有没有target对应的reducer（判断是否被代理过），如果有的话，返回target
export function toRaw(observed) {
    
}