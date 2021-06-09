export const enum NodeTypes {
    ROOT,   // fragment 解决多个根节点的问题
    ELEMENT,    // 普通元素
    TEXT,       // 文本节点
    COMMENT,
    SIMPLE_EXPRESSION,  // 简单表达式 {{name}}
    INTERPOLATION,      // {{}}
    ATTRIBUTE,
    DIRECTIVE,
    // containers
    COMPOUND_EXPRESSION,    // 组合表达式 'hello' {{name}}
    IF,
    IF_BRANCH,
    FOR,
    TEXT_CALL = 12,              // 文本调用 createTextVNode
    // codegen
    VNODE_CALL = 13,
    JS_CALL_EXPRESSION = 17,     // js调用 
    JS_OBJECT_EXPRESSION,
    JS_PROPERTY,
    JS_ARRAY_EXPRESSION,
    JS_FUNCTION_EXPRESSION,
    JS_CONDITIONAL_EXPRESSION,
    JS_CACHE_EXPRESSION,        // 方法缓存

    // ssr codegen
    JS_BLOCK_STATEMENT,
    JS_TEMPLATE_LITERAL,
    JS_IF_STATEMENT,
    JS_ASSIGNMENT_EXPRESSION,
    JS_SEQUENCE_EXPRESSION,
    JS_RETURN_STATEMENT
}

// 创建一个初始上下文
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

// 模板是否解析完毕，解析完毕的核心是判断一直在减少的 source 是否变成了空， 或者接下来的字符是元素的结束标签，否则说明解析完毕
function isEnd(context) {
    const source = context.source;
    // 下一字符是元素的结束标签，就结束递归儿子
    if (source.startsWith('</')) {
        return true;
    }
    return !source;
}

// 删除多余的空格
function anvanceSpances(context) {
    const match = /^[\s\t\r\n]+/.exec(context.source);  // 匹配空格
    // match ["    "]
    if (match) {
        advanceBy(context, match[0].length)
    }
}

function parseTag(context) {
    // 获取开始位置
    const start = getCursor(context);
    // \/的意思可能是开始标签也有可能是结束标签，所以后面加一个?
    // \s 空格
    // \t tab键
    // \r \n 换行
    // /自闭合标签
    const match = /^<\/?([a-z][^\s\t\r\n/>]*)/.exec(context.source);   //match是所有符合条件的字符
    //match  ["<div", "div", index: 0, input: "<div>hahaha</div>", groups: undefined]

    // element名称
    const tag = match[1];

    // 把解析过从source删除掉
    advanceBy(context, match[0].length);
    // 删除空格
    anvanceSpances(context);

    // 判断是否是自闭合标签
    const isSelfClosing = context.source.startsWith('/>')

    // 如果是自闭合就删掉2个（/>）, 否则就删掉1个（>）
    advanceBy(context, isSelfClosing ? 2 : 1)
    return {
        type: NodeTypes.ELEMENT,
        tag,
        isSelfClosing,
        loc: getSelection(context, start)
    }
}

// 解析元素类型
function parseElement(context) {
    // 1. 解析标签名
    const ele: any = parseTag(context);
    // 2. 解析儿子，如果有子元素，就继续解析儿子标签，递归调用parseChildren方法进行解析
    // 无论儿子是文本、元素、表达式，都可以通过parseChildren进行判断
    let children = parseChildren(context);

    // 3. 如果没有子元素了，就继续解析结束标签
    if (context.source.startsWith('</')) {
        parseTag(context);  //解析结束标签时，同时会移除关闭信息，并且更新偏移量
    }

    // 4. 将儿子挂载到上下文中
    ele.children = children;
    // 5. 更新context的结束位置和偏移量
    ele.loc = getSelection(context, ele.loc.start);

    return ele

}

