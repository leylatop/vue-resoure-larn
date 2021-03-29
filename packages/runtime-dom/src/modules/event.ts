// vue2、vue3采用的是addEventListener
// react事件采用的是代理


// 1. 给元素缓存一个绑定事件的列表
// 2. 如果缓存中没有缓存过，而且value有值，则需要绑定方法，并缓存起来
// 3. 如果缓存中有已经缓存的值，而且value有值，则直接改变缓存中value属性指向最新的事件
// 4. 如果缓存中有已经缓存的值，但是value值为空，则需要缓存，并将缓存情况
export const patchEvent = (el, key, value) => {
    // 对函数进行缓存，在el上面进行缓存，为el添加一个属性，缓存函数

    // 1. 获取被缓存的函数（元素上所有的调用）
    // involkers是一个对象
    const involkers = el._vei || (el._vei = {})

    // 2. 判断key值（方法）是否存在（是否被绑定过）
    const exists = involkers[key];
    // 3. 获取key的名字 比如onClick，获取之后，是click
    const eventName = key.slice(2).toLowerCase();


    // 4. 如果之前存在
    if(exists) {
        // 如果之前存在，现在也存在
        if(value) {
            exists.value = value
        }
        // 如果之前存在，现在不存在（删除掉）
        else {
            el.removeEventListener(eventName, exists);
            involkers[key] = undefined;
        }
    } 
    // 5. 如果之前不存在
    else {
        // !!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!
        // 如果之前不存在，现在存在（第一次会默认走这里）
        // !!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!
        if(value) {
            let invoker = involkers[key] = createInvoker(value);
            el.addEventListener(eventName, invoker)
        }
    }

    // 替换
    // 1. 最快的是removeEventListener，再addEventListener
    // 2. 重新addEventListener事件不会被覆盖，会执行新老方法
    // 3. 最优：绑定的时候，绑定一个匿名函数，匿名函数内部调用fn或fn1
}

function createInvoker(value) {
    const invoker = (e)=>{
        invoker.value(e);
    }
    invoker.value = value;  // 为了能随时更改value属性
    // return 一个匿名函数，函数拥有value属性，属性
    return invoker;
}
