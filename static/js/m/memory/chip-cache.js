// Completed chip preparations on this device. Keys include the forecast/solver version and exact solve inputs.
// Store roads, not displayed gains: the comparison is recomputed against the current plan and lineup.
export const CHIP_ROADS = (entry) => `fc:mem:chips:${entry}`;
const MAX_ROADS = 96, MAX_CHARS = 500000;

export function chipRoads(local, entry) {
  const saved = local?.json(CHIP_ROADS(entry));
  return saved?.schema === 1 && Array.isArray(saved.roads)
    ? saved.roads.filter((x) => typeof x?.key === 'string' && Array.isArray(x.road?.weeks) && x.road.weeks.length).slice(0, MAX_ROADS) : [];
}

export function keepChipRoad(local, entry, key, road) {
  if (!local || !road?.weeks?.length) return;
  const roads = [{ key, road }, ...chipRoads(local, entry).filter((x) => x.key !== key)].slice(0, MAX_ROADS);
  // Leave room for plan memory and the offline snapshot; retry with fewer roads if browser storage is full.
  while (roads.length) {
    const saved = JSON.stringify({ schema: 1, roads });
    if (saved.length <= MAX_CHARS && local.set(CHIP_ROADS(entry), saved)) return;
    roads.pop();
  }
}