// 解析vue表达式
function parseInterpolation(context) {
    // 表达式以{{开头，以}}结尾，中间的是表达式的内容
    // 表达式的type是5， NodeTypes.SIMPLE_EXPRESSION
    // 表达式的内容的type是4，NodeTypes.COMMENT

    // 开始位置为0，取一次默认的line column offset
    const start = getCursor(context);
    // 结束位置 获取source中}} 的位置，以 }} 标识
    const closeIndex = context.source.indexOf("}}", "{{");  //从{{ 开始查找，找到}}

    // source去掉前2个，前2个字符是{{
    advanceBy(context, 2);

    // 获取内容开始的位置(此时source已经前进了2个，所以line column offset 是内容开始的位置)
    const innerStart = getCursor(context);
    // 获取内容结束的位置
    const innerEnd = getCursor(context);

    // 内容的长度（包含空格）
    const rowContentLength = closeIndex - 2;
    // 内容（包含空格），endIndex为内容的长度
    const preTrimContent = parseTextData(context, rowContentLength);
    // 内容（去掉前后空格）
    const content = preTrimContent.trim();

    // 计算出去空格后的内容，在原始内容中的偏移量
    const startOffset = preTrimContent.indexOf(content);


    // 前面有空格， 更新实际内容开始的位置 innerStart
    if (startOffset > 0) {
        advancePositionWithMutation(innerStart, preTrimContent, startOffset);
    }

    // 更新innerEnd，使用innerStart开始的位置（startOffset）+去掉空格后文本的长度，即为文本最中的位置
    const end = startOffset + content.length;
    advancePositionWithMutation(innerEnd, preTrimContent, end);
    // source去掉最后2个，最后2个字符是}},此时source的值为空
    advanceBy(context, 2);

    return {
        type: NodeTypes.INTERPOLATION,
        content: {
            type: NodeTypes.SIMPLE_EXPRESSION,
            content,
            isStatic: false,
            loc: getSelection(context, innerStart, innerEnd)
        },
        loc: getSelection(context, start)
    }


}

// 获取当前上下文的行、列、偏移量
function getCursor(context) {
    let { line, column, offset } = context;
    return { line, column, offset }
}

// 获取上下文中的source文本的0到endIndex之间的内容
function parseTextData(context, endIndex) {
    const rawText = context.source.slice(0, endIndex);  //从0到endIndex之间的则为文本的内容

    // 解析完文本之后，需要把source中解析过的文本删除掉
    // 更新source， source进行前进，即删除source前面已经解析过的部分
    // 并且更新行列信息
    advanceBy(context, endIndex);
    return rawText
}

// 更新开始位置或结束位置的行、列、偏移量
// 第一个参数为开始位置或者结束位置的上下文
// 第二个参数为被解析的文本
// 第三个参数为解析结束的位置
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
function advanceBy(context, length) {
    // 未删除之前的source
    let source = context.source;

    // 计算出一个新的结束位置
    // 根据内容和内容结束的位置来修改上下文的信息
    advancePositionWithMutation(context, source, length);

    // 删除之后的length的那部分，为新的source
    context.source = source.slice(length);
}

// 获取信息对应的开始、结束、内容
function getSelection(context, start, end?) {
    end = end || getCursor(context);

    return {
        start,
        end,
        source: context.originSource.slice(start.offset, end.offset)    // 这里计算的是去掉空格后的内容，从originSource中截取的
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

    /******************************************更新行列信息******************************************/

    return {
        type: NodeTypes.TEXT,
        content,
        loc: getSelection(context, start)
    }
}

// 解析上下文的儿子
function parseChildren(context) {
    // 最终生成的儿子
    const nodes = [];

    // 只要source一直不为空或者元素该元素已经接续完毕，就一直循环着去解析
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
        }
        nodes.push(node)
    }

    // 如果解析完毕后node的子节点有多个
    // 1. 每个根节点都是html元素
    // 2. 有不必要的空节点
    // 3. 有很多空格
    nodes.forEach((node, index) => {
        // 如果节点是文本节点，就判断文本节点是否有多余的空格，或者整个文本都是空格
        if (node.type == NodeTypes.TEXT) {
            // 匹配到的内容全部是空格， 将该节点置空
            if (!/[^\s\t\r\n]+/.test(node.content)) {
                nodes[index] = null;
            }
            // 将匹配到的多个空格转化成1个空格
            else {
                node.content = node.content.replace(/[\s\t\r\n]+/g, ' ')
            }
        }
    })
    // 如果是空 或者 undefined就过滤掉
    return nodes.filter(Boolean);

    // return nodes.filter((node) => {
    //     return Boolean(node)
    // })

}
// vue3的支持写多个根元素
// 在模板编译阶段，会默认在最外层添加一个对象，若有多个根元素，都是最外层对象的content

function createRoot(children, loc) {
    return {
        type: NodeTypes.ROOT,
        children,
        loc
    }
}

// 将模板解析成ast树
export function baseParse(template) {
    // 标识节点信息（行、列、偏移量、位置）
    // 每解析一段就移除一部分，核心就是状态机

    // 创建编译的上下文，记录行列偏移量等信息
    const context = createParserContext(template);

    // 上下文的开始位置
    const start = getCursor(context);

    // 解析模板的儿子，传入context是因为context已经包含了所有的信息
    return createRoot(parseChildren(context), getSelection(context, start));
}
