import { extend, hasChanged, hasOwn, isArray, isIntegerKey, isObject } from "@vue/shared/src";
import { track, trigger } from "./effect";
import { TrackOperatorsTypes, TriggerOperatorsTypes } from "./operators";
import { reactive, readonly } from "./reactive";

// reactive拦截  实现new Proxy的get和set
// 是不是只读：set报异常
// 是不是深度

// 非只读，非浅层
const get = createGetter(false, false);
// 非只读，浅层
const shallowGet = createGetter(false, true);
// 只读，非浅层
const readonlyGet = createGetter(true, false);
// 只读，浅层
const shollowReadlyGet = createGetter(true, true);


const set = createSetter(false);
const shallowSet = createSetter(true)

let readonlyObj = {
    set: function(target, key) {
        console.warn(`set on key ${key} falied`);
    }
}

// reactive拦截 
export const mutableHandlers = {
    get: get,
    set: set

}

// shallowReactive拦截
export const shallowReactiveHandlers = {
    get: shallowGet,
    set: shallowSet

}

// readonly拦截器
export const readonlyHandlers = extend({
    get: readonlyGet,
}, readonlyObj)

// shallowReadonly拦截器
export const shallowReadonlyHandlers = extend({
    get: shollowReadlyGet,
}, readonlyObj)


// 拦截获取
function createGetter(isReadonly = false, shallow = false) {
    // 取的是原对象的本身
    return function get(target, key, receiver) {
        // proxy+reflect
        
        // 后续Object上的方法会被迁移到Reflect
        // target[key] = value设置值可能会失败，且不会报异常，没有返回值
        // Reflect方法具备返回值 

        // 反射
        // 如果去proxy里面取值，就把目标里面的值反射回去
        // 等价于 target[key]
        // receiver代理对象，谁调用，就是谁
        const res = Reflect.get(target, key, receiver);

        // 如果不是只读的，就要收集依赖，等数据变化时更新对应的视图
        // 如果是只读的，则不能更新，所以不需要收集依赖
        if (!isReadonly) {
            // effect对应的fn函数会默认执行一次
            // 在effect执行时候，使用到reactive响应式数据，需要获取响应式数据的属性值，会调用get方法
            // 此时将依赖收集起来
            // 要监听到特定target内到key值变化（不同target中可能会有相同属性，确切到target）
            // get操作时候执行track函数
            track(target, TrackOperatorsTypes.GET, key);
        }

        // 如果是浅层代理，则直接返回属性对应的值就可以（因为属性对应的值没有被代理，还是普通的对象或者基本数据类型值）
        if (shallow) {
            return res;
        }

        // 如果不是浅层代理，则需要再对res进行代理
        // 此时如果如果则要判断是不是只读的，若是只读的，则需要再使用readonly/reactive重新包裹，保证它是响应式的
        if (isObject(res)) {    // vue2是一上来就递归， vue3在取到值时候代理，vue3是懒代理
            return isReadonly ? readonly(res) : reactive(res)
        }

        return res;

    }
}

// 拦截设置
function createSetter(shallow = false) {
    return function set(target, key, value, receiver) {

        // vue2无法监控更改索引，无法监控数组的长度变化->hack的方法 需要特殊处理
        // 1. 区分是新增的还是修改的（set、add）
        // 2. 区分是数组还是对象
        // 如果是数组，且key是整形（index），就判定target为数组
        // 判断set的key是新增的还是已有的
        const hadKey = isArray(target) && isIntegerKey(key) ? Number(key) < target.length : hasOwn(target,key)
        const oldValue = target[key];   //获取老值
        
        // 等价于 target[key] = value
        // receiver代理对象，谁调用，就是谁
        const result = Reflect.set(target, key, value, receiver);
        
        if (!hadKey) {
            // 新增
            trigger(target, TriggerOperatorsTypes.ADD, key, value)

        } else if (hasChanged(oldValue, value)) {
            // 修改
            trigger(target, TriggerOperatorsTypes.SET, key, value, oldValue);
        }

        // 当数据更新时，通知对应属性的effect重新执行
        return result;

    }
}