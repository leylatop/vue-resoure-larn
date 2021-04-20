// runtime-dom的核心是提供domAPI方法
// 操作节点、操作属性的更新

import { createRenderer } from "@vue/runtime-core/src";
import { extend } from "@vue/shared/src"
import { nodeOps } from "./nodeOps"
import { patchProps } from "./patchProps"

// 节点操作：dom的增删改查
// 属性操作：添加、删除、更新（样式style、类class、事件event、attrs）

// 渲染时用到的所有方法，最终需要把这些方法传给runtime-core
export const rendererOPtions = extend({ patchProps }, nodeOps);

// 用户调用的是runtime-dom
// runtime-dom调用的是runtime-core
// runtime-dom为了解决平台差异（浏览器的）


// 第一个参数：必须是一个组件
// 第二个属性，根属性
// createApp：将com层代码和core层代码进行分割
export function createApp(rootComponent, rootProps = null) {
    // 外层createApp，调用里层createApp，保证里面和外面的api是相同的
    // 做一个里外的拆分
    const app = createRenderer(rendererOPtions).createApp(rootComponent, rootProps);
    let {mount} = app;
    // 重写mount，重写的时候依然要调用mount
    app.mount = function (container) {   //容器
        // 1. 清空容器的操作
        // 1). 拿到容器
        container = nodeOps.querySelector(container);
        // 2). 进行清空
        container.innerHTML = '';

        // 2. 调用渲染器的mount，将container传过去（函数劫持）
        mount(container);
        // 3. 将组件渲染成dom元素进行挂载，之后挂载的流程就和平台没有关系了，核心的功能会放在runtime-core中去，会调用runtime-core的方法（runtime-core负责挂载）

    }
    return app;
}

export * from '@vue/runtime-core'