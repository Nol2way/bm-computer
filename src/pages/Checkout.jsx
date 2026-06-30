import { Link, useNavigate } from 'react-router-dom'
import { useEffect, useState } from 'react'
import { fmt } from '../data/mock'
import { Icon } from '../components/Icons'
import { cx } from '../lib/ui'
import { useLang } from '../i18n/LanguageContext'
import { useCart } from '../cart/CartContext'
import { useAuth } from '../auth/AuthContext'
import { useAuthModal } from '../components/AuthModal'
import { createOrder } from '../lib/api'

const wrap = 'mx-auto max-w-[1200px] px-4'

export default function Checkout() {
  const { t } = useLang()
  const { items, subtotal, shipping, total, clear } = useCart()
  const { user, profile } = useAuth()
  const { open: openAuth } = useAuthModal()
  const nav = useNavigate()
  const [form, setForm] = useState({ name: '', phone: '', address: '' })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const set = (k) => (e) => setForm((s) => ({ ...s, [k]: e.target.value }))
  const input = 'w-full rounded-lg border border-line bg-surface px-3 py-2.5 text-sm focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20'
  const qr = `https://api.qrserver.com/v1/create-qr-code/?size=240x240&data=PromptPay%20BMComputer%20THB${total}`

  // เติมชื่อ/เบอร์จาก profile ให้อัตโนมัติ
  useEffect(() => {
    if (profile) setForm((s) => ({ ...s, name: s.name || profile.full_name || '', phone: s.phone || profile.phone || '' }))
  }, [profile])

  if (items.length === 0) {
    return (
      <div className={`${wrap} py-16`}>
        <div className="mx-auto max-w-md rounded-2xl border border-line bg-surface p-10 text-center">
          <div className="mx-auto mb-4 grid h-16 w-16 place-items-center rounded-full bg-surface2 text-muted"><Icon name="cart" size={30} /></div>
          <h2 className="text-xl font-bold">{t('cart.empty')}</h2>
          <Link to="/products" className="mt-5 inline-block rounded-xl bg-brand-600 px-6 py-3 font-semibold text-white transition-colors hover:bg-brand-700">{t('list.products')}</Link>
        </div>
      </div>
    )
  }

  async function placeOrder() {
    setError('')
    if (!form.name.trim() || !form.phone.trim() || !form.address.trim()) { setError(t('checkout.fillAddress')); return }
    if (!user) { openAuth('login'); return }
    setLoading(true)
    try {
      const order = await createOrder({
        userId: user.id,
        items: items.map((i) => ({ slug: i.slug, qty: i.qty })),
        ship: form,
      })
      clear()
      nav(`/track?order=${order.code}`)
    } catch (e) {
      setError(e.message || 'เกิดข้อผิดพลาดในการสั่งซื้อ')
    } finally {
      setLoading(false)
    }
  }

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
              <div className="min-w-[200px] flex-1"><label className="mb-1.5 block text-sm font-semibold">{t('checkout.name')}</label><input className={input} value={form.name} onChange={set('name')} placeholder="สมชาย ใจดี" /></div>
              <div className="min-w-[200px] flex-1"><label className="mb-1.5 block text-sm font-semibold">{t('checkout.phone')}</label><input className={input} value={form.phone} onChange={set('phone')} placeholder="08x-xxx-xxxx" inputMode="tel" /></div>
            </div>
            <div className="mt-4"><label className="mb-1.5 block text-sm font-semibold">{t('checkout.addr')}</label><textarea className={input} rows="3" value={form.address} onChange={set('address')} placeholder={t('checkout.addrPlaceholder')} /></div>
          </section>

          <section className="rounded-2xl border border-line bg-surface p-5">
            <h3 className="mb-4 font-bold">{t('checkout.payMethod')}</h3>
            <div className="flex flex-col items-center gap-3 rounded-xl border-2 border-brand-600 bg-brand-50 p-6 text-center dark:bg-brand-600/10">
              <div className="flex items-center gap-2 font-bold"><Icon name="qr" size={22} className="text-brand-600" /> {t('checkout.promptpay')}</div>
              <img src={qr} alt="PromptPay QR" width="200" height="200" className="rounded-lg bg-white p-2" />
              <div className="text-sm text-muted">{t('checkout.scanToPay')}</div>
              <div className="nums text-2xl font-bold text-brand-600">฿{fmt(total)}</div>
              <div className="text-xs text-muted">{t('checkout.qrDemo')}</div>
            </div>
          </section>
        </div>

        <aside className="rounded-2xl border border-line bg-surface p-5 lg:sticky lg:top-[150px]">
          <h3 className="mb-3 font-bold">{t('checkout.yourOrder')}</h3>
          {items.map((it) => (
            <div key={it.slug} className="flex justify-between gap-2 py-1.5 text-sm text-muted"><span className="truncate">{it.name} ×{it.qty}</span><span className="nums shrink-0 text-fg">฿{fmt(it.price * it.qty)}</span></div>
          ))}
          <div className="mt-2 flex justify-between border-t border-line pt-2 text-sm text-muted"><span>{t('cart.subtotal')}</span><span className="nums text-fg">฿{fmt(subtotal)}</span></div>
          <div className="flex justify-between py-1.5 text-sm text-muted"><span>{t('cart.shipping')}</span><span>{shipping === 0 ? <b className="text-emerald-600 dark:text-emerald-400">{t('common.free')}</b> : `฿${fmt(shipping)}`}</span></div>
          <div className="mt-1 flex justify-between border-t border-line pt-3 text-lg font-bold"><span>{t('cart.total')}</span><b className="nums text-brand-600">฿{fmt(total)}</b></div>

          {error && <div className="mt-3 rounded-lg bg-red-500/10 px-3 py-2 text-sm text-red-600 dark:text-red-400" role="alert">{error}</div>}

          <button onClick={placeOrder} disabled={loading}
            className="mt-4 w-full rounded-xl bg-brand-600 py-3 font-semibold text-white transition-colors hover:bg-brand-700 disabled:opacity-60 cursor-pointer">
            {loading ? t('checkout.placing') : !user ? t('checkout.loginToOrder') : t('checkout.confirm')}
          </button>
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
