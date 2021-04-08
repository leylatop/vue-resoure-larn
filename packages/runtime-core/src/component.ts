// 存放组件相关的方法

import { ShapeFlags } from "@vue/shared/src";

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
        setupState: {},     // setup方法的返回值
        render: null,       // render方法
        isMounted: false,   // 标识组件是否挂载


    }
    // 实例上下文,访问实例的时候可以用instance.ctx._
    // 实现向上代理的功能(代理模式)
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

// 调用实例的setup方法,并且将setup方法的返回值填充到实例的setupState属性上
function setupStatefulComponent(instance) {
    // 1. 代理,涉及到传递给render函数的参数

    // 2. 拿到组件的setup方法
    let Component = instance.type;
    let { setup, render } = Component;

    // 3. 创建一个setup的上下文(和instance不是一个东西)
    let setupContext = createSetupContext(instance);
    setup(instance.props, setupContext);
    // ===============
    render();

}

function createSetupContext(instance) {
    return {
        attrs: instance.attrs,
        slots: instance.slots,
        emit: () => {},     // 更新组件的某个方法
        expose: () => {},   // 暴露一些方法
    }
}