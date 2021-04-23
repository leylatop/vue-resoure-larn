// runtime-core中提供的核心的方法，用来处理渲染
// 会使用runtime-dom中的api进行渲染
// 不同的平台传入的rendererOPtions不一样

import { effect } from '@vue/reactivity/src';
import { ShapeFlags } from '@vue/shared/src';
import { createAppAPI } from "./apiCreateApp"
import { createComponentInstance, setupComponent } from './component';
import { normalizeVNode, Text } from './vnode';

// createRenderer 目的就是一个渲染器
export function createRenderer(rendererOPtions) {  //告诉core怎么渲染
    const {
        insert: hostInsert,
        remove: hostRemove,
        patchProp: hostPatchProp,
        createElement: hostCreateElement,
        createText: hostCreateText,
        createComment: hostCreateComment,
        setText: hostSetText,
        setElementText: hostSetElementText,
    } = rendererOPtions;

    // ----------------------------------组件处理----------------------------------------------------
    // 组件渲染
    // 渲染的effect, 创建一个effect并执行render函数
    // render方法中拿到的数据会收集这个effect，属性更新时， effect会重新执行
    const setupRenderEffect = (instance, container) => {
        // 区分是初始化渲染，还是更新渲染
        instance.update = effect(function componentEffect() { //每个组件都有一个effect，vue3是组件级更新，数据更改，会重新执行组件的effect
            // 判断是否被挂载
            // 1. 若没有被挂载过，则说明是第一次渲染
            if (!instance.isMounted) {

                // 初次渲染结束后 instance.isMounted设置成true
                instance.isMounted = true;

                // 执行render，拿到返回结果
                let proxyToUse = instance.proxy;

                // 虚拟节点（组件父亲）：vnode（$vnode）
                // 组件对应的渲染内容（儿子）：subTree（_vnode）
                let subTree = instance.subTree = instance.render.call(proxyToUse, proxyToUse);
                // {
                //     "_v_isVnode": true,
                //     "type": "div",
                //     "props": {
                //         "style": {
                //             "color": "red"
                //         }
                //     },
                //     "children": "helloworld",
                //     "component": null,
                //     "el": null,
                //     "shapeFlag": 1,
                //     "ShapeFlags": 8
                // }

                // 用render函数的返回值，也就是子树进行渲染
                patch(null, subTree, container);
            } else {
                // 2. 这里是更新渲染
            }
        })
    }

    // 组件挂载
    // 1. 第一个参数初始的虚拟节点
    // 2. 第二个参数要挂载的容器
    const mountComponent = (initialNode, container) => {
        // 组件的渲染流程，最核心的业务：
        // 1. 获取setup函数的返回值
        // 2. 获取render函数的返回值进行渲染
        // setup函数和render函数都在虚拟节点的type属性中存储着

        // 具体执行：
        // 1. 创建一个实例，将实例挂到虚拟节点的component属性上（只定义属性）
        const instance = (initialNode.component = createComponentInstance(initialNode));

        // 2. 将需要的数据解析到实例上（给实例的属性赋值）
        setupComponent(instance);   // state props render attrs


        // 3. 创建一个effect, 调用render方法
        setupRenderEffect(instance, container)
        // 创建实例=> 解析render和setup的参数=> 创建effect，让render执行


    }


    // 组件处理
    // 1. 第一个参数之前的虚拟节点
    // 2. 第二个参数现在的虚拟节点
    // 3. 第三个参数渲染到哪个容器上
    const processComponent = (n1, n2, container) => {
        // 初始化操作（没有上一次的虚拟节点，表示现在是第一次）
        if (n1 === null) {
            // 把n2直接挂载到container上面
            mountComponent(n2, container);
        }
        // 组件更新流程
        else {
            // updateComponet(n1, n2, container)
        }
    }
    // ----------------------------------组件处理----------------------------------------------------



    // ----------------------------------元素处理----------------------------------------------------
    // 挂载元素的儿子（一般用作数组的儿子）
    const mountChildren = (children, container) => {
        for(let i = 0; i < children.length; i++) {
            // 如果是两个连续的文本的话，不可以直接设置container的文本内容，那样的话会覆盖
            // 需要将文本转成节点，然后把节点丢进去
            // 此时还不知道child是文本类型还是对象类型
            let child = normalizeVNode(children[i]);
            // 把创建后的节点塞到容器中
            patch(null, child, container)
        }
    }

    // 元素挂载
    const mountElement = (vnode, container) => {
        // 递归渲染
        const { props, shapeFlag, type, children } = vnode;
        let el = vnode.el = hostCreateElement(type);

        // 1. 将props（style、event、class、attr）绑定到真实dom上
        if (props) {
            for (const key in props) {
                hostPatchProp(el, key, null, props[key])
            }
        }

        // 2. 渲染子节点
        // 如果儿子是文本，直接丢进去就可以 
        if (shapeFlag & ShapeFlags.TEXT_CHILDREN) {
            console.log(el, children)
            hostSetElementText(el, children)
        }
        // 如果儿子是数组，就依次挂载数组的儿子
        else if (shapeFlag & ShapeFlags.ARRAY_CHILDREN) {
            mountChildren(children, el);
        }
        // 3.将真实dom插入到容器中
        hostInsert(el, container)
    }


    // 元素处理
    const processElement = (n1, n2, container) => {
        // 元素挂载
        if (n1 == null) {
            mountElement(n2, container);
        }
        // 元素更新
        else {

        }
    }
    // ----------------------------------组件处理----------------------------------------------------


    // ----------------------------------文本处理----------------------------------------------------
    const processText = (n1, n2, container) => {
        if(n1 == null) {
            // 将虚拟节点转化成一个dom元素
            let child = n2.el = hostCreateText(n2.children)
            console.log(n2)
            // 将节点插入到container
            hostInsert(child, container)
        } else {
            
        }
    }
    // ----------------------------------文本处理----------------------------------------------------


    // 1. 第一个参数之前的虚拟节点
    // 2. 第二个参数现在的虚拟节点
    // 3. 第三个参数渲染到哪个容器上
    const patch = (n1, n2, container) => {
        // 针对不同类型的虚拟节点，做不同的初始化操作
        const { shapeFlag, type } = n2;
        switch(type) {
            // 如果是文本节点的话
            case Text:
                processText(n1, n2, container);
                break
            default:
                // 使用位运算的与操作判断数据类型
                if (shapeFlag & ShapeFlags.ELEMENT) {
                    processElement(n1, n2, container)
                } else if (shapeFlag & ShapeFlags.STATEFUL_COMPONENT) {
                    processComponent(n1, n2, container)
                }

        }

        

    }
    const render = (vnode, container) => {
        // core的核心， 根据不同的虚拟节点，创建真实的dom元素

        // 默认调用render，默认是初始化流程
        // 初始化和更新都会走patch方法，所以会有之前的虚拟节点和现在的虚拟节点做diff算法
        // 1. 第一个参数之前的虚拟节点
        // 2. 第二个参数现在的虚拟节点
        // 3. 第三个参数渲染到哪个容器上
        patch(null, vnode, container);
    }
    return {
        // createAppAPI执行后返回一个createApp方法，并且成功的将render方法传到createApp里面去了
        // createApp执行后会返回一个app对象
        createApp: createAppAPI(render),

    }
}

