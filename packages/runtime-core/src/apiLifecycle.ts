import { currentInstance } from "./component"

const enum LifeCycleHooks {
    BEFORE_MOUNT = 'bm',
    MOUNTED = 'm',
    BEFORE_UPDATE = 'bu',
    UPDATED = 'u'
}

// 第二个参数target 用来标识，它是哪个实例的钩子 函数
const createHook = (lifecycle) => {
    // 执行的结果返回一个函数，为钩子函数真正的方法
    // 函数的参数hook是钩子函数在业务中的参数，钩子函数的参数一般是一个函数，比如onBeforeMount(()=> {})
    return (hook, target = currentInstance) => {
        // 给当前实例增加对应的生命周期，声明周期对应的值为钩子函数的参数hook
        injectHook(lifecycle, hook, target);

    }
}

export const onBeforeMount = createHook(LifeCycleHooks.BEFORE_MOUNT)
export const mounted = createHook(LifeCycleHooks.MOUNTED)
export const onBeforeUpdate = createHook(LifeCycleHooks.BEFORE_UPDATE)
export const updated = createHook(LifeCycleHooks.UPDATED)
