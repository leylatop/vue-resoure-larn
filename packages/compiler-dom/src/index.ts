function baseParse(template) {
    // 标识节点信息（行、列、偏移量、位置）
    
}

// vue3的支持写多个根元素
// 在模板编译阶段，会默认在最外层添加一个对象，若有多个根元素，都是最外层对象的content
export function baseCompile(template) {
    let ast = baseParse(template);
    debugger
    return ast;
}