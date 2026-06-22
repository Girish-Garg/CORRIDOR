export type ReplayPoint = { date: string; brent: number; score: number; event?: string }

// Dated series per scenario for the historical replay. The disruption score
// crosses threshold on the signal date, before Brent peaks, which is the
// lead-time story.
export const REPLAY: Record<string, ReplayPoint[]> = {
  hormuz: [
    { date: "Feb 26", brent: 77, score: 0.15 },
    { date: "Feb 28", brent: 79, score: 0.5, event: "US-Israeli airstrikes on Iran" },
    { date: "Mar 01", brent: 82, score: 0.62, event: "Iran threatens Hormuz" },
    { date: "Mar 03", brent: 90, score: 0.72, event: "Brent jumps on closure fears" },
    { date: "Mar 05", brent: 98, score: 0.9, event: "Hormuz transit halted" },
    { date: "Mar 09", brent: 96, score: 0.86 },
  ],
  redsea: [
    { date: "Dec 12", brent: 74, score: 0.12 },
    { date: "Dec 15", brent: 76, score: 0.5, event: "Houthi attacks intensify" },
    { date: "Dec 22", brent: 79, score: 0.62, event: "Bab-el-Mandeb risk rises" },
    { date: "Jan 08", brent: 84, score: 0.76, event: "Suez transits fall" },
  ],
  russia: [
    { date: "Jan 15", brent: 76, score: 0.2 },
    { date: "Jan 18", brent: 78, score: 0.55, event: "Shadow-fleet sanctions" },
    { date: "Feb 02", brent: 80, score: 0.66, event: "Urals discount narrows" },
    { date: "Feb 12", brent: 83, score: 0.74, event: "Secondary sanctions threat" },
  ],
}
