// 判断是否是对象
export const isObject = (value) => typeof value === 'object' && value !== null;

// 合并对象使用
export const extend = Object.assign;