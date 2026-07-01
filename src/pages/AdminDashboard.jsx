import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Icon } from '../components/Icons'
import { cx } from '../lib/ui'
import { useAuth } from '../auth/AuthContext'
import { useAuthModal } from '../components/AuthModal'
import AdminOverview from './admin/AdminOverview'
import AdminProducts from './admin/AdminProducts'
import AdminSlides from './admin/AdminSlides'
import AdminOrders from './admin/AdminOrders'
import AdminSettings from './admin/AdminSettings'

const wrap = 'mx-auto max-w-[1200px] px-4'
const menu = [
  { k: 'overview', icon: 'grid', label: 'ภาพรวม' },
  { k: 'products', icon: 'box', label: 'สินค้า' },
  { k: 'slides', icon: 'image', label: 'สไลด์/แบนเนอร์' },
  { k: 'orders', icon: 'receipt', label: 'ออเดอร์' },
  { k: 'settings', icon: 'wrench', label: 'ตั้งค่าชำระเงิน' },
]

export default function AdminDashboard() {
  const { user, isAdmin, loading } = useAuth()
  const { open: openAuth } = useAuthModal()
  const [tab, setTab] = useState('overview')

  if (loading) return <div className={`${wrap} py-20 text-center text-muted`}>กำลังตรวจสอบสิทธิ์...</div>

  if (!user) return (
    <Guard title="เข้าสู่ระบบสำหรับผู้ดูแล"><button onClick={() => openAuth('login')} className="mt-5 inline-flex items-center justify-center rounded-xl bg-brand-600 px-6 py-3 font-semibold text-white transition-colors hover:bg-brand-700 cursor-pointer">เข้าสู่ระบบ</button></Guard>
  )
  if (!isAdmin) return (
    <Guard title="ไม่มีสิทธิ์เข้าถึงหลังบ้าน" desc="บัญชีนี้ไม่ใช่ผู้ดูแลระบบ"><Link to="/" className="mt-5 inline-flex items-center justify-center rounded-xl border border-line px-6 py-3 font-semibold transition-colors hover:bg-surface2">กลับหน้าร้าน</Link></Guard>
  )

  return (
    <div className={`${wrap} py-6`}>
      <div className="mb-5 flex items-center justify-between">
        <div><h1 className="text-2xl font-bold">หลังบ้าน (Admin)</h1><p className="text-sm text-muted">BM Computer · จัดการร้านค้า</p></div>
        <Link to="/" className="rounded-lg border border-line px-3 py-2 text-sm font-semibold hover:bg-surface2">กลับหน้าร้าน</Link>
      </div>

      <div className="grid items-start gap-6 lg:grid-cols-[220px_1fr]">
        <aside className="flex flex-wrap gap-1 rounded-2xl border border-line bg-surface p-3 lg:sticky lg:top-[150px] lg:flex-col">
          {menu.map((m) => (
            <button key={m.k} onClick={() => setTab(m.k)}
              className={cx('flex items-center gap-2.5 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors cursor-pointer',
                tab === m.k ? 'bg-brand-50 text-brand-600 dark:bg-brand-600/15' : 'text-fg hover:bg-surface2')}>
              <Icon name={m.icon} size={18} /> {m.label}
            </button>
          ))}
        </aside>

        <section>
          {tab === 'overview' && <AdminOverview />}
          {tab === 'products' && <AdminProducts />}
          {tab === 'slides' && <AdminSlides />}
          {tab === 'orders' && <AdminOrders />}
          {tab === 'settings' && <AdminSettings />}
        </section>
      </div>
    </div>
  )
}

function Guard({ title, desc, children }) {
  return (
    <div className={`${wrap} py-16`}>
      <div className="mx-auto flex max-w-md flex-col items-center justify-center rounded-2xl border border-line bg-surface p-10 text-center shadow-xs">
        <div className="mb-4 grid h-16 w-16 place-items-center rounded-full bg-brand-50 text-brand-600 dark:bg-brand-600/15 dark:text-brand-400"><Icon name="lock" size={28} /></div>
        <h2 className="text-xl font-bold tracking-tight text-fg">{title}</h2>
        {desc && <p className="mt-1.5 text-sm text-muted">{desc}</p>}
        {children}
      </div>
    </div>
  )
}
