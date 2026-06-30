import { Link } from 'react-router-dom'
import { useState } from 'react'
import { products, fmt } from '../data/mock'
import { Icon } from '../components/Icons'
import { cx } from '../lib/ui'
import { useLang } from '../i18n/LanguageContext'

const wrap = 'mx-auto max-w-[1200px] px-4'

export default function Checkout() {
  const { t } = useLang()
  const [pay, setPay] = useState('promptpay')
  const cart = [{ p: products[0], qty: 1 }, { p: products[3], qty: 2 }]
  const sub = cart.reduce((s, i) => s + i.p.price * i.qty, 0)
  const total = sub + (sub >= 1500 ? 0 : 80)
  const input = 'w-full rounded-lg border border-line bg-surface px-3 py-2.5 text-sm focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20'
  const pays = [
    { id: 'promptpay', icon: 'qr', name: t('checkout.promptpay'), desc: t('checkout.promptpayD') },
    { id: 'card', icon: 'card', name: t('checkout.card'), desc: t('checkout.cardD') },
    { id: 'cod', icon: 'truck', name: t('checkout.cod'), desc: t('checkout.codD') },
  ]

  return (
    <div className={`${wrap} py-6`}>
      <div className="mb-6 flex flex-wrap gap-3">
        <Step n={<Icon name="check" size={14} />} label={t('checkout.stepCart')} state="done" />
        <Step n="2" label={t('checkout.stepInfo')} state="active" />
        <Step n="3" label={t('checkout.stepDone')} />
      </div>

      <div className="grid items-start gap-6 lg:grid-cols-[1fr_360px]">
        <div className="flex flex-col gap-5">
          <section className="rounded-2xl border border-line bg-surface p-5">
            <h3 className="mb-4 font-bold">{t('checkout.address')}</h3>
            <div className="flex flex-wrap gap-4">
              <div className="min-w-[200px] flex-1"><label className="mb-1.5 block text-sm font-semibold">{t('checkout.name')}</label><input className={input} placeholder="สมชาย ใจดี" /></div>
              <div className="min-w-[200px] flex-1"><label className="mb-1.5 block text-sm font-semibold">{t('checkout.phone')}</label><input className={input} placeholder="08x-xxx-xxxx" inputMode="tel" /></div>
            </div>
            <div className="mt-4"><label className="mb-1.5 block text-sm font-semibold">{t('checkout.addr')}</label><textarea className={input} rows="3" placeholder={t('checkout.addrPlaceholder')} /></div>
          </section>

          <section className="rounded-2xl border border-line bg-surface p-5">
            <h3 className="mb-4 font-bold">{t('checkout.payMethod')}</h3>
            <div className="flex flex-col gap-3">
              {pays.map((m) => (
                <label key={m.id} className={cx('flex cursor-pointer items-center gap-3 rounded-xl border-2 p-4 transition-colors',
                  pay === m.id ? 'border-brand-600 bg-brand-50 dark:bg-brand-600/10' : 'border-line hover:border-zinc-400')}>
                  <input type="radio" name="pay" checked={pay === m.id} onChange={() => setPay(m.id)} className="h-4 w-4 accent-brand-600" />
                  <Icon name={m.icon} size={22} className="text-brand-600" />
                  <div><b>{m.name}</b><div className="text-sm text-muted">{m.desc}</div></div>
                </label>
              ))}
            </div>
          </section>
        </div>

        <aside className="rounded-2xl border border-line bg-surface p-5 lg:sticky lg:top-[150px]">
          <h3 className="mb-3 font-bold">{t('checkout.yourOrder')}</h3>
          {cart.map(({ p, qty }) => (
            <div key={p.id} className="flex justify-between py-1.5 text-sm text-muted"><span>{p.name.slice(0, 20)}… ×{qty}</span><span className="nums text-fg">฿{fmt(p.price * qty)}</span></div>
          ))}
          <div className="flex justify-between py-1.5 text-sm text-muted"><span>{t('cart.shipping')}</span><span className="text-emerald-600 dark:text-emerald-400">{t('common.free')}</span></div>
          <div className="mt-3 flex justify-between border-t border-line pt-4 text-lg font-bold"><span>{t('cart.total')}</span><b className="nums text-brand-600">฿{fmt(total)}</b></div>
          <Link to="/track" className="mt-4 block rounded-xl bg-brand-600 py-3 text-center font-semibold text-white transition-colors hover:bg-brand-700">{t('checkout.confirm')}</Link>
          <Link to="/cart" className="mt-2 block py-2 text-center text-sm text-muted hover:text-fg">{t('checkout.backToCart')}</Link>
        </aside>
      </div>
    </div>
  )
}

function Step({ n, label, state }) {
  return (
    <div className={cx('flex items-center gap-2 text-sm', state ? 'font-semibold text-fg' : 'text-muted')}>
      <span className={cx('grid h-7 w-7 place-items-center rounded-full text-xs font-bold',
        state === 'done' ? 'bg-emerald-600 text-white' : state === 'active' ? 'bg-brand-600 text-white' : 'bg-surface2 text-muted')}>{n}</span>
      {label}
    </div>
  )
}
