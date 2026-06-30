import { Link } from 'react-router-dom'
import { orders, fmt } from '../data/mock'
import { orderStatusCls, cx } from '../lib/ui'
import { useLang } from '../i18n/LanguageContext'

const wrap = 'mx-auto max-w-[1200px] px-4'
const stKey = { shipping: 'stShipping', done: 'stDone', cancel: 'stCancel' }

export default function OrderHistory() {
  const { t } = useLang()
  return (
    <div className={`${wrap} py-6`}>
      <nav className="flex gap-1.5 py-3 text-sm text-muted"><Link to="/" className="hover:text-brand-600">{t('list.home')}</Link> / <span className="text-fg">{t('orders.title')}</span></nav>
      <h1 className="mb-5 text-2xl font-bold">{t('orders.title')}</h1>

      <div className="flex flex-col gap-4">
        {orders.map((o) => (
          <div key={o.id} className="rounded-2xl border border-line bg-surface p-5">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="ph aspect-square w-14 rounded-lg" />
                <div>
                  <b>#{o.id}</b> <span className={cx('rounded-full px-2.5 py-0.5 text-xs font-semibold', orderStatusCls[o.status])}>{t(`orders.${stKey[o.status]}`)}</span>
                  <div className="text-sm text-muted">{o.date} · {o.items} {t('orders.items')}</div>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <div className="text-right"><div className="text-sm text-muted">{t('orders.totalLabel')}</div><b className="nums text-brand-600">฿{fmt(o.total)}</b></div>
                <Link to="/track" className="rounded-lg border border-line px-4 py-2 text-sm font-semibold transition-colors hover:bg-surface2">{t('orders.detail')}</Link>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
