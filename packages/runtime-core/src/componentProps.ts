// 更新组件的props
export function updateProps (instance, rawProps, rawPrevProps, optimized=false)  {
    // 这里有一个diff算法 省略没写
    instance.props = rawProps;
}