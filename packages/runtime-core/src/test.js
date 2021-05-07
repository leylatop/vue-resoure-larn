// const arr = [1, 8, 5, 3, 4, 9, 7, 6, 0];
const arr = [2, 3, 1, 5, 6, 8, 7, 9, 4];
// const arr = [1, 2, 3, 4, 5, 0];

// 求当前列表中最大递增个数，看潜力
// 1, 3, 4, 7
// 最长递增的子序列
// 先求个数
// 动态规划

function getSequence(arr) {
    // 1. 先拿到要求最长递增子序列的序列的总个数
    const len = arr.length;
    // 2. 最终的结果是最长递增子序列的索引，默认放入0，是拿当前序列索引为0的位置的值作为参照物进行后续比对
    const result = [0];

    // 二分查找的start，end， middle
    let start, end;
    for (let i = 0; i < len; i++) {
        // 3. 拿到当前数
        const arrI = arr[i];
        // 4. 当前数若为0，则表示当前项为新增的一项
        // 新增的一项不需要进行移位和排序操作，直接插入就可以，所以将0的情况排除在外
        if (arrI !== 0) {
            // 5. 拿已经排好的列表中的最后一项，拿到的最后一项是arr中的索引值
            const resultLastIndex = result[result.length - 1];
            // 6. 取到result最后一项的值，作为arr的索引，找到值索引对应的arr中的值；与当前值进行对比；若当前值更大，则直接将当前值的索引push到result中
            // *********************result中存储的是最长递增子序列的索引**************************
            if (arr[resultLastIndex] < arrI) {
                result.push(i);
                continue;
            }


            // 7. 二分查找，找已经排好的列表中比当前值大的那一项
            // 二分查找是，查找result的索引，找到对应的值，值的内容是arr的索引，然后根据arr的索引找到arr对应的值
            // ************** start end middle 是result的索引*************
            start = 0;
            end = result.length - 1;
            while (start < end) {
                // 7.1 向下取整，找中间位置的前一个
                middle = ((start + end) / 2) | 0;
                // 7.2 
                // 找到的中间位置的前一个的值为result的索引
                // 根据result的索引，获取到result的值
                // result中存储的值为arr的索引
                // 根据arr的索引找到索引对应的arr中的值
                // 拿索引对应的arr的值与当前值进行对比

                // 7.2.1 若当前值较大，则从中间值向后查找，更新start的值为middle的下一个位置
                if (arr[result[middle]] < arrI) {
                    start = middle + 1;
                }
                // 7.2.2 若当前值较小，则从中间值向前查找，更新end的值为middle值
                else {
                    end = middle;
                }
                // 7.2.3 进行下一轮二分查找
            }
            // 开始和结尾相等， 说明找到了，结束二分查找
            // start/end就是找到的位置，此时start和end是相同的，此时需要将当前值的索引替换start/end索引对应的值
            if (arrI < arr[result[start]]) { //如果两个值相同，或者比当前值还小，就不进行替换了（以防外一）
                result[start] = i;
            }
        }

    }
    return result

}
console.log(getSequence(arr));

// vue3：贪心+二分查找
// 求最长递增子序列的个数
// 1. 在查找过程中，如果当前的比最后一个大，则直接插入到列表的最末尾
// 2. 如果当前的比最后一个小，则使用二分查找的方式在已经排好的列表找到比当前数值大的那一项，将其替换掉
// 3. 默认每次放入的时候，我都知道，最小的结尾是谁

// 1, 8, 5, 3, 4, 9, 7, 6, 0
// 1
// 1, 8
// 1, 5
// 1, 3
// 1, 3, 4
// 1, 3, 4, 9
// 1, 3, 4, 7
// 1, 3, 4, 6
// 1, 2, 4, 7



