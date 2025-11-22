// src/utils/pdf.ts
import jsPDF from 'jspdf'
import autoTable, { RowInput } from 'jspdf-autotable'

export type LedgerRow = {
  date: string                      // ISO yyyy-mm-dd
  type: 'Cr' | 'Dr'
  particulars: string
  instrument?: string
  instNo?: string | null
  debit: number
  credit: number
  balance: number
  source?: 'auto' | 'manual'
}

type Totals = { opening: number; credits: number; debits: number; closing: number }
type ExportOpts = { societyName?: string; addressLine?: string; logoDataUrl?: string }

// Helpers to satisfy TS across jsPDF versions
const pageW = (doc: any) =>
  (doc.internal?.pageSize?.getWidth?.() ?? doc.internal?.pageSize?.width ?? 842) as number
const pageH = (doc: any) =>
  (doc.internal?.pageSize?.getHeight?.() ?? doc.internal?.pageSize?.height ?? 595) as number

const INR = new Intl.NumberFormat('en-IN')

function money(n: number) {
  return n ? `₹${INR.format(n)}` : '—'
}
function toHumanDate(iso: string) {
  try { return new Date(iso).toLocaleDateString() } catch { return iso }
}

/**
 * Exports a month ledger as a nicely formatted landscape A4 PDF.
 * - rows must already include running balance
 * - totals appear in the header summary
 */
export function exportLedgerPdf(
  monthId: string,
  rows: LedgerRow[],
  totals: Totals,
  opts?: ExportOpts
) {
  const doc = new jsPDF({ unit: 'pt', format: 'a4', orientation: 'landscape' })
  const marginL = 36
  const marginT = 40

  // Header
  let y = marginT
  if (opts?.logoDataUrl) {
    try {
      const w = pageW(doc)
      doc.addImage(opts.logoDataUrl, 'PNG', w - 140, y - 8, 100, 28)
    } catch { /* ignore image errors */ }
  }
  doc.setFont('helvetica', 'bold'); doc.setFontSize(14)
  doc.text(opts?.societyName || 'Urmila Kunj Welfare Society', marginL, y)

  doc.setFont('helvetica', 'normal'); doc.setFontSize(10)
  if (opts?.addressLine) { y += 14; doc.text(opts.addressLine, marginL, y) }

  y += 20
  doc.setFont('helvetica', 'bold'); doc.setFontSize(12)
  doc.text(`Ledger — ${monthId}`, marginL, y)

  // Summary line
  y += 14
  doc.setFont('helvetica', 'normal'); doc.setFontSize(10)
  const sum = [
    `Opening: ${money(totals.opening)}`,
    `Credits: ${money(totals.credits)}`,
    `Debits: ${money(totals.debits)}`,
    `Closing: ${money(totals.closing)}`
  ].join('   ')
  doc.text(sum, marginL, y)

  // Build table
  const head = [[
    'Date', 'Type', 'Particulars', 'Instrument', 'Inst. No',
    'Debit (₹)', 'Credit (₹)', 'Balance (₹)'
  ]]

  const body: RowInput[] = rows.map(r => [
    toHumanDate(r.date),
    r.type,
    r.particulars + (r.source === 'manual' ? ' (Manual)' : ''),
    r.instrument || '—',
    r.instNo || '—',
    money(r.debit),
    money(r.credit),
    money(r.balance),
  ])

  autoTable(doc, {
    startY: y + 8,
    head,
    body,
    theme: 'grid',
    styles: { fontSize: 9, cellPadding: 4, valign: 'middle', overflow: 'linebreak' },
    headStyles: { fillColor: [79, 70, 229], textColor: 255, halign: 'center' }, // indigo header
    alternateRowStyles: { fillColor: [248, 249, 251] },
    columnStyles: {
      0: { cellWidth: 70 },                 // Date
      1: { cellWidth: 32, halign: 'center' }, // Type
      2: { cellWidth: 320 },                // Particulars (wrap)
      3: { cellWidth: 90 },                 // Instrument
      4: { cellWidth: 90 },                 // Inst. No
      5: { cellWidth: 90, halign: 'right' },   // Debit
      6: { cellWidth: 90, halign: 'right' },   // Credit
      7: { cellWidth: 100, halign: 'right' },  // Balance
    },
    didParseCell: (ctx) => {
      // Keep monetary columns right-aligned & as-is (already formatted)
      if (ctx.section === 'body' && [5, 6, 7].includes(ctx.column.index)) {
        ctx.cell.styles.halign = 'right'
      }
    },
    didDrawPage: (data) => {
      // Footer (typed API)
      const page = doc.getNumberOfPages()
      doc.setFontSize(9); doc.setTextColor(120)
      doc.text(`Page ${page}`, data.settings.margin.left, pageH(doc) - 12)

      // Title on subsequent pages
      if (page > 1) {
        doc.setFont('helvetica', 'bold'); doc.setTextColor(0)
        doc.text(`Ledger — ${monthId}`, marginL, 22)
      }
    },
    margin: { left: marginL, right: marginL, top: marginT, bottom: 24 },
  })

  doc.save(`ledger-${monthId}.pdf`)
}