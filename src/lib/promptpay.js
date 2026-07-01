// สร้าง PromptPay QR payload (มาตรฐาน EMVCo ของธนาคารแห่งประเทศไทย)
// ใส่ยอดเงินลงไป = ล็อคยอด (แอปธนาคารจะเติมยอดให้อัตโนมัติ แก้ไม่ได้ง่ายๆ)

const f = (id, value) => id + String(value.length).padStart(2, '0') + value

function crc16(data) {
  let crc = 0xffff
  for (let i = 0; i < data.length; i++) {
    crc ^= data.charCodeAt(i) << 8
    for (let j = 0; j < 8; j++) {
      crc = crc & 0x8000 ? (crc << 1) ^ 0x1021 : crc << 1
      crc &= 0xffff
    }
  }
  return crc.toString(16).toUpperCase().padStart(4, '0')
}

const sanitize = (id) => (id || '').replace(/[^0-9]/g, '')

function formatTarget(id) {
  const n = sanitize(id)
  if (n.length >= 15) return n // e-wallet
  const clean = n.replace(/^0/, '66') // 08x... -> 668x...
  return ('0000000000000' + clean).slice(-13)
}

// target = เบอร์มือถือ (10 หลัก) หรือ เลขบัตร ปชช./ผู้เสียภาษี (13 หลัก) | amount = บาท
export function promptpayPayload(target, amount) {
  const n = sanitize(target)
  if (!n) return ''
  const subId = n.length >= 15 ? '03' : n.length >= 13 ? '02' : '01' // ewallet / taxid / mobile
  const merchant = f('00', 'A000000677010111') + f(subId, formatTarget(target))
  const parts = [
    f('00', '01'),
    f('01', amount ? '12' : '11'),
    f('29', merchant),
    f('53', '764'),
  ]
  if (amount) parts.push(f('54', Number(amount).toFixed(2)))
  parts.push(f('58', 'TH'))
  const data = parts.join('') + '6304'
  return data + crc16(data)
}

// URL รูป QR (เรนเดอร์ payload ด้วย api.qrserver)
export function promptpayQrUrl(target, amount, size = 240) {
  const payload = promptpayPayload(target, amount)
  if (!payload) return ''
  return `https://api.qrserver.com/v1/create-qr-code/?size=${size}x${size}&qzone=2&data=${encodeURIComponent(payload)}`
}
