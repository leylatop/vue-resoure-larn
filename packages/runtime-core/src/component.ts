import { isFunction, isObject } from '@vue/shared/src';
// 存放组件相关的方法

import { ShapeFlags } from "@vue/shared/src";
import { PublicInstanceProxyHandlers } from "./componentPublicInstance";


// const vnode = {
//     "_v_isVnode": true,
//     "type": {
//         render: function(){},
//         setup: function() {}
//     },
//     "props": {
//         "name": "qiao"
//     },
//     "children": null,
//     "el": null,
//     "shapeFlag": 4,
//     "ShapeFlags": 0
// }

// 根据虚拟节点对应的实例（也就是一个对象），实例中存放着一些属性
// 只初始化定义属性，不进行赋值
export function createComponentInstance(vnode) {
    // props和attrs的区别:
    // props是父组件传入的属性值
    // attrs是子组件实际接收的属性值
    // attrs里面的值,在props里面一定存在
    // props里面的值,attrs里面不一定存在
    // vnode.props里面包含 props和attrs


    // webcomponet定义组件需要有"属性"和"插槽"
    // 组件的实例
    const instance = {
        // uid: uid++,      // 组件标识
        vnode,
        type: vnode.type,   // 组件类型
        parent,             // 组件的爸爸
        ctx: {},            // 实例上下文
        props: {},          // 组件属性
        attrs: {},          // 组件属性2
        slots: {},          // 组件插槽
        setupState: {},     // setup方法的返回值（当返回的值是对象的时候）
        render: null,       // render方法
        isMounted: false,   // 标识组件是否挂载
    }
    // 实例上下文,访问实例的时候可以用instance.ctx._
    // 实现向上代理的功能(代理模式)
    // instance.ctx = {
    //     _: {
    //         // uid: uid++,      // 组件标识
    //         vnode,
    //         type: vnode.type,   // 组件类型
    //         parent,             // 组件的爸爸
    //         ctx: {},            // 实例上下文
    //         props: {},          // 组件属性
    //         attrs: {},          // 组件属性2
    //         slots: {},          // 组件插槽
    //         setupState: {},     // setup方法的返回值
    //         render: null,       // render方法
    //         isMounted: false,   // 标识组件是否挂载
    //     }
    // }
    instance.ctx = {
        _: instance
    }
    return instance;
}

// const vnode = {
//     "_v_isVnode": true,
//     "type": {
//         render: function(){},
//         setup: function() {}
//     },
//     "props": {
//         "name": "qiao"
//     },
//     "children": null,
//     "el": null,
//     "shapeFlag": 4,
//     "ShapeFlags": 0
// }
// 将需要的数据解析到实例上
// 对实例的属性进行赋值
export function setupComponent(instance) {
    const { props, children } = instance.vnode;

    // 根据props,解析出props和attrs,将其放在instance上
    instance.props = props; // initProps()
    instance.children = children;   //插槽解析 initSlot()

    // 判断是否是有状态组件
    let isStateful = instance.vnode.shapeFlag && ShapeFlags.STATEFUL_COMPONENT;
    // 表示现在是一个有状态的组件
    if (isStateful) {
        // 启动带状态的组件
        setupStatefulComponent(instance);
    }
}

// 正在执行setup的实例，执行前赋值，执行后清除
export let currentInstance = null;

// 调用实例的setup方法,并且将setup方法的返回值填充到实例的setupState属性上
function setupStatefulComponent(instance) {
    // 1. 代理,涉及到传递给render函数的参数（当访问实例上的属性时，可以直接被代理到proxy上）
    // 这里代理的是ctx对象，可以添加额外的逻辑
    instance.proxy = new Proxy(instance.ctx, PublicInstanceProxyHandlers as any);
    // 2. 拿到组件的setup方法
    let Component = instance.type;
    let { setup } = Component;

    
    // 3.判断setup是否存在，若不存在，则直接执行render，若存在，则执行setup
    if(setup) {
        currentInstance = instance; // 执行setup时，将当前instance设置到 currentInstance
        // 1. 创建一个setup的上下文(和instance不是一个东西)
        let setupContext = createSetupContext(instance);

        // 2. 调用setup，拿到返回值
        const setupResult = setup(instance.props, setupContext);    // instance中props attrs slots exmit expose 会被提取出来，因为在开发过程中会使用这些属性

        currentInstance = null;     // setup执行完毕后，置空
        // 3. 判断setupResult的数据类型，若是function，则返回值就是render，若是对象，则是实例的setupState属性值，并且将值赋到实例对象属性上面
        handleSetupResult(instance, setupResult);
    } else {
        // 1. 完成组件的启动
        finishComponentSetup(instance);
    }
}

function handleSetupResult(instance, setupResult) {
    if(isFunction(setupResult)) {
        // render函数
        instance.render = setupResult;

    } else if(isObject(setupResult)) {
        // setupState对象
        instance.setupState = setupResult
    }

    // 设置render属性
    finishComponentSetup(instance);
}

function finishComponentSetup(instance) {
    let Component = instance.type;
    // 1. 若instance上不存在render，就去取instance.type上的render方法
    // 2. 若instance.type上也不存在render，就去编译Component.template，将返回结果赋给render
    if(!instance.render) {
        // 若render不存在，则需要对template模板进行编译，产生render
        // template
        if(!Component.render && Component.template) {
            // Component.render = compile(Component.template, {});
        }
        instance.render = Component.render
    }

    // 对vue2.0的api做了兼容处理
    // merge applyOptions
}

// 提取一些在开发过程中会用到的属性，放在上下文中
function createSetupContext(instance) {
    return {
        attrs: instance.attrs,
        slots: instance.slots,
        emit: () => {},     // 更新组件的某个方法
        expose: () => {},   // 暴露一些方法
    }
}

// instance表示组件的状态、各种各样的状态和组件的相关信息
// context就4个参数，是为了开发时使用的
// proxy主要是为了取值方便，不需要使用props state，data 获取值，只使用proxy就可以