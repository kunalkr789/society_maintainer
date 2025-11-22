import { db as fs } from '@/firebase'
import { doc, getDoc, collection, getDocs } from 'firebase/firestore'

type Payment = { paid?: boolean; verified?: boolean; amount?: number; flatNo?: string }
type Expense = { amount?: number }
type Manual = { type: 'Cr'|'Dr'; amount: number }

export type UnifiedTotals = {
  opening: number
  verifiedIncome: number
  manualCredits: number
  manualDebits: number
  expenses: number
  balance: number
}

export async function computeUnifiedBalance(
  db: {
    dues: Array<{ id: string; amount: number }>
    payments: Record<string, Payment[]>
    expenses: Expense[]
  }
): Promise<UnifiedTotals> {
  // 1) Opening = openingBalances[earliestMonth] (if set)
  const earliestMonth = db.dues.length ? db.dues[db.dues.length - 1].id : ''
  let opening = 0
  try {
    const snap = await getDoc(doc(fs, 'settings', 'finance'))
    if (snap.exists()) {
      const ob = (snap.data() as any)?.openingBalances?.[earliestMonth]
      opening = Number(ob) || 0
    }
  } catch { /* noop */ }

  // 2) Verified income across all months (fall back to dues.amount when payment.amount missing)
  let verifiedIncome = 0
  for (const m of db.dues) {
    const arr = db.payments[m.id] ?? []
    for (const p of arr) {
      if (p.paid && p.verified) {
        verifiedIncome += Number(p.amount ?? m.amount ?? 0)
      }
    }
  }

  // 3) Expenses (all)
  const expenses = (db.expenses ?? []).reduce((s, e) => s + Number(e.amount ?? 0), 0)

  // 4) Manual entries (all months)
  let manualCredits = 0, manualDebits = 0
  for (const m of db.dues) {
    const col = collection(fs, 'ledger', m.id, 'entries')
    try {
      const snap = await getDocs(col)
      snap.forEach(d => {
        const x = d.data() as Manual
        const amt = Number(x.amount || 0)
        if (x.type === 'Cr') manualCredits += amt
        else manualDebits += amt
      })
    } catch { /* ignore missing collection */ }
  }

  // 5) Balance
  const balance = opening + verifiedIncome + manualCredits - expenses - manualDebits

  return { opening, verifiedIncome, manualCredits, manualDebits, expenses, balance }
}