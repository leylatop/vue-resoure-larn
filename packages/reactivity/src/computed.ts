
// 参数类型
// 1. callback，如果是一个函数，则这个函数是getter方法，且只有一个getter方法
// 2. options {} 如果是一个对象，则包含getter和setter方法

import { isFunction } from "@vue/shared/src";
import { effect, track, trigger } from "./effect";
import { TrackOperatorsTypes, TriggerOperatorsTypes } from "./operators";

class ComputedRefImpl {
    public _dirty = true;   // 默认取值时，不要用缓存
    public _value;  //两个值操作一个值，将值存储为
    public effect;
    constructor(getter, public setter) {    // ts中默认不会挂载到this上
        this.effect = effect(getter,  {//计算属性会默认产生一个effect，effect属性会默认执行，但是computed不需要默认执行，所以设置一个lazy属性
            lazy: true,     // 第一次默认不执行，所以使用lazy属性
            scheduler:() => {
                if(!this._dirty) {
                    this._dirty = true
                    // 更新value的时候触发trigger
                    trigger(this, TriggerOperatorsTypes.SET, 'value')
                }
            }
        })
    }

    get value() {
        // 当获取value的值的时候，会执行getter方法
        // myAge.age

        // 计算属性也要收集依赖（vue2中不需要收集依赖）
        // 计算属性本身就是一个effect
        // 1. 先去生成一个effect，new一个实例就会产生一个effect，所以要在构造器里面定义 
        // 2. 每次取值时执行effect
        // 3. 执行之前要判断是否有脏的数据的时候
        // 4. effect执行完毕（getter）后，会将effect的返回值返回
        // 5. 再次取值的时候，不需要重新执行effect，所以这里将dirty置成false，多次获取值，只会拿到第一次的执行结果
        if(this._dirty) {
            this._value = this.effect();
            this._dirty = false;
        }
        
        // 在effect中，访问value属性的时候进行依赖收集
        track(this, TrackOperatorsTypes.GET, 'value');
        return this._value
    }

    set value(newValue) {
        // 当更新value的时候会执行setter方法
        // myAge.age = 'xxx';
        this.setter(newValue);
        this._value = newValue
    }
}



// vue2和vue3的computed原理是不一样的
export function computed(getterOrOptions) {
    let getter;
    let setter;
    // 说明参数是一个函数
    if(isFunction(getterOrOptions)) {
        getter = getterOrOptions;
        setter = () => {
            // 值是只读的
            console.warn('computed value must be readonly');
        }
    } else {
        getter = getterOrOptions.get;
        setter = getterOrOptions.set;
    }

     // const myAge = computed(() => {  // 此方法默认不执行
    //     return age.value + 10
    // })
    return new ComputedRefImpl(getter, setter);
}