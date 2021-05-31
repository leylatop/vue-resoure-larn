import { parseJsonText } from "typescript";

export const enum NodeTypes {
    ROOT,
    ELEMENT,
    TEXT,
    COMMENT,
    SIMPLE_EXPRESSION,
    INTERPOLATION,
    ATTRIBUTE,
    DIRECTIVE,
    // containers
    COMPOUND_EXPRESSION,
    IF,
    IF_BRANCH,
    FOR,
    TEXT_CALL,
    // codegen
    VNODE_CALL,
    JS_CALL_EXPRESSION,
    JS_OBJECT_EXPRESSION,
    JS_PROPERTY,
    JS_ARRAY_EXPRESSION,
    JS_FUNCTION_EXPRESSION,
    JS_CONDITIONAL_EXPRESSION,
    JS_CACHE_EXPRESSION,

    // ssr codegen
    JS_BLOCK_STATEMENT,
    JS_TEMPLATE_LITERAL,
    JS_IF_STATEMENT,
    JS_ASSIGNMENT_EXPRESSION,
    JS_SEQUENCE_EXPRESSION,
    JS_RETURN_STATEMENT
}

function createParserContext(content) {
    // 创建初始值
    return {
        line: 1,
        column: 1,
        offset: 0,
        source: content,        // 这个source会被不停的移除前面已经解析过的部分，每解析一段就移除前面那部分，source是剩下的部分，source为空的时候，解析就完毕了
        originSource: content,  // 原始的模板信息，这个值不会发生变化，只是记录传入的值
    }
}

// 模板是否解析完毕，解析完毕的核心是判断一直在减少的 source 是否变成了空，变成空则说明解析完毕
function isEnd(context) {
    const source = context.source;
    return !source;
}

// 解析元素类型
function parseElement(context) {

}

// 解析vue表达式
function parseInterpolation(context) {

}

// 获取当前上下文的行、列、偏移量
function getCursor(context) {
    let { line, column, offset } = context;
    return { line, column, offset }
}

// 获取上下文中的source的文本
function parseTextData(context, endIndex) {
    const rawText = context.source.slice(0, endIndex);  //从0到endIndex之间的则为文本的内容
    return rawText
}


function advancePositionWithMutation(context, source, endIndex) {
    // 1. 更新行数（根据换行符来计算）
    let lineCount = 0;
    let linePos = -1;   // 换行的次数，默认为没有换过行
    for (let i = 0; i < endIndex; i++) {
        // 换行\n对应的是10，遇到换行就++
        if (source.charCodeAt(i) == 10) {
            lineCount++
            linePos = i;    // 换行后第一个人的位置
        }
    }
    context.line += lineCount;

    // 2. 更新列数
    // 每次换行的时候记住每一行的开始的位置，用最终的结束减去开始的位置，就知道列数
    // 如果linePos值为-1，则说明没有换行，直接使用原来的column加上endIndex
    // 如果linePos的值不为1，则linePos为最后一次换行后的第一个人在字符串中的位置，本质上是字符串中最后一个\n的下标，拿总的endIndex - linePos,就得到最后一行的总个数，即总列数
    context.column = linePos == -1 ? context.column + endIndex : endIndex - linePos;

    // 3. 更新偏移量
    context.offset += endIndex;
}
// 更新上下文的source
function advanceBy(context, endIndex) {
    // 未删除之前的source
    let source = context.source;

    // 计算出一个新的结束位置
    // 根据内容和结束索引来修改上下文的信息
    advancePositionWithMutation(context, source, endIndex);

    // 删除endIndex之前的部分，为新的source
    context.source = source.slice(endIndex);    
}

// 获取信息对应的开始、结束、内容
function getSelection(context, start) {
    let end = getCursor(context);
    console.log(context);
    
    return {
        start,
        end,
        source: context.originSource.slice(start.offset, end.offset)    // 这里计算的是子元素原本的source，从originSource中截取的
    }
}

// 解析文本类型
function parseText(context) {
    /******************************************获取文本区间的结束位置******************************************/
    // 截取的时候不截取结束位置的文本，包前不包后

    // 文本区间是从开始到 < 或 {{ 或到最后结束
    const endTokens = ['<', '{{'];
    // 假设文本区间的结束位置是source的总长度，即整个source都是文本
    let endIndex = context.source.length;

    // 假设法
    // 假设遇到了<， 也遇到了{{, 则这两个的下标哪个在前面，哪个就是文本区间的结尾
    // 假设遇到了其中一个，则这个下标就是文本区间的结尾
    // 假设一个也没遇到，则文本区间为模板内容的整个长度，标识整个都是文本
    for (let i = 0; i < endTokens.length; i++) {
        const index = context.source.indexOf(endTokens[i], 1);    // 从第1个开始找，因为第0个是它本身，不需要进行比较
        // 假设先遇到了 <, 并且 < 的位置比endIndex靠前，则更新endIndex的值为 < 的位置
        // 下一次若遇到了 {{， 则表示比较 < 和 {{ 的位置，谁的比较靠前，endIndex的值就更新为这个值
        if (index !== -1 && endIndex > index) {  // 说明source中包含 < 或者 {{, 则把endIndex向前移
            // 假设最后一个是
            endIndex = index;
        }
    }
    /******************************************获取文本区间的结束位置******************************************/


    /******************************************更新行列信息******************************************/
    // 文本的开始位置
    let start = getCursor(context);

    // 获取文本
    const content = parseTextData(context, endIndex);

    // 更新source， source进行前进，即删除source前面已经解析过的部分
    // 并且更新行列信息
    advanceBy(context, endIndex);
    /******************************************更新行列信息******************************************/

    return {
        type:NodeTypes.TEXT,
        content,
        loc: getSelection(context, start)
    }
}

// 解析上下文的儿子
function parseChildren(context) {
    // 最终生成的儿子
    const nodes = [];

    // 只要source一直不为空，就一直循环着去解析
    while (!isEnd(context)) {
        // 当前上下文中的内容
        const s = context.source;
        // 当前儿子
        let node = null;
        // 判断上下文是以什么开头的，以此来判断当前儿子的类型
        // 1. 以 < 开头的，则表示是元素
        // 2. 以 {{ 开头的，则表示是vue的表达式
        // 3. 否则我们默认为是文本类型
        // ps:此处只了核心判断，除此之外可能还有注释等特殊情况
        if (s[0] == '<') {
            node = parseElement(context);
        } else if (s.startsWith('{{')) {
            node = parseInterpolation(context);
        } else {
            node = parseText(context)
            // break
        }
        nodes.push(node)
    }

    return nodes;
}

// 将模板解析成ast树
function baseParse(template) {
    // 标识节点信息（行、列、偏移量、位置）
    // 每解析一段就移除一部分，核心就是状态机

    // 创建编译的上下文，记录行列偏移量等信息
    const context = createParserContext(template);

    // 解析模板的儿子，传入context是因为context已经包含了所有的信息
    return parseChildren(context)
    console.log(context)


}

// vue3的支持写多个根元素
// 在模板编译阶段，会默认在最外层添加一个对象，若有多个根元素，都是最外层对象的content
export function baseCompile(template) {
    let ast = baseParse(template);
    console.log(ast);

    return ast;
}