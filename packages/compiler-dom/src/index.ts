import { PatchFlags } from "packages/shared/src/patchsFlags";
import { baseParse, NodeTypes } from "./parse";
export const CREATE_VNODE = Symbol('createVnode');
export const TO_DISPALY_STRING = Symbol('toDisplayString');
export const OPEN_BLOCK = Symbol('openBlock');
export const CREATE_BLOCK = Symbol('createBlock')
export const FRAGMENT = Symbol('Fragment');
export const CREATE_TEXT = Symbol('createTextVNode');

// 专门处理元素children是元素的部分
function transformElement(node, context) {
    // console.log(node, context, "开始收集元素的回调");

    // 希望在整个树遍历完毕后，再处理元素
    if (node.type != NodeTypes.ELEMENT) {
        return;
    }

    // 退出函数存在的意义是为了在树遍历结束之后，从文本节点开始往上执行退出函数
    return () => {  // 退出函数 洋葱模型
        console.log(node, context, '处理元素的回调');

    }
}

// 判断节点是否是文本节点 或者表达式节点
function isText(node) {
    return node.type == NodeTypes.INTERPOLATION || node.type == NodeTypes.TEXT
}

// 用于最后生成代码
function createCallExpression(callee, args) {
    return {
        type: NodeTypes.JS_CACHE_EXPRESSION,
        callee,
        arguments: args

    }
}
// 专门处理元素中children是文本的部分
function transformText(node, context) {
    // console.log(node, context, "开始收集文本的回调");

    // {{name}}  hello => name + 'hello' => createTextNode(name + 'hello')
    // 尽可能将文本都合并
    if (node.type == NodeTypes.ROOT || node.type == NodeTypes.ELEMENT) {
        return () => {  // 退出函数 洋葱模型

            // 对元素中的文本进行合并操作
            let hasText = false;
            let children = node.children;
            let container = null;
            for (let i = 0; i < children.length; i++) {
                let child = children[i];
                // 如果当前节点是文本，还要判断当前节点的下一个节点是不是文本，双重循环
                if (isText(child)) {
                    hasText = true; // 当前元素有文本，需要进行合并
                    for (let j = i + 1; j < children.length; j++) {
                        let next = children[j];
                        // 如果下一个节点也是文本，就进行两个节点的合并
                        if (isText(next)) {
                            if (!container) {
                                // 将后一个文本节点合并到前面的文本节点中
                                container = children[i] = {
                                    type: NodeTypes.COMPOUND_EXPRESSION,
                                    loc: child.loc,
                                    children: [child],
                                }

                            }
                            // 将后一个节点，放到前面节点中 并且在中间添加+
                            container.children.push(`+`, next);
                            // 删除原来j位置的节点
                            children.splice(j, 1);
                            // 防止删除j位置的节点后，数组塌陷，所以再进行j--
                            j--

                        } else {
                            container = null;
                            break;
                        }
                    }
                }
            }
            // 如果不包含文本，就需要往helper增加方法
            // 或者儿子只包含一个孩子，在代码执行的时候直接innerHTML，无需createText
            if (!hasText || children.length == 1) {
                return;
            }

            // createTextNode('wenben', 0); 标识动态文本
            for (let i = 0; i < children.length; i++) {
                const child = children[i];
                if (isText(child) || child.type == NodeTypes.COMPOUND_EXPRESSION) {
                    const callArgs = [];    // 用于存放createTextNode的参数
                    callArgs.push(child);   // 第一个参数为文本
                    if(child.type !== NodeTypes.TEXT) {  // 非纯文本，表达式或复试表达式就标识成动态节点
                        callArgs.push(PatchFlags.TEXT + '/* TEXT */');
                    }
                    children[i] = {
                        type: NodeTypes.TEXT_CALL,  //文本调用, 该节点要调用createTextNode
                        content: child,
                        loc: child.loc,
                        codegenNode:createCallExpression(
                            context.helper(CREATE_TEXT),
                            callArgs
                        )                // 要生成什么样的代码

                    }
                }
            }
        }
    }
}

// 转化策略，返回很多转化的方法
function getBaseTransformPreset() {
    // 方法1 方法2...
    // 顺序不能改变
    return [
        transformElement,
        transformText
    ]
}

// 创建转化时的上下文
function createTransformContext(root, nodeTransform) {
    // 上下文的目的是为了传参方便
    const context = {
        root,                   // 原始节点
        currentNode: root,      // 当前正在转化的节点是谁（会随着树的深度遍历而更新）
        nodeTransform,          // 转化的方法
        helpers: new Set(),     // 收集要用到的方法，针对节点类型不同   createTextNode createVNode
        helper(name) {          // 往helper中添加代码中用到的具体方法，并且返回方法的名字
            context.helpers.add(name);
            return name;
        }
    }
    return context
}

// 遍历节点的儿子节点，儿子节点是数组
function traverseChildren(node, context) {
    const children = node.children;
    for (let i = 0; i < children.length; i++) {
        const child = children[i];
        // 遇到儿子就进行遍历，深度优先遍历
        // 比如先处理文本节点，处理完文本节点后调用createTextNode，然后再去调用createVNode
        traverseNode(child, context);
    }

}

// 遍历节点
function traverseNode(node, context) {
    // 遍历节点时，需要调用上下文中的方法
    const { nodeTransform } = context;
    // 更新当前正在转化的节点
    context.currentNode = node;

    // 收集回调函数，执行的时候从后往前执行，实现函数模型
    const exits = [];
    // 拿到转化的每一个方法，然后调用
    for (let i = 0; i < nodeTransform.length; i++) {
        // debugger
        const onExit = nodeTransform[i](node, context);
        if (onExit) exits.push(onExit);
    }

    // 如果是根元素或者是元素，就继续遍历子元素
    switch (node.type) {
        case NodeTypes.ROOT:
        case NodeTypes.ELEMENT:
            traverseChildren(node, context)
    }


    // 遍历结束后，开始执行回调函数
    let i = exits.length;

    context.currentNode = node;
    // 倒叙执行
    while (i--) {
        exits[i]();
    }
}

// 将ast语法进行转化（优化 静态提升 方法缓存，为了最终生成代码）
// 对ast树的每个节点进行转化，从元素开始处理，到内部可能是文本或者继续是元素
function transform(root, nodeTransform) {
    // 获取转化上下文
    const context = createTransformContext(root, nodeTransform);

    // 从根节点开始遍历节点
    traverseNode(root, context);
}

export function baseCompile(template) {
    let ast = baseParse(template);
    // 每调用一个节点都要调用里面的方法
    const nodeTransform = getBaseTransformPreset();
    transform(ast, nodeTransform)
    return ast;
}