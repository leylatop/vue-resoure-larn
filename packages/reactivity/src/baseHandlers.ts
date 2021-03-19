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
    // 当取属性时，判断属性值需不需要被代理，对数组特殊方法进行处理，并且进行依赖收集
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

        // 取值时判断target是否是数组
        // 如果是数组，且target不是只读的，会重写原有方法，并调用原有方法，类似于vue2的拦截器（方法劫持），因为includes indexOf lastIndexOf参数不固定，可能是数组的每个元素
        // 1. 调用includes indexOf lastIndexOf 
        //      1.1 重写的方法将数组的每个值进行track收集依赖
        //      1.2 内部调用了toRaw方法，因为走到get内部的肯定是proxy，需要拿到proxy对应的object
        
        // 2. 调用push pop shift unshift splice，会自动访问length属性
        //      2.1 暂停收集的功能和增加收集项的功能， 暂停依赖收集
        //      2.2 防止length被修改的时候，无线循环
        //      2.3 忽略length属性收集

 
        // 取值时，判断key是否是内置的symbol，或者是原型链上的属性，若是，则直接返回


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


        // 判断key值是否是ref，key值可能是被ref包裹过的,reactive嵌套ref
        // 如果key的值是ref，则取值的value属性返回，不然还要使用res.key.value，自动拆包
        // 只会拆对象，不会拆数组 数组要加.value，对象不用
        // reactive({
        //     name: ref('qiao')
        // })
        // reactive([ref(1), 2, 3])


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
        

        // 如果对象被深层代理
        // reactive({r:1, age: ref(1)})
        // proxy.r = reactive({a: 1})
        // 1. 如果设置的值是reactive代理过的对象，则会toRaw拿到原来的对象，将对象设置到key上
        // proxy.age=>ref(1)   设置新值之后 proxy.age = 11    proxy.age=>ref(11) 
        // 2. 如果属性原来的值是ref，新值不是ref，则会把新值当做原有的ref的值传进去


        // 等价于 target[key] = value
        // receiver代理对象，谁调用，就是谁
        const result = Reflect.set(target, key, value, receiver);
        
        // 如果对象的原型也是proxy的话，则只触发一次set
        // 场景：定义了a对象和b对象，将a对象设置代理，将b对象的__proto__属性设置到a的代理上，给b对象都设置代理，调用set方法时，会触发原型链的set
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