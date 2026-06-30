// =========================================================
// Mock data สำหรับ Wireframe (ยังไม่ต่อ Database จริง)
// ชื่อหมวด/สถานะ -> ดึงจากระบบแปลภาษา (i18n) ผ่าน slug/key
// อนาคต: ดึงจาก Supabase (ตาราง products, categories, orders ...)
// =========================================================

// icon = ชื่อไอคอน SVG ใน components/Icons.jsx, name = key ใน translations.cats.*
export const categories = [
  { slug: 'cpu',       icon: 'cpu' },
  { slug: 'gpu',       icon: 'gpu' },
  { slug: 'mainboard', icon: 'mainboard' },
  { slug: 'ram',       icon: 'ram' },
  { slug: 'storage',   icon: 'storage' },
  { slug: 'monitor',   icon: 'monitor' },
  { slug: 'notebook',  icon: 'notebook' },
  { slug: 'gear',      icon: 'gear' },
]

export const brands = ['ASUS', 'MSI', 'Gigabyte', 'AMD', 'Intel', 'NVIDIA', 'Corsair', 'Kingston', 'Logitech']

// badge: key 'best' | 'sale' | 'low' | null  (แปลผ่าน badge map ใน component)
export const products = [
  {
    id: 'cpu-7800x3d', cat: 'cpu', brand: 'AMD',
    name: 'AMD Ryzen 7 7800X3D 8-Core AM5',
    price: 13900, old: 15500, rating: 4.9, reviews: 214, stock: 12, badge: 'best',
    specs: { 'Core/Thread': '8 Core / 16 Thread', 'Clock': '4.2 - 5.0 GHz', 'Socket': 'AM5', 'TDP': '120W', 'Cache': '96MB (3D V-Cache)' },
  },
  {
    id: 'gpu-4070s', cat: 'gpu', brand: 'ASUS',
    name: 'ASUS TUF RTX 4070 SUPER OC 12GB',
    price: 22900, old: 24900, rating: 4.8, reviews: 156, stock: 6, badge: 'sale',
    specs: { 'Chipset': 'NVIDIA RTX 4070 SUPER', 'Memory': '12GB GDDR6X', 'Ports': '3x DP, 1x HDMI', 'Length': '301mm', 'Power': '1x 16-pin' },
  },
  {
    id: 'mb-b650', cat: 'mainboard', brand: 'MSI',
    name: 'MSI MAG B650 TOMAHAWK WIFI',
    price: 7490, old: null, rating: 4.7, reviews: 88, stock: 20, badge: null,
    specs: { 'Socket': 'AM5', 'Chipset': 'B650', 'Form Factor': 'ATX', 'Max RAM': 'DDR5 192GB', 'M.2': '3 slots' },
  },
  {
    id: 'ram-32', cat: 'ram', brand: 'Corsair',
    name: 'Corsair Vengeance DDR5 32GB (16x2) 6000MHz',
    price: 3690, old: 4200, rating: 4.9, reviews: 301, stock: 45, badge: 'best',
    specs: { 'Capacity': '32GB (16GB x2)', 'Type': 'DDR5', 'Speed': '6000MHz', 'Latency': 'CL30', 'RGB': 'Yes' },
  },
  {
    id: 'ssd-2tb', cat: 'storage', brand: 'Kingston',
    name: 'Kingston NV2 2TB NVMe PCIe 4.0 M.2 SSD',
    price: 4290, old: null, rating: 4.6, reviews: 142, stock: 3, badge: 'low',
    specs: { 'Capacity': '2TB', 'Interface': 'PCIe 4.0 x4', 'Read': '3,500 MB/s', 'Write': '2,800 MB/s', 'Form': 'M.2 2280' },
  },
  {
    id: 'mon-27', cat: 'monitor', brand: 'Gigabyte',
    name: 'Gigabyte M27Q 27" QHD 170Hz IPS',
    price: 8990, old: 10500, rating: 4.8, reviews: 97, stock: 9, badge: 'sale',
    specs: { 'Size': '27"', 'Resolution': '2560x1440 (QHD)', 'Refresh': '170Hz', 'Panel': 'IPS', 'Response': '0.5ms' },
  },
  {
    id: 'nb-rog', cat: 'notebook', brand: 'ASUS',
    name: 'ASUS ROG Zephyrus G14 Ryzen 9 / RTX 4060',
    price: 52900, old: 56900, rating: 4.7, reviews: 64, stock: 5, badge: null,
    specs: { 'CPU': 'Ryzen 9 8945HS', 'GPU': 'RTX 4060 8GB', 'Display': '14" OLED 120Hz', 'RAM': '16GB DDR5', 'SSD': '1TB' },
  },
  {
    id: 'kb-mech', cat: 'gear', brand: 'Logitech',
    name: 'Logitech G Pro X TKL Mechanical Keyboard',
    price: 4990, old: null, rating: 4.6, reviews: 188, stock: 30, badge: null,
    specs: { 'Layout': 'TKL (87 keys)', 'Switch': 'GX Brown', 'Connection': 'Lightspeed / USB-C', 'Lighting': 'RGB', 'Keycaps': 'PBT Doubleshot' },
  },
]

// ออเดอร์ตัวอย่าง (status = key แปลผ่าน orders.st*)
export const orders = [
  { id: 'BM2406001', date: '28 มิ.ย. 2026', total: 36800, status: 'shipping', items: 3 },
  { id: 'BM2406002', date: '20 มิ.ย. 2026', total: 8990,  status: 'done',     items: 1 },
  { id: 'BM2405014', date: '12 พ.ค. 2026', total: 13900, status: 'cancel',   items: 1 },
]

// ขั้นตอนติดตามพัสดุ (label = key แปลผ่าน track.s1..s5)
export const trackSteps = [
  { key: 's1', d: '28 มิ.ย. 2026 09:14', s: 'done' },
  { key: 's2', d: '28 มิ.ย. 2026 09:20', s: 'done' },
  { key: 's3', d: '28 มิ.ย. 2026 14:02', s: 'done' },
  { key: 's4', d: '29 มิ.ย. 2026 08:30', s: 'active' },
  { key: 's5', d: 'ETA 1 ก.ค. 2026',     s: '' },
]

export const fmt = (n) => n.toLocaleString('en-US')
