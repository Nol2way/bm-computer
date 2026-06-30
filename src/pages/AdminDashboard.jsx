import { useState } from 'react'
import { Link } from 'react-router-dom'
import { products, orders, fmt } from '../data/mock'
import { Icon } from '../components/Icons'
import { orderStatusCls, cx } from '../lib/ui'
import { useLang } from '../i18n/LanguageContext'

const wrap = 'mx-auto max-w-[1200px] px-4'
const stKey = { shipping: 'stShipping', done: 'stDone', cancel: 'stCancel' }

export default function AdminDashboard() {
  const { t } = useLang()
  const [tab, setTab] = useState('overview')
  const menu = [
    { k: 'overview', icon: 'grid', label: t('admin.overview') },
    { k: 'products', icon: 'box', label: t('admin.products') },
    { k: 'orders', icon: 'receipt', label: t('admin.orders') },
    { k: 'users', icon: 'users', label: t('admin.users') },
  ]
  const stats = [
    { l: t('admin.salesToday'), v: '฿128,400', d: '+12%', up: true },
    { l: t('admin.newOrders'), v: '34', d: '+8', up: true },
    { l: t('admin.lowStockStat'), v: '5', d: '!', up: false },
    { l: t('admin.newCustomers'), v: '18', d: '+5%', up: true },
  ]
  const th = 'bg-surface2 p-3 text-left text-xs font-semibold text-muted'
  const td = 'border-t border-line p-3 text-sm'

  return (
    <div className={`${wrap} py-6`}>
      <div className="mb-5 flex items-center justify-between">
        <div><h1 className="text-2xl font-bold">{t('admin.title')}</h1><p className="text-sm text-muted">{t('admin.sub')}</p></div>
        <Link to="/" className="rounded-lg border border-line px-3 py-2 text-sm font-semibold transition-colors hover:bg-surface2">{t('admin.backToShop')}</Link>
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

        <section className="flex flex-col gap-5">
          {tab === 'overview' && (
            <>
              <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
                {stats.map((s) => (
                  <div key={s.l} className="rounded-2xl border border-line bg-surface p-5">
                    <div className="text-xs text-muted">{s.l}</div>
                    <div className="nums mt-1 text-2xl font-bold">{s.v}</div>
                    <div className={cx('text-xs font-semibold', s.up ? 'text-emerald-600 dark:text-emerald-400' : 'text-brand-600')}>{s.up ? '▲' : '▼'} {s.d}</div>
                  </div>
                ))}
              </div>
              <div className="rounded-2xl border border-line bg-surface p-5">
                <h3 className="mb-3 font-bold">{t('admin.salesChart')}</h3>
                <div className="ph aspect-[16/7] rounded-xl" />
              </div>
            </>
          )}

          {tab === 'products' && (
            <Panel title={`${t('admin.products')} (${products.length})`} action={t('admin.addProduct')}>
              <table className="w-full border-collapse overflow-hidden rounded-xl border border-line">
                <thead><tr>{[t('admin.colProduct'), t('admin.colCat'), t('admin.colPrice'), t('admin.colStock'), t('admin.colManage')].map((h) => <th key={h} className={th}>{h}</th>)}</tr></thead>
                <tbody>
                  {products.map((p) => (
                    <tr key={p.id} className="hover:bg-surface2/50">
                      <td className={td}>{p.name}</td><td className={td}>{t(`cats.${p.cat}`)}</td><td className={`${td} nums`}>฿{fmt(p.price)}</td>
                      <td className={td}><span className={p.stock <= 5 ? 'font-semibold text-amber-600 dark:text-amber-400' : 'font-semibold text-emerald-600 dark:text-emerald-400'}>{p.stock}</span></td>
                      <td className={td}><button className="text-sm font-semibold hover:text-brand-600 cursor-pointer">{t('admin.edit')}</button> · <button className="text-sm font-semibold text-brand-600 hover:underline cursor-pointer">{t('admin.del')}</button></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </Panel>
          )}

          {tab === 'orders' && (
            <Panel title={t('admin.orders')}>
              <table className="w-full border-collapse overflow-hidden rounded-xl border border-line">
                <thead><tr>{[t('admin.colOrderNo'), t('admin.colDate'), t('admin.colTotal'), t('admin.colStatus'), t('admin.colManage')].map((h) => <th key={h} className={th}>{h}</th>)}</tr></thead>
                <tbody>
                  {orders.map((o) => (
                    <tr key={o.id} className="hover:bg-surface2/50">
                      <td className={td}>#{o.id}</td><td className={td}>{o.date}</td><td className={`${td} nums`}>฿{fmt(o.total)}</td>
                      <td className={td}><span className={cx('rounded-full px-2.5 py-0.5 text-xs font-semibold', orderStatusCls[o.status])}>{t(`orders.${stKey[o.status]}`)}</span></td>
                      <td className={td}><button className="text-sm font-semibold hover:text-brand-600 cursor-pointer">{t('admin.updateStatus')}</button></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </Panel>
          )}

          {tab === 'users' && (
            <Panel title={t('admin.users')}>
              <table className="w-full border-collapse overflow-hidden rounded-xl border border-line">
                <thead><tr>{[t('admin.colUser'), t('admin.colEmail'), t('admin.colRole'), t('admin.colStatus'), t('admin.colManage')].map((h) => <th key={h} className={th}>{h}</th>)}</tr></thead>
                <tbody>
                  {[['สมชาย ใจดี', 'somchai@email.com', t('admin.roleCustomer')], ['Admin BM', 'admin@bmcom.th', t('admin.roleAdmin')], ['Nattapong', 'natt@email.com', t('admin.roleCustomer')]].map(([n, e, r]) => (
                    <tr key={e} className="hover:bg-surface2/50">
                      <td className={td}>{n}</td><td className={td}>{e}</td><td className={td}><span className="rounded-full bg-surface2 px-2.5 py-0.5 text-xs font-semibold">{r}</span></td>
                      <td className={td}><span className="rounded-full bg-emerald-500/15 px-2.5 py-0.5 text-xs font-semibold text-emerald-600 dark:text-emerald-400">{t('admin.active')}</span></td>
                      <td className={td}><button className="text-sm font-semibold hover:text-brand-600 cursor-pointer">{t('admin.manage')}</button></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </Panel>
          )}
        </section>
      </div>
    </div>
  )
}

function Panel({ title, action, children }) {
  return (
    <div>
      <div className="mb-3 flex items-center justify-between">
        <h3 className="font-bold">{title}</h3>
        {action && <button className="rounded-lg bg-brand-600 px-3 py-2 text-sm font-semibold text-white transition-colors hover:bg-brand-700 cursor-pointer">{action}</button>}
      </div>
      <div className="overflow-x-auto">{children}</div>
    </div>
  )
}
