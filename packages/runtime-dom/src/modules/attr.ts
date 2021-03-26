export const patchAttr = (el, key, value) => {
    // 如果新的属性值为空，则直接删除该属性，不然就设置属性值
    if(value == null) {
        el.removeAttribute(key);
    } else {
        el.setAttribute(key, value)
    }
}