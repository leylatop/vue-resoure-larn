// 创造一个公共实例的代理函数

import { hasOwn } from "@vue/shared/src";

export const PublicInstanceProxyHandlers = {
    get(target, key) {
        let instance = target._;
        // 取值时，可能会访问setupState， props， data上面的值
        const {setupState, props, data} = instance;
        // 不能访问$开头的变量（内置变量）
        if(key[0] == '$') {
            return
        }
        if(hasOwn(setupState, key)) {
            return setupState[key]
        } else if(hasOwn(props, key)) {
            return props[key]
        } else if (hasOwn(data, key)) {
            return data[key]
        } 
    },
    set(target, key, value) {
        let instance = target._;
        // 设置值时，可能会访问setupState， props， data上面的值
        const {setupState, props, data} = instance;
        if(hasOwn(setupState, key)) {
            setupState[key] = value;
        } else if(hasOwn(props, key)) {
            props[key] = value;
        } else if (hasOwn(data, key)) {
            data[key] = value;
        }
        return true;
    }
}