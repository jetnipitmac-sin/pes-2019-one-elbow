// Every number on screen comes from src/data/pes.json, written by tools/build_data.py
// from the same results.json and CSVs the report uses (05_Data_and_Code).
import D from '../data/pes.json'

export const C = D.corrosion
export const REL = D.release
export const Z = D.zones
export const M = D.money
export const EIA = D.eia
export const CMP = D.cmp

// ---------------------------------------------------------------- formatting
export const fmt = (v, d = 0) =>
  v.toLocaleString('en-US', { minimumFractionDigits: d, maximumFractionDigits: d })
export const IN_TO_MM = 25.4

// ---------------------------------------------------------------- physics of the wall
/** Elbow wall thickness in a given year at the constant average rate (CSB measured 0.011 in at failure). */
export const elbowT = (yr) => Math.max(C.tmin, C.t0 - C.rate_in_yr * (yr - C.install))
/** Adjacent pipe at the middle of CSB's 0.29–0.31 in range. */
const ADJ_2019 = (C.adj[0] + C.adj[1]) / 2
export const adjT = (yr) => C.t0 - ((C.t0 - ADJ_2019) / (C.fail - C.install)) * (yr - C.install)

export const annuity = (r, n) => (1 - (1 + r) ** -n) / r
