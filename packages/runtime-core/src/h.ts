import { isArray } from '@vue/shared/src';
import { isObject } from "@vue/shared/src";
import { createVNode, isVNode } from "./vnode";

// h方法本质是createVNode
// h方法是createVnode的兼容处理
export function h(type, propsOrChildren, children) {
    console.log(type, propsOrChildren, children)
    const l = arguments.length;

    // 类型+属性、类型 + 孩子
    // 儿子节点要么是字符串，要么是数组，针对的是 createVNode 的第三个参数，要么是字符串，要么是数组，要么是null
    if (l == 2) {
        // 如果第二个参数是对象
        if (isObject(propsOrChildren)) {

            // 如果第二个参数是虚拟节点，表示第二个参数是儿子，则把节点包装成数组，把第二个参数当做createVNode的第三个参数传入
            if (isVNode(propsOrChildren)) {
                // h('div',h('p'))
                return createVNode(type, null, [propsOrChildren])
            }

            // 如果第二个参数不是虚拟节点，则是普通对象，则表示第二个参数是属性，则把第二个参数当做createVNode的第二个参数传入
            return createVNode(type, propsOrChildren)
        }

        // 如果第二个参数是数组，表示，第二个参数传入的是type的子元素，把第二个参数当做createVNode的第三个参数传入，数组作为createVNode的第三个参数不需要做转换
        else if (isArray(propsOrChildren)) {
            return createVNode(type, null, propsOrChildren);
        }

        // 如果第二个参数不是对象也不是数组，则表示可能是字符串，则第二个参数是孩子，字符串作为createVNode的第三个参数不需要做转换
        else {
            return createVNode(type, null, propsOrChildren);
        }
    } else {
        // 除了前两个参数，其他的参数保存成数组设置给children
        if (l > 3) {
            children = Array.prototype.slice.call(arguments, 2)
        }
        // 如果只有三个参数，并且第三个参数为虚拟节点的情况下
        // h('div', {}, h('p'))
        else if (l == 3 && isVNode(children)) {
            children = [children]
        }

        return createVNode(type, propsOrChildren, children)
    }
}



// h写法有几种
// h('div','helloworld')
// h('div',h('p'))
// h('div', {})
// h('div', {}, 'helloworld')
// h('div', {}, [h('p'), h('span')])
// h('div', {}, h('p'), h('span'))