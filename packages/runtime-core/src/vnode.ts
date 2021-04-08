// createVNode 创建虚拟节点的核心流程

import { isArray, isObject, isString, ShapeFlags } from "@vue/shared/src"

// h('div', {style: {color: 'red'}}, 'children')
// createVNode({render() {}}, {name: 'qiao'})
// h方法和createVNode方法类似

export function createVNode(type, props, children = null) {
    // 可以根据type来区分是组件还是普通的元素

    // 根据type来区分是组件还是元素，其中：
    // 元素是字符串
    // 组件是对象

    // 判断第一个参数是组件还是元素，给虚拟节点加一个类型
    // 1. 如果是字符串就认为是元素类型
    // 2. 如果是对象，就认为是有状态的组件
    // 3. 否则认为是0
    // 描述自己的类型
    const shapeFlag = isString(type) ? ShapeFlags.ELEMENT : isObject(type) ? ShapeFlags.STATEFUL_COMPONENT : 0

    // 虚拟节点的含义： 一个对象来描述对应的内容
    // 虚拟节点有跨平台的能力
    const vnode = {
        _v_isVnode: true,   //标识vnode类型
        type,
        props,
        children,
        component: null,  // 如果是组件，则这里存放的是组件对应的实例（实例中存放的是render和setup的参数）
        el:null,    // vnode对应的真实的元素，稍后会将虚拟节点和真实节点对应起来
        key: props && props.key, //做diff算法用
        shapeFlag   // 判断当前自己的类型和儿子的类型，
    }
    
    // 描述自身和儿子的类型，可以针对不同的儿子类型做不同的处理
    normalizeChildren(vnode, children);
    console.log(vnode)
    // {
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

    return vnode;
}

function normalizeChildren(vnode, children) {
    // 判断vnode的儿子类型
    let type = 0;
    // 1. 如果儿子不存在，什么也不用做
    if(children === null) {

    } 
    // 2. 如果儿子是数组，则标识type为数组类型
    else if(isArray(children)) {
        type = ShapeFlags.ARRAY_CHILDREN;
    } 
    // 3. 默认是文本类型
    else {
        type = ShapeFlags.TEXT_CHILDREN;
    }

    // 得出自己的类型和儿子的类型，既包括自己的类型，也包括儿子的类型，或运算结束后值是唯一的
    vnode.ShapeFlags |= type;
}