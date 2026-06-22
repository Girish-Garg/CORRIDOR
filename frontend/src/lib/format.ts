export const fmtInt = (n: number) => Math.round(n).toLocaleString("en-US")

export const fmtBillions = (n: number) => `$${(n / 1e9).toFixed(2)}B`

export const fmtMbbl = (n: number) => `${(n / 1e6).toFixed(2)}M`

export const fmtUsd1 = (n: number) => `$${n.toFixed(1)}`

export const fmtPct = (n: number) => `${Math.round(n * 100)}%`

export const fmtDays = (n: number) => (n === Infinity ? "infinite" : n.toFixed(1))

export const fmtInr1 = (n: number) => `₹${n.toFixed(1)}`

export const fmtPct2 = (n: number) => `${n.toFixed(2)}%`

export const fmtMbblShort = (n: number) => `${(n / 1e6).toFixed(2)}M`
