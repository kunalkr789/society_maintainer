export const fmt = (iso?: string) =>
  iso ? new Date(iso).toLocaleDateString() : ''
export const fmtDT = (iso?: string) =>
  iso ? new Date(iso).toLocaleString() : ''
export const monthIdOf = (d = new Date()) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
