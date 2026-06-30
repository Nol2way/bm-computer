import { Link } from 'react-router-dom'
import { trackSteps } from '../data/mock'
import { cx } from '../lib/ui'
import { useLang } from '../i18n/LanguageContext'

const wrap = 'mx-auto max-w-[1200px] px-4'
const input = 'w-full rounded-lg border border-line bg-surface px-3 py-2.5 text-sm focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20'

export default function OrderTracking() {
  const { t } = useLang()
  return (
    <div className={`${wrap} py-6`}>
      <nav className="flex gap-1.5 py-3 text-sm text-muted"><Link to="/" className="hover:text-brand-600">{t('list.home')}</Link> / <span className="text-fg">{t('track.title')}</span></nav>

      <div className="grid items-start gap-6 lg:grid-cols-[1fr_360px]">
        <section className="rounded-2xl border border-line bg-surface p-6">
          <div className="mb-6 flex items-center justify-between">
            <div><h2 className="text-xl font-bold">{t('track.order')} #BM2406001</h2><span className="text-sm text-muted">{t('track.orderedOn')} 28 มิ.ย. 2026</span></div>
            <span className="rounded-full bg-amber-500/15 px-3 py-1 text-xs font-semibold text-amber-600 dark:text-amber-400">{t('track.shipping')}</span>
          </div>

          <ol className="relative ml-2">
            {trackSteps.map((st, i) => (
              <li key={i} className="relative pb-7 pl-8 last:pb-0">
                <span className={cx('absolute left-0 top-1 h-4 w-4 rounded-full ring-4 ring-surface',
                  st.s === 'done' ? 'bg-emerald-500' : st.s === 'active' ? 'bg-brand-600' : 'bg-line')} />
                {i < trackSteps.length - 1 && <span className="absolute left-[7px] top-5 h-full w-0.5 bg-line" />}
                <b className={cx(st.s === '' && 'text-muted')}>{t(`track.${st.key}`)}</b>
                <div className="text-sm text-muted">{st.d}</div>
              </li>
            ))}
          </ol>

          <div className="mt-4 flex items-center justify-between rounded-xl border border-line bg-surface2 p-4">
            <div><div className="text-sm text-muted">{t('track.carrier')} · Kerry Express</div><b className="nums">TH-KE-882190034</b></div>
            <button className="rounded-lg border border-line px-3 py-2 text-sm font-semibold hover:bg-surface cursor-pointer">{t('track.copyTracking')}</button>
          </div>
        </section>

        <aside className="rounded-2xl border border-line bg-surface p-5">
          <h3 className="mb-3 font-bold">{t('track.findOrder')}</h3>
          <div className="mb-3"><label className="mb-1.5 block text-sm font-semibold">{t('track.orderNo')}</label><input className={input} placeholder="BM2406001" /></div>
          <div className="mb-4"><label className="mb-1.5 block text-sm font-semibold">{t('track.emailPhone')}</label><input className={input} placeholder={t('track.usedAtCheckout')} /></div>
          <button className="w-full rounded-xl bg-brand-600 py-3 font-semibold text-white transition-colors hover:bg-brand-700 cursor-pointer">{t('track.trackStatus')}</button>
          <p className="mt-3 text-center text-xs text-muted"><Link to="/orders" className="text-brand-600 hover:underline">{t('track.viewHistory')}</Link></p>
        </aside>
      </div>
    </div>
  )
}
