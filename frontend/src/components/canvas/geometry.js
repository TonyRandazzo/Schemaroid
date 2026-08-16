export function nodeRect(node) {
  const w = node.width ?? node.style?.width ?? 0;
  const h = node.height ?? node.style?.height ?? 0;
  return {
    x1: node.position.x,
    y1: node.position.y,
    x2: node.position.x + w,
    y2: node.position.y + h,
  };
}

export function contains(outer, inner) {
  return inner.x1 >= outer.x1
    && inner.y1 >= outer.y1
    && inner.x2 <= outer.x2
    && inner.y2 <= outer.y2;
}

export function commentBoxFor(rects, { padding, headerHeight, min }) {
  const x1 = Math.min(...rects.map(r => r.x1));
  const y1 = Math.min(...rects.map(r => r.y1));
  const x2 = Math.max(...rects.map(r => r.x2));
  const y2 = Math.max(...rects.map(r => r.y2));

  return {
    x: x1 - padding,
    y: y1 - padding - headerHeight,
    width: Math.max(min.w, x2 - x1 + padding * 2),
    height: Math.max(min.h, y2 - y1 + padding * 2 + headerHeight),
  };
}
