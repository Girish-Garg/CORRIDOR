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
  opec: [
    { date: "Apr 08", brent: 80, score: 0.2 },
    { date: "Apr 10", brent: 84, score: 0.55, event: "OPEC+ emergency cut announced" },
    { date: "Apr 15", brent: 89, score: 0.66, event: "Cut tightens global balances" },
    { date: "Apr 22", brent: 93, score: 0.74, event: "Deeper quotas confirmed" },
  ],
}

export const SCORE_THRESHOLD = 0.5

const MONTHS: Record<string, number> = {
  Jan: 0, Feb: 1, Mar: 2, Apr: 3, May: 4, Jun: 5,
  Jul: 6, Aug: 7, Sep: 8, Oct: 9, Nov: 10, Dec: 11,
}

// Whole days between the score first crossing threshold and Brent peaking.
// Dates carry no year, so we bump the year whenever the month wraps backwards
// (the Red Sea series runs Dec into Jan), then diff the calendar dates.
export function leadTimeDays(data: ReplayPoint[]): number | null {
  if (data.length === 0) return null
  let offset = 0
  let prevMonth = MONTHS[data[0].date.split(" ")[0]]
  const dated = data.map((p) => {
    const [mon, day] = p.date.split(" ")
    const m = MONTHS[mon]
    if (m < prevMonth) offset += 1
    prevMonth = m
    return { ...p, at: new Date(2026 + offset, m, parseInt(day, 10)) }
  })
  const signal = dated.find((p) => p.score >= SCORE_THRESHOLD)
  if (!signal) return null
  const peak = dated.reduce((a, b) => (b.brent > a.brent ? b : a), dated[0])
  return Math.round((peak.at.getTime() - signal.at.getTime()) / 86400000)
}
