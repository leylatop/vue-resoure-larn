export const enum PatchFlags {  // 位运算方便组合
    TEXT = 1,                       // 文本是动态的
    CLASS = 1 << 1,                 // class是动态的
    STYLE = 1 << 2,                 // style是动态的
    PROPS = 1 << 3,                 // props是动态的
    FULL_PROPS = 1 << 4,            // 全量diff
    HYDRATE_EVENTS = 1 << 5,        // 事件更新
    STABLE_FRAGMENT = 1 << 6,       // 子节点是稳定的，不会改的
    KEYED_FRAGMENT = 1 << 7,        // 带key的fragment
    UNKEYED_FRAGMENT = 1 << 8,      // 不带key的fragment
    NEED_PATCH = 1 << 9,            // 需要patch （ref、onVNodexxx hooks）
    DYNAMIC_SLOTS = 1 << 10,        // 动态插槽
    DEV_ROOT_FRAGMENT = 1 << 11,    // 开发环境的根fragment
    HOISTED = -1,                   // 纯静态节点   
    BAIL = -2                       // 不需要patch，不做任何优化，不使用动态节点diff的方法
  }
  
  /**
   * dev only flag -> name mapping
   */
  export const PatchFlagNames = {
    [PatchFlags.TEXT]: `TEXT`,
    [PatchFlags.CLASS]: `CLASS`,
    [PatchFlags.STYLE]: `STYLE`,
    [PatchFlags.PROPS]: `PROPS`,
    [PatchFlags.FULL_PROPS]: `FULL_PROPS`,
    [PatchFlags.HYDRATE_EVENTS]: `HYDRATE_EVENTS`,
    [PatchFlags.STABLE_FRAGMENT]: `STABLE_FRAGMENT`,
    [PatchFlags.KEYED_FRAGMENT]: `KEYED_FRAGMENT`,
    [PatchFlags.UNKEYED_FRAGMENT]: `UNKEYED_FRAGMENT`,
    [PatchFlags.NEED_PATCH]: `NEED_PATCH`,
    [PatchFlags.DYNAMIC_SLOTS]: `DYNAMIC_SLOTS`,
    [PatchFlags.DEV_ROOT_FRAGMENT]: `DEV_ROOT_FRAGMENT`,
    [PatchFlags.HOISTED]: `HOISTED`,
    [PatchFlags.BAIL]: `BAIL`
  }
  