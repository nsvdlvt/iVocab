export function stableSort<T>(
  arr: T[],
  compare: (a: T, b: T) => number
): T[] {
  return arr
    .map((item, index) => ({ item, index }))
    .sort((a, b) => {
      const res = compare(a.item, b.item);
      if (res !== 0) return res;
      return a.index - b.index;
    })
    .map((x) => x.item);
}
