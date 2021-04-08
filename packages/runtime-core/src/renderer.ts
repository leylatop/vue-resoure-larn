// runtime-core中提供的核心的方法，用来处理渲染
// 会使用runtime-dom中的api进行渲染
// 不同的平台传入的rendererOPtions不一样

import { ShapeFlags } from '@vue/shared/src';
import { createAppAPI } from "./apiCreateApp"
import { createComponentInstance, setupComponent } from './component';

// createRenderer 目的就是一个渲染器
export function createRenderer(rendererOPtions) {  //告诉core怎么渲染
    // 渲染的effect, 创建一个effect并执行render函数
    const setupRenderEffect = () => {

    }

    // 1. 第一个参数初始的虚拟节点
    // 2. 第二个参数要挂载的容器
    const mountComponent = (initialNode, container) => {
        // 组件的渲染流程，最核心的业务：
        // 1. 获取setup函数的返回值
        // 2. 获取render函数的返回值进行渲染
        // setup函数和render函数都在虚拟节点的type属性中存储着
        console.log(initialNode, container)

        // 具体执行：
        // 1. 创建一个实例，将实例挂到虚拟节点的component属性上（只定义属性）
        const instance = (initialNode.component = createComponentInstance(initialNode));
        // 2. 将需要的数据解析到实例上（给实例的属性赋值）
        setupComponent(instance);
        // 3. 创建一个effect, 调用render方法
        setupRenderEffect()
        // 创建实例=> 解析render和setup的参数=> 创建effect，让render执行


    }


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

        }
    }
    // 1. 第一个参数之前的虚拟节点
    // 2. 第二个参数现在的虚拟节点
    // 3. 第三个参数渲染到哪个容器上
    const patch = (n1, n2, container) => {
        // 针对不同类型的虚拟节点，做不同的初始化操作
        const { shapeFlag } = n2;
        // 使用位运算的与操作判断数据类型
        if (shapeFlag & ShapeFlags.ELEMENT) {
            console.log('元素')
        } else if (shapeFlag & ShapeFlags.STATEFUL_COMPONENT) {
            processComponent(n1, n2, container)
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

