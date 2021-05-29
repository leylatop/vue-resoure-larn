import { currentInstance, setCurrentInstance } from "./component"

const enum LifeCycleHooks {
    BEFORE_MOUNT = 'bm',
    MOUNTED = 'm',
    BEFORE_UPDATE = 'bu',
    UPDATED = 'u'
}

// 在这个函数中保留了实例，闭包
// target是在createHook阶段创建了一个闭包的参数，target永远指向的是当时创建时的实例
const injectHook = (type, hook, target) => {
    // 如果该实例没有，就报一个异常
    if(!target) {
        console.warn('调用异常');
    } else {
        // 初始化钩子对应的数组
        const hooks = target[type] || (target[type] = []);

        // 使用切片方式，将target重新赋值给currentInstance
        const wrap = () => {
            // 1. 将target重新赋值给currentInstance
            setCurrentInstance(target); 
            // 2. 执行hook之前保证当前实例指向的是正确的组件,保证当前hook(用户自定义的方法)执行的时候this指向的是正确的组件
            hook.call(target);
            // 3. 将currentInstance重新置为null
            setCurrentInstance(null);
        }
        // 存放钩子函数对应的切片
        hooks.push(wrap);
    }
}


const createHook = (lifecycle) => {
    // 执行的结果返回一个函数，为钩子函数真正的方法
    // 函数的参数hook是钩子函数在业务中的参数，钩子函数的参数一般是一个函数，比如onBeforeMount(()=> {})
    // 第一个参数 hook就是用户写的回调
    // 第二个参数target 用来标识，它是哪个实例的钩子 函数
    return (hook, target = currentInstance) => {
        // 给当前实例增加对应的生命周期，声明周期对应的值为钩子函数的参数hook
        injectHook(lifecycle, hook, target);

    }
}

// 参数fns是一个数组，将数组中的函数依次执行（执行钩子函数的所有回调函数）
export const invokeArrayFns = (fns) => {
    for(let i = 0; i < fns.length; i++) {   // vue2中也是调用时让函数依次执行
        fns[i]();
    }
}

export const onBeforeMount = createHook(LifeCycleHooks.BEFORE_MOUNT)
export const onMounted = createHook(LifeCycleHooks.MOUNTED)
export const onBeforeUpdate = createHook(LifeCycleHooks.BEFORE_UPDATE)
export const onUpdated = createHook(LifeCycleHooks.UPDATED)
