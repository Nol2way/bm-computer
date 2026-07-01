import { Link, useSearchParams } from 'react-router-dom'
import { fmt } from '../data/mock'
import { Icon } from '../components/Icons'
import { cx, orderStatusCls, orderFlow } from '../lib/ui'
import { useLang } from '../i18n/LanguageContext'
import { useAuth } from '../auth/AuthContext'
import { useAuthModal } from '../components/AuthModal'
import { fetchOrderByCode } from '../lib/api'
import { useFetch } from '../lib/useFetch'

const wrap = 'mx-auto max-w-[1200px] px-4'

export default function OrderTracking() {
  const { t, lang } = useLang()
  const { user } = useAuth()
  const { open: openAuth } = useAuthModal()
  const [params] = useSearchParams()
  const code = params.get('order')
  const { data: order, loading } = useFetch(() => fetchOrderByCode(code), [code, user?.id])

  const fmtDate = (iso) => iso ? new Date(iso).toLocaleString(lang === 'th' ? 'th-TH' : 'en-US', { dateStyle: 'medium', timeStyle: 'short' }) : ''

  const Shell = ({ children }) => (
    <div className={`${wrap} py-6`}>
      <nav className="flex gap-1.5 py-3 text-sm text-muted"><Link to="/" className="hover:text-brand-600">{t('list.home')}</Link> / <span className="text-fg">{t('track.title')}</span></nav>
      {children}
    </div>
  )

  if (!user) return (
    <Shell><Empty icon="user" title={t('orders.loginToView')}><button onClick={() => openAuth('login')} className="mt-5 inline-flex items-center justify-center rounded-xl bg-brand-600 px-6 py-3 font-semibold text-white transition-colors hover:bg-brand-700 cursor-pointer">{t('auth.signin')}</button></Empty></Shell>
  )
  if (loading) return <Shell><div className="py-16 text-center text-muted">{t('common.loading')}</div></Shell>
  if (!order) return (
    <Shell><Empty icon="receipt" title={lang === 'th' ? 'ไม่พบคำสั่งซื้อ' : 'Order not found'}><Link to="/orders" className="mt-5 inline-flex items-center justify-center rounded-xl bg-brand-600 px-6 py-3 font-semibold text-white transition-colors hover:bg-brand-700">{t('track.viewHistory')}</Link></Empty></Shell>
  )

  const idx = orderFlow.indexOf(order.status)
  const cancelled = order.status === 'cancel'

  return (
    <Shell>
      <div className="grid items-start gap-6 lg:grid-cols-[1fr_360px]">
        <section className="rounded-2xl border border-line bg-surface p-6">
          <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
            <div><h2 className="text-xl font-bold">{t('track.order')} #{order.code}</h2><span className="text-sm text-muted">{t('track.orderedOn')} {fmtDate(order.created_at)}</span></div>
            <span className={cx('rounded-full px-3 py-1 text-xs font-semibold', orderStatusCls[order.status])}>{t(`orders.status.${order.status}`)}</span>
          </div>

          {cancelled ? (
            <div className="rounded-xl bg-zinc-500/10 p-4 text-center text-muted">{t('orders.status.cancel')}</div>
          ) : (
            <ol className="relative ml-2">
              {orderFlow.map((st, i) => (
                <li key={st} className="relative pb-7 pl-8 last:pb-0">
                  <span className={cx('absolute left-0 top-1 h-4 w-4 rounded-full ring-4 ring-surface', i < idx ? 'bg-emerald-500' : i === idx ? 'bg-brand-600' : 'bg-line')} />
                  {i < orderFlow.length - 1 && <span className={cx('absolute left-[7px] top-5 h-full w-0.5', i < idx ? 'bg-emerald-500' : 'bg-line')} />}
                  <b className={cx(i > idx && 'text-muted')}>{t(`orders.status.${st}`)}</b>
                </li>
              ))}
            </ol>
          )}

          {order.ship_address && (
            <div className="mt-4 rounded-xl border border-line bg-surface2 p-4 text-sm">
              <div className="font-semibold">{order.ship_name} · {order.ship_phone}</div>
              <div className="text-muted">{order.ship_address}</div>
            </div>
          )}
        </section>

        <aside className="rounded-2xl border border-line bg-surface p-5">
          <h3 className="mb-3 font-bold">{t('checkout.yourOrder')}</h3>
          {(order.order_items || []).map((it) => (
            <div key={it.id} className="flex justify-between gap-2 py-1.5 text-sm text-muted"><span className="truncate">{it.name} ×{it.qty}</span><span className="nums shrink-0 text-fg">฿{fmt(it.price * it.qty)}</span></div>
          ))}
          <div className="mt-3 flex justify-between border-t border-line pt-4 text-lg font-bold"><span>{t('cart.total')}</span><b className="nums text-brand-600">฿{fmt(order.total)}</b></div>
          <Link to="/orders" className="mt-4 block rounded-xl border border-line py-2.5 text-center text-sm font-semibold hover:bg-surface2">{t('track.viewHistory')}</Link>
        </aside>
      </div>
    </Shell>
  )
}

function Empty({ icon, title, children }) {
  return (
    <div className="mx-auto flex max-w-md flex-col items-center justify-center rounded-2xl border border-line bg-surface p-10 text-center shadow-xs">
      <div className="mb-4 grid h-16 w-16 place-items-center rounded-full bg-brand-50 text-brand-600 dark:bg-brand-600/15 dark:text-brand-400"><Icon name={icon} size={28} /></div>
      <h2 className="text-xl font-bold tracking-tight text-fg">{title}</h2>
      {children}
    </div>
  )
}
