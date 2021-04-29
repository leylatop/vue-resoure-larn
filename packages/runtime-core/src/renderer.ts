// runtime-core中提供的核心的方法，用来处理渲染
// 会使用runtime-dom中的api进行渲染
// 不同的平台传入的rendererOPtions不一样

import { effect } from '@vue/reactivity/src';
import { ShapeFlags } from '@vue/shared/src';
import { createAppAPI } from "./apiCreateApp"
import { createComponentInstance, setupComponent } from './component';
import { queueJob } from './scheduler';
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
        nextSlibing: hostNextSlibing
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
                // 更新使用effect的shceduler方法
                console.log("更新了");

                // 上一次的树
                let preTree = instance.subTree;
                let proxyToUse = instance.proxy;
                let nextTree = instance.nextTree = instance.render.call(proxyToUse, proxyToUse)
                console.log(preTree, nextTree)
                // 上一次的树和这一次的树进行更新
                patch(preTree, nextTree, container);

                // 核心
                // - diff算法
                // - 序列优化
                // - watchApi
                // - 生命周期
            }
        }, {
            // scheduler自定义更新方法，降低更新频率
            scheduler: queueJob,
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
        for (let i = 0; i < children.length; i++) {
            // 如果是两个连续的文本的话，不可以直接设置container的文本内容，那样的话会覆盖
            // 需要将文本转成节点，然后把节点丢进去
            // 此时还不知道child是文本类型还是对象类型
            let child = normalizeVNode(children[i]);
            // 把创建后的节点塞到容器中
            patch(null, child, container)
        }
    }

    // 元素挂载
    const mountElement = (vnode, container, anchor = null) => {
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
            hostSetElementText(el, children)
        }
        // 如果儿子是数组，就依次挂载数组的儿子
        else if (shapeFlag & ShapeFlags.ARRAY_CHILDREN) {
            mountChildren(children, el);
        }
        // 3.将真实dom插入到容器中（如果有参考节点，则插入到参考节点前面，如果没有，则插入到后面）
        hostInsert(el, container, anchor)
    }

    // 对属性进行对比
    const patchProps = (oldProps, newProps, el) => {
        // 对新老props进行对比，当style在页面中被抽成了一个变量的时候，新老属性值就是相同的
        if (oldProps !== newProps) {
            // 循环两次
            // 循环新的props
            for (let key in newProps) {
                const prev = oldProps[key];
                const next = newProps[key];

                // 如果新老节点的属性值不一样，则更新属性
                if (prev !== next) {
                    // key是属性的值可能的值有class、style、attr、event等
                    hostPatchProp(el, key, prev, next);
                }
            }

            // 循环老的props
            for (let key in oldProps) {
                const prev = oldProps[key];
                // 如果老的节点的props在新的节点里面不存在，则新节点更新后对应的key的值就是null
                if (!(key in newProps)) {
                    hostPatchProp(el, key, prev, null)
                }
            }

        }
    }

    // 更新儿子节点
    const patchChildren = (n1, n2, container) => {
        const c1 = n1.children;
        const c2 = n2.children;

        // 老的有儿子，新的没有儿子
        // 老的没有儿子，新的有儿子
        // 新老都有儿子
        // 新老儿子都是文本



    }

    // 对元素进行比较
    const patchElement = (n1, n2, container) => {
        // 走到这里的时候，就表示n1和n2是同一个节点
        // 1. 复用节点
        let el = n2.el = n1.el;

        // 2. 更新属性
        const oldProps = n1.props || {};
        const newProps = n2.props || {};
        patchProps(oldProps, newProps, n2.el);

        // 3. 更新儿子
        patchChildren(n1, n2, el);

    };

    // 元素处理
    const processElement = (n1, n2, container, anchor) => {
        // 元素挂载
        if (n1 == null) {
            mountElement(n2, container, anchor);
        }
        // 元素更新
        else {
            patchElement(n1, n2, container);
        }
    }
    // ----------------------------------组件处理----------------------------------------------------


    // ----------------------------------文本处理----------------------------------------------------
    const processText = (n1, n2, container) => {
        if (n1 == null) {
            // 将虚拟节点转化成一个dom元素
            let child = n2.el = hostCreateText(n2.children)
            // 将节点插入到container
            hostInsert(child, container)
        } else {

        }
    }
    // ----------------------------------文本处理----------------------------------------------------

    // 判断新旧虚拟节点是否是相同类型的节点
    // 根据type和key进行判断
    const isSameVNodeType = (n1, n2) => {
        return (n1.type === n2.type) && (n1.key === n2.key)
    }

    // 卸载节点
    const unmount = (n1) => {
        // 如果是元素的话，卸载元素节点
        if (n1.shapeFlag & ShapeFlags.ELEMENT) {
            hostRemove(n1.el)
        }

        // 后续判断是否是组件，会走到组件的生命周期里面


    }

    // 1. 第一个参数之前的虚拟节点
    // 2. 第二个参数现在的虚拟节点
    // 3. 第三个参数渲染到哪个容器上
    // 4. 第四个参数是n1节点的参考节点
    const patch = (n1, n2, container, anchor = null) => {
        // 针对不同类型的虚拟节点，做不同的初始化操作
        const { shapeFlag, type } = n2;

        // 如果n1存在，并且n1和n2不是相同类型的节点
        // 如果连节点的类型都不一致的话，就直接移除原来的节点，添加新的节点进去
        if (n1 && !isSameVNodeType(n1, n2)) {
            // 把以前的节点删掉

            // 获取n1的下一个兄弟节点，作为参照物，让n2插入进来
            anchor = hostNextSlibing(n1.el);
            unmount(n1);

            n1 = null;  // 将n1节点置空，则下面流程会重新渲染n2
        }
        switch (type) {
            // 如果是文本节点的话
            case Text:
                processText(n1, n2, container);
                break
            default:
                // 使用位运算的与操作判断数据类型
                if (shapeFlag & ShapeFlags.ELEMENT) {
                    processElement(n1, n2, container, anchor)
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

