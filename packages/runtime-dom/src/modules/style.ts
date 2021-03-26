export const patchStyle = (el, prev, next) => {
    const style = el.style;     //获取元素的样式

    // 如果新的style为空的，则直接删掉元素中的syule属性
    if(next == null) {
        el.removeAttribute('style');
    } else {
        // 如果新的style和老的style，都存在
        if(prev) {
            // 老的里面有，新的里面没有
            // {style: {color: 'red'}}    {style: {background: 'red'}}
            // 则把现有元素上的color属性置空
            for(let key in prev) {
                if(next[key] == null) {
                    style[key] = '';
                }
            }
        }
        // 新的style里面的属性，需要赋到元素style上面
        for(let key in next) {
            style[key] = next[key]
        }
    }
}
