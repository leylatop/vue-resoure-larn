import { patchEvent } from './modules/events';
import { patchStyle } from './modules/style';
import { patchClass } from './modules/class';
import { patchAttr } from './modules/attr';


// 这里针对的是属性操作，一系列的属性操作

// preValue 和 nextValue用于对比同一个element的前后的属性的值
// key指的是属性的名称(class、style、attr、event)
export const patchProps = (el, key, preValue, nextValue) => {
    switch (key) {
        case 'class':
            patchClass(el, nextValue);
            break;
        case 'style':
        default:
            break
    }
}