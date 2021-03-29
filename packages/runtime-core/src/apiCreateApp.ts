// 创建应用的方法

import { createVNode } from "./vnode";

// 通过高阶函数传参的方式，将render传入进来
export function createAppAPI(render) {
    return function createApp(rootComponent, rootProps) {   // 告诉core哪个属性，哪个组件创建应用
        const app = {
            _props: rootProps,
            _component: rootComponent,
            _container: null,
            mount(container) {      // 告诉core挂载的目的地
                // 这一个方法中可以拿到所有参数
    
                // 框架：都是将组件转化成虚拟dom，然后虚拟dom生成真实dom，然后将真实dom挂载到真实页面上
                // 1. 根据组件创建虚拟节点，vnode是根据组件和属性创建的
                const vnode = createVNode(rootComponent, rootProps);


                // 2. 通过render方法，把vnode渲染到容器上
                render(vnode, container);



                app._container = container;
        
            }
        }
        return app
    }
}