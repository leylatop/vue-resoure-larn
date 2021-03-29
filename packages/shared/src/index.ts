// 判断是否是对象
export const isObject = (value) => typeof value === 'object' && value !== null;

// 合并对象使用
export const extend = Object.assign;

export const isArray = (value) => Array.isArray(value);

export const isFunction = (value) => typeof value === 'function';

export const isNumber = (value) => typeof value === 'number';

export const isString = (value) => typeof value === 'string';

// 是不是整形key
export const isIntegerKey = (key) => parseInt(key) + '' === key;

// 判断当前对象中是否含有某个属性
let hasOwnProperty = Object.prototype.hasOwnProperty;
export const hasOwn = (target, key) => hasOwnProperty.call(target, key)

// 判断两个值是否一致
export const hasChanged = (oldValue, value) => oldValue !== value; 

export const objectToString = Object.prototype.toString;

// 获取数据类型 
export const toTypeString = (value) => objectToString.call(value);

// 获取value数据类型
export const toRawType = (value) => toTypeString(value).slice(8, -1);

// 判断类型
export * from './shapeFlags';
