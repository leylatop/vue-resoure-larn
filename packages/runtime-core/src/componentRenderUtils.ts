function shouldUpdateComponent (prevVNode, nextVNode, optimized) {
    const {props: prevProps, children: prevChildren, compontnt} = prevVNode;
    // patchFlag 是否对更新有优化
    const {props: nextProps, children: nextChildren, patchFlag} = prevVNode;
    
}