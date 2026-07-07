import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { fmt } from '../../data/mock'
import { Icon } from '../../components/Icons'
import { adminListProducts, adminListOrders, adminListCustomers } from '../../lib/api'
import { useFetch } from '../../lib/useFetch'
import { useLang } from '../../i18n/LanguageContext'
import { Skeleton } from '../../components/Skeleton'
import { cx, orderStatusCls } from '../../lib/ui'

const PAID = ['paid', 'packing', 'shipping', 'done']
const STATUS_ORDER = ['pending', 'paid', 'packing', 'shipping', 'done', 'cancel_requested', 'cancel', 'refunded']
// สีแท่งตามสถานะ - โทนเดียวกับ badge (orderStatusCls) และมี label+ตัวเลขกำกับเสมอ ไม่พึ่งสีอย่างเดียว
const STATUS_BAR = {
  pending: 'bg-zinc-400', paid: 'bg-blue-500', packing: 'bg-blue-400', shipping: 'bg-amber-500',
  done: 'bg-emerald-500', cancel_requested: 'bg-orange-500', cancel: 'bg-zinc-300 dark:bg-zinc-600', refunded: 'bg-purple-500',
}

export default function AdminOverview() {
  const { t, lang } = useLang()
  const { data: orders, loading: lo } = useFetch(() => adminListOrders(), [])
  const { data: products, loading: lp } = useFetch(() => adminListProducts(), [])
  const { data: customers } = useFetch(() => adminListCustomers(), [])
  const loading = lo || lp

  const stats = useMemo(() => {
    const os = orders || []
    const paidOrders = os.filter((o) => PAID.includes(o.status))
    const revenue = paidOrders.reduce((s, o) => s + (o.total || 0), 0)
    return {
      revenue,
      orders: os.length,
      aov: paidOrders.length ? Math.round(revenue / paidOrders.length) : 0,
      customers: (customers || []).length,
      products: (products || []).length,
      pendingAction: os.filter((o) => o.status === 'pending' || o.status === 'cancel_requested').length,
    }
  }, [orders, products, customers])

  // ยอดขายรายวัน 14 วันล่าสุด (นับเฉพาะออเดอร์ที่ชำระแล้ว ตามวันที่จ่าย)
  const days = useMemo(() => {
    const list = []
    const byKey = new Map()
    for (let i = 13; i >= 0; i--) {
      const d = new Date(); d.setDate(d.getDate() - i)
      const key = d.toLocaleDateString('sv') // yyyy-mm-dd (เขตเวลาเครื่อง)
      const day = { key, label: d.toLocaleDateString(lang === 'th' ? 'th-TH' : 'en-US', { day: 'numeric', month: 'short' }), total: 0, orders: 0 }
      list.push(day); byKey.set(key, day)
    }
    for (const o of orders || []) {
      if (!PAID.includes(o.status)) continue
      const day = byKey.get(new Date(o.paid_at || o.created_at).toLocaleDateString('sv'))
      if (day) { day.total += o.total || 0; day.orders += 1 }
    }
    return list
  }, [orders, lang])

  const byStatus = useMemo(() => {
    const m = new Map()
    for (const o of orders || []) m.set(o.status, (m.get(o.status) || 0) + 1)
    const max = Math.max(...m.values(), 1)
    return STATUS_ORDER.filter((s) => m.get(s)).map((s) => ({ status: s, n: m.get(s), pct: (m.get(s) / max) * 100 }))
  }, [orders])

  // สินค้าขายดี: รวมจำนวนชิ้นจาก order_items ของออเดอร์ที่ชำระแล้ว
  const topProducts = useMemo(() => {
    const m = new Map()
    for (const o of orders || []) {
      if (!PAID.includes(o.status)) continue
      for (const it of o.order_items || []) {
        const cur = m.get(it.name) || { name: it.name, qty: 0, amount: 0 }
        cur.qty += it.qty || 0
        cur.amount += (it.price || 0) * (it.qty || 0)
        m.set(it.name, cur)
      }
    }
    const arr = [...m.values()].sort((a, b) => b.qty - a.qty).slice(0, 6)
    const max = Math.max(...arr.map((x) => x.qty), 1)
    return arr.map((x) => ({ ...x, pct: (x.qty / max) * 100 }))
  }, [orders])

  const lowStock = useMemo(
    () => (products || []).filter((p) => p.is_active && p.stock <= 5).sort((a, b) => a.stock - b.stock).slice(0, 6),
    [products],
  )

  const cards = [
    { icon: 'card', label: t('admin.ovRevenue'), value: `฿${fmt(stats.revenue)}`, cls: 'text-emerald-600 dark:text-emerald-400' },
    { icon: 'receipt', label: t('admin.totalOrders'), value: fmt(stats.orders) },
    { icon: 'cart', label: t('admin.ovAov'), value: `฿${fmt(stats.aov)}` },
    { icon: 'users', label: t('admin.ovCustomers'), value: fmt(stats.customers) },
    { icon: 'box', label: t('admin.totalProducts'), value: fmt(stats.products) },
    { icon: 'clock', label: t('admin.ovPendingAction'), value: fmt(stats.pendingAction), cls: stats.pendingAction > 0 ? 'text-amber-600 dark:text-amber-400' : '', to: '/admin/orders' },
  ]

  return (
    <div>
      <h3 className="mb-4 font-bold">{t('admin.storeOverview')}</h3>

      {/* แถวตัวเลขหลัก */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-6">
        {cards.map((c) => {
          const body = (
            <>
              <div className="mb-2 grid h-9 w-9 place-items-center rounded-full bg-brand-50 text-brand-600 dark:bg-brand-600/15"><Icon name={c.icon} size={18} /></div>
              {loading ? <Skeleton className="h-7 w-20" /> : <div className={cx('nums text-xl font-bold', c.cls)}>{c.value}</div>}
              <div className="mt-0.5 text-xs text-muted">{c.label}</div>
            </>
          )
          return c.to
            ? <Link key={c.label} to={c.to} className="rounded-2xl border border-line bg-surface p-4 transition-colors hover:border-brand-500">{body}</Link>
            : <div key={c.label} className="rounded-2xl border border-line bg-surface p-4">{body}</div>
        })}
      </div>

      {/* ยอดขายรายวัน + ออเดอร์ตามสถานะ */}
      <div className="mt-4 grid gap-4 xl:grid-cols-[2fr_1fr]">
        <Panel title={t('admin.ovSales14')}>
          {loading ? <Skeleton className="h-[220px] w-full" /> : <SalesChart days={days} t={t} />}
        </Panel>

        <Panel title={t('admin.ovByStatus')} to="/admin/orders" toLabel={t('common.viewAll')}>
          {loading ? <Skeleton className="h-[220px] w-full" /> : byStatus.length === 0 ? (
            <Empty label={t('admin.ovNoSales')} />
          ) : (
            <div className="flex flex-col gap-2.5">
              {byStatus.map((s) => (
                <div key={s.status}>
                  <div className="mb-1 flex items-center justify-between gap-2 text-sm">
                    <span className={cx('rounded-full px-2 py-0.5 text-xs font-semibold', orderStatusCls[s.status])}>{t(`orders.status.${s.status}`)}</span>
                    <b className="nums">{fmt(s.n)}</b>
                  </div>
                  <div className="h-2 overflow-hidden rounded-full bg-surface2">
                    <div className={cx('h-full rounded-full', STATUS_BAR[s.status])} style={{ width: `${Math.max(s.pct, 3)}%` }} />
                  </div>
                </div>
              ))}
            </div>
          )}
        </Panel>
      </div>

      {/* สินค้าขายดี + สต็อกใกล้หมด */}
      <div className="mt-4 grid gap-4 xl:grid-cols-2">
        <Panel title={t('admin.ovTopProducts')} to="/admin/products" toLabel={t('common.viewAll')}>
          {loading ? <Skeleton className="h-[200px] w-full" /> : topProducts.length === 0 ? (
            <Empty label={t('admin.ovNoSales')} />
          ) : (
            <div className="flex flex-col gap-3">
              {topProducts.map((p) => (
                <div key={p.name}>
                  <div className="mb-1 flex items-baseline justify-between gap-3 text-sm">
                    <span className="line-clamp-1">{p.name}</span>
                    <span className="nums shrink-0 text-xs text-muted">{t('admin.ovSoldN', { n: fmt(p.qty) })} · ฿{fmt(p.amount)}</span>
                  </div>
                  <div className="h-2 overflow-hidden rounded-full bg-surface2">
                    <div className="h-full rounded-full bg-brand-600" style={{ width: `${Math.max(p.pct, 3)}%` }} />
                  </div>
                </div>
              ))}
            </div>
          )}
        </Panel>

        <Panel title={t('admin.ovLowStockList')} to="/admin/products" toLabel={t('common.viewAll')}>
          {loading ? <Skeleton className="h-[200px] w-full" /> : lowStock.length === 0 ? (
            <Empty label={t('admin.ovNoLowStock')} icon="check" />
          ) : (
            <div className="flex flex-col">
              {lowStock.map((p) => (
                <div key={p.id} className="flex items-center gap-3 border-b border-line py-2 last:border-b-0">
                  <img src={p.images?.[0] || 'https://placehold.co/40x40/f1f1f4/9ca3af?text=BM'} alt=""
                    className="h-9 w-9 shrink-0 rounded bg-white object-contain" onError={(e) => { e.currentTarget.style.visibility = 'hidden' }} />
                  <span className="line-clamp-1 flex-1 text-sm">{p.name}</span>
                  <span className={cx('nums shrink-0 rounded-full px-2 py-0.5 text-xs font-semibold',
                    p.stock === 0 ? 'bg-red-500/15 text-red-600 dark:text-red-400' : 'bg-amber-500/15 text-amber-600 dark:text-amber-400')}>
                    {p.stock === 0 ? t('admin.stockOut') : t('admin.ovLeftN', { n: p.stock })}
                  </span>
                </div>
              ))}
            </div>
          )}
        </Panel>
      </div>
    </div>
  )
}

function Panel({ title, to, toLabel, children }) {
  return (
    <section className="rounded-2xl border border-line bg-surface p-5">
      <div className="mb-4 flex items-center justify-between gap-3">
        <h4 className="text-sm font-bold">{title}</h4>
        {to && <Link to={to} className="text-xs font-semibold text-brand-600 hover:underline">{toLabel}</Link>}
      </div>
      {children}
    </section>
  )
}

function Empty({ label, icon = 'box' }) {
  return (
    <div className="grid h-[180px] place-items-center text-center text-sm text-muted">
      <div><Icon name={icon} size={28} className="mx-auto mb-2" />{label}</div>
    </div>
  )
}

// กราฟยอดขายรายวัน: เส้น+พื้นที่ series เดียว (สีแบรนด์) + crosshair/tooltip ตอน hover
function SalesChart({ days, t }) {
  const [hover, setHover] = useState(null)
  const H = 190
  const max = Math.max(...days.map((d) => d.total), 1)
  const n = days.length
  const xPct = (i) => (i / (n - 1)) * 100
  const yPct = (v) => 100 - (v / max) * 92 // เผื่อหัว 8% ไม่ให้ยอดสูงสุดชนขอบ
  const line = days.map((d, i) => `${i ? 'L' : 'M'}${xPct(i)},${yPct(d.total)}`).join(' ')
  const area = `${line} L100,100 L0,100 Z`
  const hasSales = days.some((d) => d.total > 0)

  const onMove = (e) => {
    const r = e.currentTarget.getBoundingClientRect()
    const i = Math.round(((e.clientX - r.left) / r.width) * (n - 1))
    setHover(Math.max(0, Math.min(n - 1, i)))
  }

  // ป้ายแกน y (0 / กึ่งกลาง / สูงสุด) เป็นเลขย่อ
  const short = (v) => (v >= 1e6 ? `${(v / 1e6).toFixed(1)}M` : v >= 1e3 ? `${Math.round(v / 1e3)}k` : fmt(v))

  return (
    <div>
      <div className="flex gap-2">
        <div className="nums flex w-10 shrink-0 flex-col justify-between py-0.5 text-right text-[11px] text-muted" style={{ height: H }} aria-hidden="true">
          <span>{short(max)}</span><span>{short(Math.round(max / 2))}</span><span>0</span>
        </div>
        <div className="relative flex-1 cursor-crosshair" style={{ height: H }} onMouseMove={onMove} onMouseLeave={() => setHover(null)}>
          {/* เส้นตาราง */}
          {[0, 50, 100].map((y) => (
            <div key={y} className="absolute inset-x-0 border-t border-line/70" style={{ top: `${y === 100 ? 99.5 : y}%` }} aria-hidden="true" />
          ))}
          <svg className="absolute inset-0 h-full w-full text-brand-600" viewBox="0 0 100 100" preserveAspectRatio="none" role="img" aria-label={t('admin.ovSales14')}>
            {hasSales && <path d={area} fill="currentColor" opacity="0.1" />}
            <path d={line} fill="none" stroke="currentColor" strokeWidth="2" vectorEffect="non-scaling-stroke" strokeLinejoin="round" />
          </svg>
          {!hasSales && <div className="absolute inset-0 grid place-items-center text-sm text-muted">{t('admin.ovNoSales')}</div>}

          {hover != null && (
            <>
              <div className="pointer-events-none absolute inset-y-0 w-px bg-brand-600/40" style={{ left: `${xPct(hover)}%` }} aria-hidden="true" />
              <div className="pointer-events-none absolute h-2.5 w-2.5 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-surface bg-brand-600"
                style={{ left: `${xPct(hover)}%`, top: `${yPct(days[hover].total)}%` }} aria-hidden="true" />
              <div className={cx('pointer-events-none absolute z-10 min-w-[120px] rounded-lg border border-line bg-surface px-3 py-2 text-xs shadow-lg',
                xPct(hover) > 55 ? '-translate-x-full' : '')}
                style={{ left: `${xPct(hover)}%`, top: 4, marginLeft: xPct(hover) > 55 ? -10 : 10 }}>
                <div className="font-semibold">{days[hover].label}</div>
                <div className="nums mt-0.5 text-base font-bold text-brand-600">฿{fmt(days[hover].total)}</div>
                <div className="text-muted">{t('admin.ovOrdersN', { n: days[hover].orders })}</div>
              </div>
            </>
          )}
        </div>
      </div>
      {/* ป้ายแกน x: วันแรก / กลาง / วันนี้ */}
      <div className="ml-12 mt-1.5 flex justify-between text-[11px] text-muted" aria-hidden="true">
        <span>{days[0]?.label}</span><span>{days[Math.floor(n / 2)]?.label}</span><span>{days[n - 1]?.label}</span>
      </div>
    </div>
  )
}
