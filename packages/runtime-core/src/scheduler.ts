let queue = [];

// 核心就是把effect所有要更新的方法放到一起，最后调一次
export function queueJob(job) {
    // 先去重，再执行
    // 如果队列中不存在当前的job，才往里丢
    // （这里也可以用set，但是源码用的是数组）
    if (!queue.includes(job)) {
        queue.push(job);
        // 刷新队列
        queueFlush();
    }
}

let isFlushPending = false;
function queueFlush() {
    // 开启自动刷新，默认不开启
    if (!isFlushPending) {
        isFlushPending = true;
        Promise.resolve().then(flashJobs);
    }
}

// 清空任务
function flashJobs() {
    isFlushPending = false;
    // 清空时，需要让queue做一个排序，排序根据id进行排序，然后按照顺序依次刷新
    // 比如说，多个组件更新，可能是先更新子组件，又更新父组件，又更新子组件
    // 更新时，从父到子
    // 父组件的effect会小一点
    queue.sort((a, b) =>{
        return a.id - b.id
    })

    for(let i = 0; i < queue.length; i++) {
        const job = queue[i];
        job();
    }

    // 清空队列
    queue.length = 0;
}
