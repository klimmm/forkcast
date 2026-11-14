// A group qualifies if at least one of its moves cannot be made in any
// smaller feasible subset of that group. Several sales can fund the same buy.
export function transferGroups(moves, fits) {
  const supports = moves.map(() => []);
  const groups = [];
  const visit = (start, remaining, indices) => {
    if (remaining) {
      for (let i = start; i <= moves.length - remaining; i++) {
        visit(i + 1, remaining - 1, [...indices, i]);
      }
      return;
    }
    const needs = indices.filter(i => !supports[i].some(set => set.every(j => indices.includes(j))));
    if (!needs.length) return;
    const group = indices.map(i => moves[i]);
    if (!fits(group)) return;
    groups.push(group);
    for (const i of needs) supports[i].push(indices);
  };
  for (let size = 1; size <= moves.length; size++) {
    visit(0, size, []);
    if (supports.every(sets => sets.some(set => set.length === 1))) break;
  }
  return groups;
}
