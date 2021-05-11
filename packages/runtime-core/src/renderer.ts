// runtime-core中提供的核心的方法，用来处理渲染
// 会使用runtime-dom中的api进行渲染
// 不同的平台传入的rendererOPtions不一样

import { effect } from '@vue/reactivity/src';
import { ShapeFlags } from '@vue/shared/src';
import { createLogicalAnd } from 'typescript';
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

                // 上一次的树
                let preTree = instance.subTree;
                let proxyToUse = instance.proxy;
                let nextTree = instance.nextTree = instance.render.call(proxyToUse, proxyToUse)
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

    // 移除儿子数组
    const unmountChildren = (children) => {
        // 儿子是个数组，所以需要依次进行遍历并移除
        for (let i = 0; i < children.length; i++) {
            unmount(children[i])
        }
    }

    // 核心diff算法
    const patchKeyedChildren = (c1, c2, container) => {
        // ***************Vue3对特殊情况进行优化， 尽可能的减少比对区域***********************
        let i = 0;                  // 默认从头部开始比较， i最终的值表示两个序列对比后，最前面不是同一个类型的位置
        let e1 = c1.length - 1;     // 指针1：指向c1的最末端， e1最终的值表示两个序列对比之后，c1最末端与c2不是同一个类型的位置
        let e2 = c2.length - 1;     // 指针2：指向c2的最末端， e2最终的值表示两个序列对比后，c2最末端与c1不是同一个类型的位置

        // 1. 从头开始比，遇到不同的就停止对比 sync from start
        while (i <= e1 && i <= e2) {
            // 拿到c1和c2的开头
            const n1 = c1[i];
            const n2 = c2[i];
            // 如果n1和n2是同一个类型，就去更新props和儿子，去走patch方法
            if (isSameVNodeType(n1, n2)) {
                patch(n1, n2, container)
            } else {
                break;
            }
            i++;
        }

        // 2. 从尾开始比对， 遇到不同的就停止对比 sync from end
        // （本次循环没有操作i，i值保持不变）
        while (i <= e1 && i <= e2) {
            // 拿到c1和c2的尾巴
            const n1 = c1[e1];
            const n2 = c2[e2];
            if (isSameVNodeType(n1, n2)) {
                patch(n1, n2, container)
            } else {
                break;
            }
            e1--;
            e2--;
        }


        // 3. 同序列挂载，有一方已经比对完了 common sequence mount
        // 问题： 如何确定是要新增挂载？挂载元素的个数？挂载的位置（向前插入or向后插入）？
        // 回答：
        //      1. 循环结束后，若i比e1大，就说明老的少，有新增的
        //      2. i和e2之间的就是需要新增挂载的元素
        //      3. 判断是否存在e2的下一个元素，如果e2的下一个元素位置比c2的长度还大，则表示下一个位置是不存在的，则表示向后插入；如果存在，则插入到下一个元素之前
        // 要新增（老的少新的多）
        if (i > e1) {
            // 新增的部分
            if (i <= e2) {
                // 拿到e2的下一个位置
                const nextPos = e2 + 1;
                // 如果下一个位置比c2长度小，则在下一个位置之前插入新的元素；
                // 如果下一个位置比c2的长度大或者一样大，则在尾部添加新的元素
                const anchor = nextPos < c2.length ? c2[nextPos].el : null;

                // 循环i到e2，patch进行新增
                while (i <= e2) {
                    patch(null, c2[i], container, anchor);
                    i++;
                }
            }
        }

        // 4. 同序列卸载，有一方已经比对完了 common sequence unmount
        // 问题： 如何确定是要卸载？卸载元素的个数？
        // 回答：
        //      1. 循环结束后，若i比e2大，就说明老的多，新的少，需要卸载        
        //      2. i和e1之间的就是需要删除的元素

        // 要卸载或者一样多（老的多，新的少）
        else if (i > e2) {
            while (i <= e1) {
                unmount(c1[i]);
                i++;
            }
        }

        // 5. 乱序比较，需要尽可能的复用
        // 描述: 经过双端循环之后, 最终结果,i<e1 i<e2,不会走上面两个逻辑,i和e1 e2中间的就是乱序的部分,我们需要尽可能的复用
        // 思路: 用新的元素做一个映射表,去老的里面找,一样的就复用,不一样的就要么插入,要么删除
        else {
            // 新增两个指针s1和s2 s1和s2的初始值相同,都是i
            // s1: c1最左侧与c2不是同一个类型的元素的位置
            // s2: c2最左侧与c1不是同一个类型的元素的位置
            let s1 = i;
            let s2 = i;
            // s1-e1之间 c1与c2相比,c1最短不同的元素区间
            // s2-e2之间 c2与c1相比,c2最短不同的元素区间

            // vue3用新的做映射表, map的key值为虚拟节点的key,value为新的虚拟节点在列表中对应的下标
            const keyToNewIndexMap = new Map();
            for (let i = s2; i <= e2; i++) {
                const childVnode = c2[i];    //childVnode是虚拟节点
                // 使用vnode的key和index下标
                keyToNewIndexMap.set(childVnode.key, i);
            }

            // c2中需要patch的个数
            // 1. 获取s2到e2之间的虚拟节点的个数
            // 2. 需要将这些虚拟节点进行标识，看是否被patch过
            // 3. 若被patch过，则表示有可复用的元素；如果没有被patch过，则表示需要挂载新的元素
            const toBePatched = e2 - s2 + 1;
            // 使用新的索引和老的索引进行标记映射，
            const newIndexToOldIndexMap = new Array(toBePatched).fill(0);


            // 拿老的元素去映射表中,看是否存在
            for (let i = s1; i <= e1; i++) {
                const oldVnode = c1[i];
                // 老的虚拟节点,对应的新的序列中的位置
                let newIndex = keyToNewIndexMap.get(oldVnode.key);
                // 如果老的虚拟节点在新的序列中没有找到对应的位置,就说明老的元素,不在新的序列里面,我们就去卸载它
                if (newIndex == undefined) {
                    unmount(oldVnode)
                }
                // 如果老节点在新序列中有对应的index,就把老的虚拟节点和新虚拟节点进行patch,更新属性和儿子
                else {
                    // 新的和旧的的索引关系，新儿子中的节点在老儿子中的位置
                    // newIndex - s2 为老节点在新序列中对应的位置，在数组中对应的下标，需要把前面同序列过的去掉
                    // i + 1 是老节点的位置，+1是为了避免下标为0的时候和默认值冲突；0表示节点没有被patch过
                    newIndexToOldIndexMap[newIndex - s2] = i + 1;
                    patch(oldVnode, c2[newIndex], container)
                }
            }

            console.log(newIndexToOldIndexMap);
            

            // 获取最长递增子序列 [5, 3, 4, 0] => [1, 2]， 返回的是最长递增子序列的下标
            let increasingNewIndexSequence = getSequence(newIndexToOldIndexMap);
            // 最长递增子序列的长度（不需要移动的元素的长度）
            let j = increasingNewIndexSequence.length - 1;
            // 倒叙操作，是为了有个参照物，按照参照物不停的patch
            // toBePatched - 1 是获取的数组的索引
            for (let i = toBePatched - 1; i >= 0; i--) {
                // 获取最后一个元素以及最后一个元素的下一个元素（寻找参照物）
                // 如果有下一个元素，则是插入行为；如果下一个元素为空，则是patch行为
                let currentIndex = i + s2;  // 找到最后一个元素的索引
                let childVnode = c2[currentIndex];   // 找到最后一个元素对应的虚拟节点
                let nextIndex = currentIndex + 1;   // 找到最后一个元素的下一个索引
                // 判断下一个索引的位置是否大于c2的长度,如果大于,则向后追加元素;如果小于,则在下一个索引位置之前插入元素
                // 查找参照物
                let anchor = nextIndex < c2.length ? c2[nextIndex].el : null;
                // 根据 newIndexToOldIndexMap 判断元素是否被patch过,如果是0说明是个新元素
                if(newIndexToOldIndexMap[i] == 0) {
                    patch(null, childVnode, container, anchor);
                } else {
                    // 将虚拟节点的真实节点插入 插入的过程具有移动性
                    // 这种操作,需要将节点全部移动一遍,希望尽可能少的移动
                    // 第一次插入最后一个元素后,虚拟节点会拥有真实节点
                    // i的值分别是 3 2 1 0
                    if(i !== increasingNewIndexSequence[j]) {
                        hostInsert(childVnode.el, container, anchor);
                    } else {
                        // 插入的下标若与最长递增子序列的下标一致，则可以跳过；跳过不需要移动的元素
                        j--;
                    }
                }
            }
            // 移动节点,并且将新增的节点插入
            // 最长递增子序列
            // 求出最长递增子序列之后，就知道哪些元素不需要移动，不需要移动的元素可以跳过
        }



        // ***************Vue3对特殊情况进行优化， 尽可能的减少比对区域***********************

    }

    function getSequence(arr) {
        // 1. 先拿到要求最长递增子序列的序列的总个数
        const len = arr.length;
        // 2. 最终的结果是最长递增子序列的索引，默认放入0，是拿当前序列索引为0的位置的值作为参照物进行后续比对
        // 索引对应的arr中的值是一个递增的序列，所以我们使用二分查找性能更高，性能是log(n)
        const result = [0];
    
        const p = arr.slice(0).fill(-1);//先把原数组拷贝一份，里面内容无所谓，主要是为了存储原数组对应的前一个位置的索引，所以需要长度一致一对一
    
        // 二分查找的start，end， middle
        let start, end, middle;
        for (let i = 0; i < len; i++) {
            // 3. 拿到当前数
            const arrI = arr[i];
            // 4. 当前数若为0，则表示当前项为新增的一项
            // 新增的一项不需要进行移位和排序操作，直接插入就可以，所以将0的情况排除在外
            if (arrI !== 0) {
                // 5. 拿已经排好的列表中的最后一项，拿到的最后一项是arr中的索引值
                const resultLastIndex = result[result.length - 1];
                // 6. 取到result最后一项的值，作为arr的索引，找到值索引对应的arr中的值；与当前值进行对比；若当前值更大，则直接将当前值的索引push到result中
                // *********************result中存储的是最长递增子序列的索引**************************
                if (arr[resultLastIndex] < arrI) {
                    // 如果当前的值比上一个值大，则直接将当前索引push到result，并且将p数组中当前值对应的位置，改成上一个值的索引，记录前一个值的索引
                    // 形成一一对应的关系，即当前值的上一个值的索引是谁
                    p[i] = resultLastIndex;
                    result.push(i);
                    continue;
                }
    
                // 7. 二分查找，找已经排好的列表中比当前值大的那一项
                // 二分查找是，查找result的索引，找到对应的值，值的内容是arr的索引，然后根据arr的索引找到arr对应的值
                // ************** start end middle 是result的索引*************
                start = 0;
                end = result.length - 1;
                while (start < end) {
                    // 7.1 向下取整，找中间位置的前一个
                    middle = ((start + end) / 2) | 0;
                    // 7.2 
                    // 找到的中间位置的前一个的值为result的索引
                    // 根据result的索引，获取到result的值
                    // result中存储的值为arr的索引
                    // 根据arr的索引找到索引对应的arr中的值
                    // 拿索引对应的arr的值与当前值进行对比
    
                    // 7.2.1 若当前值较大，则从中间值向后查找，更新start的值为middle的下一个位置
                    if (arr[result[middle]] < arrI) {
                        start = middle + 1;
                    }
                    // 7.2.2 若当前值较小，则从中间值向前查找，更新end的值为middle值
                    else {
                        end = middle;
                    }
                    // 7.2.3 进行下一轮二分查找
                }
                // 开始和结尾相等， 说明找到了，结束二分查找
                // start/end就是找到的位置，此时start和end是相同的，此时需要将当前值的索引替换start/end索引对应的值
                if (arrI < arr[result[start]]) { //如果两个值相同，或者比当前值还小，就不进行替换了（以防外一）
                    // 替换逻辑 当前位置大于0才涉及到替换
                    // 记住它要替换的那个人的前一个位置的索引
                    // start是result的下标，start-1是前一个位置
                    // result[start - 1] 是前一个位置的索引
                    if (start > 0) {
                        p[i] = result[start - 1];
                    }
                    result[start] = i;
                }
            }
    
        }
    
    
        // 最长递增子序列最终长度
        let len1 = result.length;
        // 最长递增子序列长度的最后一个值的在arr中的索引（这个值是唯一确定的）
        // last的初始值是9对应的arr的下标
        let last = result[len1 - 1];
        // 根据前驱节点，从后向前查找，进行追溯
        while (len1-- > 0) {
            // 将result最后一个值，替换成
            // last是result的值，但是是arr和p标签的下标
            result[len1] = last;
            // p中下标为last的值，就是arr中下标为last的值的前一个值的下标；p、result、last都是arr的下标
            // 所以需要将last不停的置为前一个值的下标
            last = p[last]
        }
        return result
    }

    // 更新儿子节点
    // 更新文本内容：hostElementText=> oldText-newText oldText-newArray
    // 卸载老儿子: unmountChildren=> oldArray-newText oldArray-newNull
    // 挂载新儿子： mountChildren=> oldText-newArray 
    const patchChildren = (n1, n2, container) => {
        const c1 = n1.children;
        const c2 = n2.children;

        // 老的有儿子，新的没有儿子
        // 老的没有儿子，新的有儿子
        // 新老都有儿子
        // 新老儿子都是文本

        // n1儿子的节点类型
        const preShapeFlag = n1.shapeFlag;
        // n2儿子的节点类型
        const shapeFlag = n2.shapeFlag;

        // 如果新儿子是文本类型
        if (shapeFlag & ShapeFlags.TEXT_CHILDREN) {
            // 如果老儿子是n个孩子，孩子可能是组件或者元素，但是新的是文本，则需要先移除老儿子
            if (preShapeFlag & ShapeFlags.ARRAY_CHILDREN) {
                unmountChildren(c1);    // 如果c1包含组件会调用组件的销毁方法
            }

            // 新老儿子不一致
            // 1. 如果老儿子是数组，则数组和文本一定不一样
            // 2. 如果老儿子是文本，则直接替换新文本进去就可以
            if (c2 !== c1) {
                hostSetElementText(container, c2)
            }
        }
        // 新儿子不是文本类型（要么是数组，要么是null）
        else {
            // 如果新儿子是元素类型（但是上一次可能是文本或者数组）
            // 旧：h('div', {style: {color: 'red'}}, [h('p', 'hello'), h('p', 'hello')])
            // 新：h('div', {style: {color: 'blue'}}, h('p', 'hello'))
            if (preShapeFlag & ShapeFlags.ARRAY_CHILDREN) {
                // 之前是数组，当前也是数组
                if (shapeFlag & ShapeFlags.ARRAY_CHILDREN) {
                    // ****************************************核心diff算法***********************************
                    // 根据虚拟节点的key来进行diff比较
                    patchKeyedChildren(c1, c2, container)
                    // ****************************************核心diff算法***********************************
                }
                // 之前是数组，当前是null（特殊情况），直接删除老儿子
                else {
                    unmountChildren(c1)
                }
            } else {
                // 当前是数组，之前是文本
                // 就把老的清空，把新的挂上去
                if (preShapeFlag & ShapeFlags.TEXT_CHILDREN) {
                    hostSetElementText(c1, '');
                }
                if (shapeFlag & ShapeFlags.ARRAY_CHILDREN) {
                    mountChildren(c2, container);
                }
            }
        }
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
    // ----------------------------------元素处理----------------------------------------------------


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
        if (n1.shapeFlag & ShapeFlags.COMPONENT) {

        }


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

    // core的核心， 根据不同的虚拟节点，创建或移除真实的dom元素
    const render = (vnode, container) => {
        // 虚拟节点为空，组件卸载
        if(vnode == null) {
            // unmount(container._vnode);
        } else {
            // 默认调用render，默认是初始化流程
            // 初始化和更新都会走patch方法，所以会有之前的虚拟节点和现在的虚拟节点做diff算法
            // 1. 第一个参数之前的虚拟节点
            // 2. 第二个参数现在的虚拟节点
            // 3. 第三个参数渲染到哪个容器上
            patch(null, vnode, container);
        }
    }

    return {
        // createAppAPI执行后返回一个createApp方法，并且成功的将render方法传到createApp里面去了
        // createApp执行后会返回一个app对象
        createApp: createAppAPI(render),

    }
}

