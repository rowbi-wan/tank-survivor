/** Scrap awarded at end of a run (shared by run summary + meta persist). */
export function scrapForRun(timeSec: number, kills: number): number {
  return Math.floor(timeSec * 0.35) + Math.floor(kills * 0.5);
}
