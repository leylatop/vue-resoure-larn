// createVNode 创建虚拟节点的核心流程

import { isString } from "@vue/shared/src"

// h('div', {style: {color: 'red'}}, 'children')
// createVNode({render() {}}, {name: 'qiao'})
// h方法和createVNode方法类似

export function createVNode(type, props, children = null) {
    // 可以根据type来区分是组件还是普通的元素

    // 根据type来区分是组件还是元素，其中：
    // 元素是字符串
    // 组件是对象

    // 是组件还是元素，给虚拟节点加一个类型
    const shapeFlag = isString(type)
    if(shapeFlag)

    // 虚拟节点的含义： 一个对象来描述对应的内容
    // 虚拟节点有跨平台的能力
    const vnode = {
        _v_isVnode: true,
        type,
        props,
        children,
        el:null,    // 稍后会将虚拟节点和真实节点对应起来
        key: props && props.key, //做diff算法用
        shapeFlag,
    }
    
    return vnode
    

}