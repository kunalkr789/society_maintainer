export function computeBalance(dues: any[], payments: Record<string, any[]>, expenses: any[]) {
  const income = dues.reduce((sum:number, m:any) => {
    const pays = payments[m.id] ?? []
    const verifiedCount = pays.filter((p:any)=>p.verified).length
    return sum + verifiedCount * m.amount
  }, 0)
  const exp = (expenses ?? []).reduce((s:number,e:any)=>s+Number(e.amount||0),0)
  return { income, expenses: exp, balance: income - exp }
}
