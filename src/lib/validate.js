// ตัวตรวจฟอร์มกลาง - ใช้ร่วมกันทั้งเว็บ
// check(rule, value) คืน '' เมื่อผ่าน หรือ i18n key ของข้อความ error (แสดงผ่าน t(key))

// เพดานความยาวมาตรฐานต่อชนิดข้อมูล (ใส่เป็น maxLength ของ input ด้วยเพื่อกันตั้งแต่ตอนพิมพ์)
export const MAX = {
  name: 60,
  email: 254,   // ตาม RFC
  phone: 10,
  password: 72, // เพดานของ bcrypt ฝั่ง Supabase
  address: 240,
  label: 40,
  text: 120,
  comment: 500,
  url: 500,
  productName: 140,
}

const digits = (s) => String(s || '').replace(/[\s-]/g, '')

export const validators = {
  required: (v) => (String(v ?? '').trim() ? '' : 'valid.required'),
  name: (v) => {
    const s = String(v || '').trim()
    return s.length >= 2 && s.length <= MAX.name ? '' : 'valid.name'
  },
  email: (v) => {
    const s = String(v || '').trim()
    return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(s) && s.length <= MAX.email ? '' : 'valid.email'
  },
  // เบอร์ไทย: 9-10 หลัก ขึ้นต้น 0 (บ้าน 9 หลัก / มือถือ 10 หลัก) - เว้นวรรค/ขีดได้
  phone: (v) => (/^0\d{8,9}$/.test(digits(v)) ? '' : 'valid.phone'),
  postcode: (v) => (/^\d{5}$/.test(digits(v)) ? '' : 'valid.postcode'),
  taxId: (v) => (/^\d{13}$/.test(digits(v)) ? '' : 'valid.taxId'),
  url: (v) => {
    if (!String(v || '').trim()) return '' // ว่าง = ไม่บังคับ (ใช้คู่กับ required เมื่อบังคับ)
    try {
      const u = new URL(v)
      return (u.protocol === 'http:' || u.protocol === 'https:') && v.length <= MAX.url ? '' : 'valid.url'
    } catch { return 'valid.url' }
  },
  price: (v) => {
    const n = Number(v)
    return Number.isFinite(n) && n > 0 && n <= 10000000 ? '' : 'valid.price'
  },
  stock: (v) => {
    const n = Number(v)
    return Number.isInteger(n) && n >= 0 && n <= 1000000 ? '' : 'valid.stock'
  },
  address: (v) => {
    const s = String(v || '').trim()
    return s.length >= 10 && s.length <= MAX.address ? '' : 'valid.address'
  },
}

export const check = (rule, value) => (validators[rule] ? validators[rule](value) : '')

// ตรวจหลาย field พร้อมกัน: spec = { fieldKey: 'rule' | ['rule1','rule2'] }
// คืน object { fieldKey: 'valid.xxx' } เฉพาะตัวที่ไม่ผ่าน (ว่าง = ผ่านหมด)
export function checkAll(spec, values) {
  const errs = {}
  for (const [key, rules] of Object.entries(spec)) {
    for (const r of Array.isArray(rules) ? rules : [rules]) {
      const e = check(r, values[key])
      if (e) { errs[key] = e; break }
    }
  }
  return errs
}
