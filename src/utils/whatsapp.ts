/** Default dues message */
export function buildDuesMessage(opts: {
  societyName?: string
  monthId: string
  amount: number
  dueDate: string
  upi?: string
  note?: string
}) {
  const { societyName='Urmila Kunj Welfare Society', monthId, amount, dueDate, upi, note } = opts
  const lines = [
    `*${societyName}*`,
    `Maintenance for *${monthId}*`,
    `Amount: ₹${amount.toLocaleString('en-IN')}`,
    `Due date: ${dueDate}`,
    upi ? `UPI: ${upi}` : '',
    note ? note : '',
    `— Thank you`
  ].filter(Boolean)
  return lines.join('\n')
}

// Append these to your existing utils/whatsapp.ts or create the file if you don't have one yet.

export function buildNoticeMessage(opts: {
  societyName?: string
  title: string
  body: string
}) {
  const { societyName = 'Urmila Kunj Welfare Society', title, body } = opts
  const lines = [
    `*${societyName}*`,
    `*${title}*`,
    body
  ].filter(Boolean)
  return lines.join('\n\n')
}

/**
 * Opens WhatsApp with a prefilled message and lets user choose recipient (person or group).
 * - Desktop → WhatsApp Web
 * - Mobile  → WhatsApp app
 */
export function openWhatsAppShare(text: string) {
  const msg = encodeURIComponent(text)
  const isMobile = typeof navigator !== 'undefined' && /Android|iPhone|iPad|iPod/i.test(navigator.userAgent)
  const url = isMobile ? `whatsapp://send?text=${msg}` : `https://wa.me/?text=${msg}`
  window.open(url, '_blank')
}

export function normalizePhoneForWa(raw?: string) {
  if (!raw) return ''
  const digits = raw.replace(/\D/g, '')
  if (/^\d{10}$/.test(digits)) return `91${digits}` // default to +91
  if (/^0\d{10,11}$/.test(digits)) return digits.slice(1)
  return digits
}

export function waLink(phone: string, text: string) {
  const to = normalizePhoneForWa(phone)
  const msg = encodeURIComponent(text)
  return to ? `https://wa.me/${to}?text=${msg}` : `https://wa.me/?text=${msg}`
}

export function buildDueReminderMessage(opts: {
  societyName?: string
  monthId: string
  amount: number
  dueDate?: string
  flatNo: string
  residentName?: string
  upi?: string
  note?: string
}) {
  const {
    societyName = 'Urmila Kunj Welfare Society',
    monthId,
    amount,
    dueDate,
    flatNo,
    residentName,
    upi,
    note,
  } = opts
  const lines = [
    `*${societyName}*`,
    `Maintenance due reminder for *${monthId}*`,
    residentName ? `Dear ${residentName},` : undefined,
    `Flat: ${flatNo}`,
    `Amount: ₹${amount.toLocaleString('en-IN')}`,
    dueDate ? `Due date: ${dueDate}` : undefined,
    upi ? `UPI: ${upi}` : undefined,
    note ?? 'Kindly complete the payment at the earliest and reply with the reference.',
    '— Thanks',
  ].filter(Boolean)
  return lines.join('\n')
}