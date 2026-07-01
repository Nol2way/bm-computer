// map slug -> Simple Icons slug เพื่อดึงโลโก้แบรนด์จริง (SVG) จาก cdn.simpleicons.org
// ถ้าโหลดไม่ได้ BrandChip จะ fallback เป็นชื่อแบรนด์ (ใน BrandBar.jsx)
const ICON = {
  amd: 'amd', intel: 'intel', nvidia: 'nvidia', asus: 'asus', msi: 'msibusiness',
  corsair: 'corsair', kingston: 'kingstontechnology',
  samsung: 'samsung', lg: 'lg', acer: 'acer', lenovo: 'lenovo', razer: 'razer',
}

// โลโก้จริง (fallback ไป logo_url จาก DB ถ้าไม่มี mapping)
export function brandLogo(slug, fallback) {
  const s = ICON[slug]
  return s ? `https://cdn.simpleicons.org/${s}` : (fallback || '')
}
