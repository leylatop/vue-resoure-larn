export const enum ShapeFlags {
    ELEMENT = 1,                        // 1    00000001
    FUNCTIONAL_COMPONENT = 1 << 1,      // 2    00000010        函数组件
    STATEFUL_COMPONENT = 1 << 2,        // 4    00000100        有状态组件
    TEXT_CHILDREN = 1 << 3,             // 8    00001000
    ARRAY_CHILDREN = 1 << 4,            // 16   00010000
    SLOTS_CHILDREN = 1 << 5,            // 32   00100000
    TELEPORT = 1 << 6,                  // 64   01000000
    SUSPENSE = 1 << 7,                  // 128  10000000
    COMPONENT_SHOULD_KEEP_ALIVE = 1 << 8,   // 256  100000000
    COMPONENT_KEPT_ALIVE = 1 << 9,          // 512  1000000000
    COMPONENT = ShapeFlags.STATEFUL_COMPONENT | ShapeFlags.FUNCTIONAL_COMPONENT     // 或运算    4|2   00000110
}

// 二进制移位
// 二进制：一个字节由8个位组成，8个位只能放0和1，最大值为都是1
// 用位运算来做标识位
// 或运算
// STATEFUL_COMPONENT = 1 << 2,        // 4    00000100
// FUNCTIONAL_COMPONENT = 1 << 1,      // 2    00000010
// 结果：有1个位置为1，两者相同的位置都为1，结果是 00000110


// 判断是不是组件，用与运算
// 00000010 & 00000110   =>  00000100
// 00001000 & 00000110   =>  00000000

// 结果：2个相同位置都是1，则才为1
// 只要结果不是0，就是true

// 位运算，是以前人总结出来的，做权限判断和类型判断，位运算是最佳实践
// vue3中用位运算来判断数据类型




