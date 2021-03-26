export const nodeOps = {
    // 元素操作方法
    // 增加
    cerateElement: tagName => document.createElement(tagName),

    // 删除
    remove: child => {
        const parent = child.parentNode;
        if (parent) {
            parent.removeChild(child);
        }

    },

    // 插入
    insert: (child, parent, anchor = null) => {
        // 如果参照物为空，则相当于appendChildl 
        parent.insertBefore(child, anchor);

    },

    // 查询
    querySelector: selector => document.querySelector(selector),

    // 设置元素内容
    setElementText: (el, text) => el.textContent = text,


    // 文本操作
    // 创建文本
    createText: text => document.createTextNode(text),

    // 设置文本中的内容（设置文本的值，可以用nodeValue）
    setText: (node, text) => { node.nodeValue = text },

};