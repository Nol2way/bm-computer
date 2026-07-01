import { fmt } from '../../data/mock'
import { Icon } from '../../components/Icons'
import { adminStats } from '../../lib/api'
import { useFetch } from '../../lib/useFetch'

export default function AdminOverview() {
  const { data, loading } = useFetch(() => adminStats(), [])
  const s = data || { products: 0, orders: 0, revenue: 0 }
  const cards = [
    { icon: 'box', label: 'สินค้าทั้งหมด', value: loading ? '...' : fmt(s.products) },
    { icon: 'receipt', label: 'คำสั่งซื้อ', value: loading ? '...' : fmt(s.orders) },
    { icon: 'card', label: 'ยอดขายรวม', value: loading ? '...' : `฿${fmt(s.revenue)}` },
  ]
  return (
    <div>
      <h3 className="mb-4 font-bold">ภาพรวมร้านค้า</h3>
      <div className="grid gap-4 sm:grid-cols-3">
        {cards.map((c) => (
          <div key={c.label} className="rounded-2xl border border-line bg-surface p-5">
            <div className="mb-2 grid h-10 w-10 place-items-center rounded-full bg-brand-50 text-brand-600 dark:bg-brand-600/15"><Icon name={c.icon} /></div>
            <div className="nums text-2xl font-bold">{c.value}</div>
            <div className="text-sm text-muted">{c.label}</div>
          </div>
        ))}
      </div>
      <p className="mt-4 text-sm text-muted">จัดการสินค้า สไลด์ และออเดอร์ได้จากเมนูด้านซ้าย เพิ่มสินค้าแล้วจะขึ้นหน้าร้านทันที</p>
    </div>
  )
}
