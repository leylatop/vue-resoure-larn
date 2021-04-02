import { hasChanged, isArray, isObject } from "@vue/shared/src";
import { track, trigger } from "./effect";
import { TrackOperatorsTypes, TriggerOperatorsTypes } from "./operators";
import { reactive } from "./reactive";

// beta版本，之前的版本ref就是一个对象，由于对象扩展不方便，改成了类
export function ref(value) {    //value是一个基本数据类型的数据
    // 将普通类型变成一个对象
    // 可以是对象，一般情况下如果是对象，直接使用reactive
    return createRef(value)
}

export function shallowRef(value) {
    return createRef(value)
}

// 如果是对象，则使用reactive包装一下
const convert = (val) => isObject(val) ? reactive(val):val;

class RefImpl {
    // public：使用public声明一下，就默认绑到当前的this上
    public _value;  // 声明了，没赋值
    public __v_is_Ref = true;   // 表示产生的实例会被添加 __v_is_Ref属性，__v_is_Ref表示当前是一个ref属性
    constructor(public rowValue, public shallow) {  // 参数前面加上修饰符，表示此属性放在了实例上（既声明又赋值）
        this._value = shallow ? rowValue : convert(rowValue);   // 判断是不是深度代理，如果是深度代理，则需要将里面的都变成响应式的（前提是value值为对象）
    }

    // 类的属性转化器，转化成es5会编译成Object.defineProptery
    get value() {   // 代理操作：取值取velue，会代理到_velue上
        track(this, TrackOperatorsTypes.GET, 'value');
        return this._value
    }

    set value(newValue) {
        if (hasChanged(this.rowValue, newValue)) {  //判断老值和新值是否有变化
            this.rowValue = newValue;   // 将新值替换成老值
            this._value = this.shallow ? newValue : convert(newValue);
            trigger(this, TriggerOperatorsTypes.SET, 'value', newValue);
        }
    }
}


function createRef(rowValue, shallow=false) {
    return new RefImpl(rowValue, shallow)
}


// 这个不需要响应式因为对象本身就是响应式的
class ObjectRefImpl{
    public __v_is_Ref = true;   // 表示产生的实例会被添加 __v_is_Ref属性，__v_is_Ref表示当前是一个ref属性

    constructor(public target, public key) {

    }
    get value() {
        // 调用get方法，会触发响应式target的get方法，进而触发track收集依赖
        return this.target[this.key]
    }

    set value(newValue) {
        // 调用set方法，会触发响应式target的set方法，进而触发trigger收集依赖
        if (hasChanged(this.target[this.key], newValue)) {
            this.target[this.key] = newValue;
        }
    }
}
// 可以把对象的值转化成ref
// 传入的参数，target对象必须是reactive代理过的响应式
export function toRef(target, key) {
    return new ObjectRefImpl(target, key)
}

// 传入的参数，object对象必须是reactive代理过的响应式
export function toRefs(object) {
    // 如果target是数组，就创建一个相同长度的空数组；如果target是对象，就创建一个空对象
    let ret = isArray(object) ? new Array(object.length): {};

    // 原理就是循环调用toRef，传入到一个新的对象中（for...in可以遍历对象也可以遍历数组）
    for(let key in object) {
        ret[key] = toRef(object, key);
    }

    return ret
}