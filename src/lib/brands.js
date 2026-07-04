// map slug -> Simple Icons slug เพื่อดึงโลโก้แบรนด์จริง (SVG) จาก cdn.simpleicons.org
// ถ้าไม่มีใน map จะ fallback ไป logo_url จาก DB (ตั้งเป็นโลโก้จริงไว้แล้ว) แล้วค่อยเป็นชื่อแบรนด์
// (ตรวจ slug ที่มีจริงบน Simple Icons แล้ว - อันที่ไม่มีจะพึ่ง logo_url แทน)
const ICON = {
  amd: 'amd', intel: 'intel', nvidia: 'nvidia', asus: 'asus', msi: 'msibusiness',
  corsair: 'corsair', kingston: 'kingstontechnology', samsung: 'samsung', lg: 'lg',
  acer: 'acer', lenovo: 'lenovo', razer: 'razer', seagate: 'seagate', tplink: 'tplink',
  hp: 'hp', dell: 'dell', apple: 'apple', steelseries: 'steelseries', hyperx: 'hyperx',
  nzxt: 'nzxt', coolermaster: 'coolermaster', deepcool: 'deepcool',
}

// โลโก้แบรนด์จริง: Simple Icons (โลโก้ทางการ สีแบรนด์) ถ้ามี
// แบรนด์ที่ไม่มีใน Simple Icons: favicon เชื่อถือไม่ได้ (404 บ่อย + ไม่ใช่โลโก้จริง)
// -> คืน '' ให้ BrandChip โชว์ชื่อแบรนด์เป็นตัวอักษรแทน (ยกเว้น admin ตั้ง logo_url จริงเอง)
export function brandLogo(slug, fallback) {
  const s = ICON[slug]
  if (s) return `https://cdn.simpleicons.org/${s}`
  if (fallback && !/gstatic|s2\/favicons|placehold/.test(fallback)) return fallback
  return ''
}
