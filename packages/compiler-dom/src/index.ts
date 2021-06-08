import { baseParse, NodeTypes } from "./parse";

// 转化元素
function transformElement(node, context) {
    console.log(node, context, "处理元素");
}

// 转化文本
function transformText(node, context) {
    console.log(node, context, "处理文本");
}

// 转化策略，返回很多转化的方法
function getBaseTransformPreset() {
    // 方法1 方法2...
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
        traverseNode(child, context);
    }

}

// 遍历节点
function traverseNode(node, context) {
    // 遍历节点时，需要调用上下文中的方法
    const { nodeTransform } = context;
    // 更新当前正在转化的节点
    context.currentNode = node;

    // 拿到转化的每一个方法，然后调用
    for (let i = 0; i < nodeTransform.length; i++) {
        nodeTransform[i](node, context);
    }

    // 如果是根元素或者是元素，就继续遍历子元素
    switch (node.type) {
        case NodeTypes.ROOT:
        case NodeTypes.ELEMENT:
            traverseChildren(node, context)
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