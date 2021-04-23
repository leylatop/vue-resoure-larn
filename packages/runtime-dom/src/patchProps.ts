import { patchEvent } from './modules/event';
import { patchStyle } from './modules/style';
import { patchClass } from './modules/class';
import { patchAttr } from './modules/attr';


// 这里针对的是属性操作，一系列的属性操作

// preValue 和 nextValue用于对比同一个element的前后的属性的值
// key指的是属性的名称(class、style、attr、event)
export const patchProp = (el, key, preValue, nextValue) => {
    switch (key) {
        case 'class':
            patchClass(el, nextValue);
            break;
        case 'style':
            patchStyle(el, preValue, nextValue);
            break;
        default:
            // 根据key的值来判断是属性还是事件
            // 属性没什么特征，但是事件必须是以on开头的，所以我们使用正则来判断key是不是一个event
            if (/^on[A-Z]/.test(key)) {
                // 添加、删除、修改
                patchEvent(el, key, nextValue);
            } else {
                patchAttr(el, key, nextValue);
            }

            break
    }
}