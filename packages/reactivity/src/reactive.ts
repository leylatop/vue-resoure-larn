import { isObject } from '@vue/shared/src';
import { 
    mutableHandlers, 
    readonlyHandlers, 
    shallowReactiveHandlers, 
    shallowReadonlyHandlers 
} from './baseHandlers';

// 响应式api
export function reactive(target) {
    return createReactiveObject(target, false, mutableHandlers);
}

export function shallowReactive(target) {
    return createReactiveObject(target, false, shallowReactiveHandlers);
}

export function readonly(target) {
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
    if (isObject(target)) {
        return target
    }

    // 如果某个对象已经被代理过了，就不要再次代理了
    // 可能一个对象，第一次被深度代理，第二次被只读代理
    const proxyMap = isReadonly ? readonlyMap : reactiveMap;

    // 如果已经被代理过，则直接返回
    const existProxy =  proxyMap.get(target);
    if (existProxy) {
       return existProxy
    }

    // 2. 代理target
    const proxy = new Proxy(target, baseHandlers);

    // 将代理暂存起来，避免被重复代理
    // map的key值为要代理的对象，map的value值为代理结果
    proxyMap.set(target, proxy);

    return proxy

}