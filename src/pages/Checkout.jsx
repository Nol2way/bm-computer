import { Link, useNavigate } from 'react-router-dom'
import { useEffect, useRef, useState } from 'react'
import { fmt } from '../data/mock'
import { Icon } from '../components/Icons'
import { cx } from '../lib/ui'
import { useLang } from '../i18n/LanguageContext'
import { useCart } from '../cart/CartContext'
import { useCartStock } from '../cart/useCartStock'
import { useAuth } from '../auth/AuthContext'
import { useAuthNav } from '../auth/useAuthNav'
import { createOrder, fetchSetting } from '../lib/api'
import { api, apiEnabled, ApiError } from '../lib/apiClient'
import { accountApi } from '../lib/accountApi'
import { useFetch } from '../lib/useFetch'
import { promptpayQrUrl } from '../lib/promptpay'
import { usePageMeta } from '../lib/usePageMeta'
import { checkAll, MAX } from '../lib/validate'

const wrap = 'mx-auto max-w-[1200px] px-4'
const input = 'w-full rounded-lg border border-line bg-surface px-3 py-2.5 text-sm focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20'

export default function Checkout() {
  const { t } = useLang()
  const { items, subtotal, shipping, total, clear } = useCart()
  // ตรวจสต็อกจริงอีกครั้งก่อนสั่งซื้อ (ตะกร้าอาจค้างมาจากเมื่อวาน ของอาจหมดไปแล้ว)
  const { problems: stockProblems, blocked: stockBlocked, refetch: recheckStock } = useCartStock(items)
  usePageMeta(t('cart.checkout'))
  const { user, profile } = useAuth()
  const { open: openAuth } = useAuthNav()
  const nav = useNavigate()
  const [form, setForm] = useState({ name: '', phone: '', address: '' })
  const [fieldErrs, setFieldErrs] = useState({})
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [placed, setPlaced] = useState(null) // ออเดอร์ที่สร้างแล้ว (เข้าสู่ขั้นชำระเงิน)
  const [savedAddrs, setSavedAddrs] = useState([])
  const [addrMode, setAddrMode] = useState('new')
  // ที่อยู่ใหม่: บันทึกเข้าบัญชีให้อัตโนมัติ (ติ๊กไว้เป็นค่าเริ่มต้น) - ครั้งถัดไปไม่ต้องกรอกซ้ำ
  const [saveAddr, setSaveAddr] = useState(true)
  // ใบกำกับภาษี
  const [useTaxInvoice, setUseTaxInvoice] = useState(false)
  const [taxInvoice, setTaxInvoice] = useState({
    invoiceNo: '', bookNo: '',
    addrNo: '', lane: '', building: '', streetNo: '', village: '', villageName: '', soi: '', street: '',
    subDistrict: '', district: '', province: '', postalCode: ''
  })
  const setTaxInvoiceField = (k, filter) => (e) => {
    const v = filter ? filter(e.target.value) : e.target.value
    setTaxInvoice((s) => ({ ...s, [k]: v }))
  }
  const set = (k, filter) => (e) => {
    const v = filter ? filter(e.target.value) : e.target.value
    setForm((s) => ({ ...s, [k]: v }))
    setFieldErrs((s) => ({ ...s, [k]: '' })) // แก้แล้วลบ error เดิมของช่องนั้น
  }

  function applyAddr(a) {
    setForm((s) => ({
      ...s,
      name: a.recipient || s.name,
      phone: a.phone || s.phone,
      address: [a.line1, a.district, a.amphoe, a.province, a.postcode].filter(Boolean).join(' '),
    }))
  }

  useEffect(() => {
    if (profile) setForm((s) => ({ ...s, name: s.name || profile.full_name || '', phone: s.phone || profile.phone || '' }))
  }, [profile])

  useEffect(() => {
    if (!user) return
    accountApi.listAddresses().then(({ items }) => {
      if (!items?.length) return
      setSavedAddrs(items)
      const def = items.find((a) => a.is_default) || items[0]
      setAddrMode(`saved-${def.id}`)
      applyAddr(def)
    }).catch(() => {})
  }, [user])

  if (!placed && items.length === 0) {
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
    // ตรวจครบทุกช่อง: ชื่อ 2-60 ตัว / เบอร์ไทย 9-10 หลัก / ที่อยู่อย่างน้อย 10 ตัว
    const errs = checkAll({ name: ['required', 'name'], phone: ['required', 'phone'], address: ['required', 'address'] }, form)
    setFieldErrs(errs)
    if (Object.keys(errs).length) { setError(t('checkout.fillAddress')); return }
    // ตรวจใบกำกับภาษี (ถ้าเลือก)
    if (useTaxInvoice) {
      const requiredFields = ['street', 'subDistrict', 'district', 'province', 'postalCode']
      const missingFields = requiredFields.filter((f) => !taxInvoice[f])
      if (missingFields.length) { setError(t('checkout.fillAddress')); return }
    }
    if (!user) { openAuth('login'); return }
    // ของหมด/ไม่พอ = ไม่ให้สร้างออเดอร์ (หลังบ้านจะปฏิเสธอยู่แล้ว แต่บอกก่อนดีกว่าให้กดแล้วเด้ง error)
    if (stockBlocked) { setError(t('cart.stockIssueTitle')); return }
    setLoading(true)
    try {
      const order = await createOrder({ userId: user.id, items: items.map((i) => ({ slug: i.slug, qty: i.qty })), ship: form, ...(useTaxInvoice && { taxInvoice }) })
      // จำที่อยู่ใหม่เข้าบัญชี (ไม่บล็อกออเดอร์ - พลาดก็แค่ครั้งหน้ากรอกใหม่)
      if (apiEnabled && addrMode === 'new' && saveAddr) {
        const line1 = form.address.trim()
        const dup = savedAddrs.some((a) => [a.line1, a.district, a.amphoe, a.province, a.postcode].filter(Boolean).join(' ').trim() === line1)
        if (!dup) {
          accountApi.createAddress({
            recipient: form.name.trim(), phone: form.phone.trim(), line1,
            is_default: savedAddrs.length === 0,
          }).catch(() => {})
        }
      }
      setPlaced(order)
    } catch (e) {
      setError(e.message || t('checkout.orderFail'))
      // ถูกปฏิเสธเพราะสต็อก: ถามสต็อกใหม่ให้ตะกร้าแสดงสถานะจริงทันที
      if (e instanceof ApiError && e.code === 'out_of_stock') recheckStock()
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className={`${wrap} py-6`}>
      <div className="mb-6 flex flex-wrap gap-3">
        <Step n={<Icon name="check" size={14} />} label={t('checkout.stepCart')} state="done" />
        <Step n={placed ? <Icon name="check" size={14} /> : '2'} label={t('checkout.stepInfo')} state={placed ? 'done' : 'active'} />
        <Step n="3" label={t('checkout.stepDone')} state={placed ? 'active' : ''} />
      </div>

      <div className="grid items-start gap-6 lg:grid-cols-[1fr_360px]">
        <div className="flex flex-col gap-5">
          {!placed ? (
            <section className="rounded-2xl border border-line bg-surface p-5">
              <h3 className="mb-4 font-bold">{t('checkout.address')}</h3>
              {savedAddrs.length > 0 && (
                <div className="mb-4 flex flex-col gap-2">
                  <p className="text-sm font-semibold text-muted">{t('checkout.savedAddr')}</p>
                  {savedAddrs.map((a) => (
                    <label key={a.id} className={cx('flex cursor-pointer items-start gap-3 rounded-xl border p-3 transition-colors', addrMode === `saved-${a.id}` ? 'border-brand-500 bg-brand-500/5' : 'border-line hover:border-brand-400')}>
                      <input type="radio" name="addrMode" value={`saved-${a.id}`} checked={addrMode === `saved-${a.id}`} onChange={() => { setAddrMode(`saved-${a.id}`); applyAddr(a) }} className="mt-1 accent-brand-600" />
                      <div className="text-sm leading-relaxed">
                        <div className="flex flex-wrap items-center gap-1.5">
                          <span className="font-semibold">{a.recipient}</span>
                          {a.label && <span className="rounded bg-surface2 px-1.5 py-0.5 text-xs text-muted">{a.label}</span>}
                          {a.is_default && <span className="text-xs font-medium text-brand-500">{t('checkout.defaultAddr')}</span>}
                        </div>
                        <div className="text-muted">{a.phone}</div>
                        <div className="text-muted">{[a.line1, a.district, a.amphoe, a.province, a.postcode].filter(Boolean).join(' ')}</div>
                      </div>
                    </label>
                  ))}
                  <label className={cx('flex cursor-pointer items-center gap-3 rounded-xl border p-3 transition-colors', addrMode === 'new' ? 'border-brand-500 bg-brand-500/5' : 'border-line hover:border-brand-400')}>
                    {/* สลับมากรอกใหม่: ล้างเฉพาะช่องที่อยู่ (คงชื่อ/เบอร์จาก profile ไว้ ไม่ให้กรอกซ้ำ) */}
                    <input type="radio" name="addrMode" value="new" checked={addrMode === 'new'}
                      onChange={() => { setAddrMode('new'); setForm((s) => ({ ...s, address: '' })); setFieldErrs({}) }} className="accent-brand-600" />
                    <span className="text-sm font-semibold">{t('checkout.useNewAddr')}</span>
                  </label>
                </div>
              )}

              {addrMode === 'new' && (
                <>
                  <div className="flex flex-wrap gap-4">
                    <div className="min-w-[200px] flex-1">
                      <label className="mb-1.5 block text-sm font-semibold">{t('checkout.name')}</label>
                      <input className={cx(input, fieldErrs.name && 'border-red-400')} value={form.name} onChange={set('name')} autoComplete="name" maxLength={MAX.name} />
                      {fieldErrs.name && <span className="mt-1 block text-xs text-red-500">{t(fieldErrs.name)}</span>}
                    </div>
                    <div className="min-w-[200px] flex-1">
                      <label className="mb-1.5 block text-sm font-semibold">{t('checkout.phone')}</label>
                      <input className={cx(input, fieldErrs.phone && 'border-red-400')} value={form.phone} onChange={set('phone', (v) => v.replace(/[^\d]/g, ''))} inputMode="tel" autoComplete="tel" maxLength={MAX.phone} />
                      {fieldErrs.phone && <span className="mt-1 block text-xs text-red-500">{t(fieldErrs.phone)}</span>}
                    </div>
                  </div>
                  <div className="mt-4">
                    <label className="mb-1.5 block text-sm font-semibold">{t('checkout.addr')}</label>
                    <textarea className={cx(input, fieldErrs.address && 'border-red-400')} rows="3" value={form.address} onChange={set('address')} placeholder={t('checkout.addrPlaceholder')} maxLength={MAX.address} />
                    {fieldErrs.address && <span className="mt-1 block text-xs text-red-500">{t(fieldErrs.address)}</span>}
                  </div>
                  {apiEnabled && (
                    <label className="mt-3 flex cursor-pointer items-center gap-2 text-sm">
                      <input type="checkbox" className="h-4 w-4 accent-brand-600" checked={saveAddr} onChange={(e) => setSaveAddr(e.target.checked)} />
                      {t('checkout.saveAddr')} <span className="text-xs text-muted">({t('checkout.saveAddrHint')})</span>
                    </label>
                  )}
                </>
              )}

              {/* ใบกำกับภาษี */}
              <div className="mt-6 border-t border-line pt-6">
                <label className="flex cursor-pointer items-center gap-2 text-sm font-semibold">
                  <input type="checkbox" className="h-4 w-4 accent-brand-600" checked={useTaxInvoice} onChange={(e) => setUseTaxInvoice(e.target.checked)} />
                  {t('checkout.useTaxInvoice')}
                </label>

                {useTaxInvoice && (
                  <div className="mt-4 space-y-3 rounded-lg bg-surface2 p-4">
                    <div className="text-sm font-semibold text-muted">{t('checkout.taxInvoice')}</div>

                    {/* Invoice info */}
                    <div className="grid gap-3 sm:grid-cols-2">
                      <div>
                        <label className="mb-1.5 block text-sm font-semibold">{t('checkout.taxInvoiceNo')}</label>
                        <input className={input} value={taxInvoice.invoiceNo} onChange={setTaxInvoiceField('invoiceNo')} maxLength={20} />
                      </div>
                      <div>
                        <label className="mb-1.5 block text-sm font-semibold">{t('checkout.taxInvoiceBook')}</label>
                        <input className={input} value={taxInvoice.bookNo} onChange={setTaxInvoiceField('bookNo')} maxLength={20} />
                      </div>
                    </div>

                    {/* Address details */}
                    <div className="border-t border-line/30 pt-3 text-xs font-semibold text-muted">{t('checkout.buyerAddress')}</div>

                    {/* Row 1: Address number, Lane, Building, Street number */}
                    <div className="grid gap-3 sm:grid-cols-4">
                      <div>
                        <label className="mb-1.5 block text-sm font-semibold">{t('checkout.addrNo')}</label>
                        <input className={input} value={taxInvoice.addrNo} onChange={setTaxInvoiceField('addrNo')} placeholder="1" maxLength={10} />
                      </div>
                      <div>
                        <label className="mb-1.5 block text-sm font-semibold">{t('checkout.lane')}</label>
                        <input className={input} value={taxInvoice.lane} onChange={setTaxInvoiceField('lane')} placeholder="A" maxLength={20} />
                      </div>
                      <div>
                        <label className="mb-1.5 block text-sm font-semibold">{t('checkout.building')}</label>
                        <input className={input} value={taxInvoice.building} onChange={setTaxInvoiceField('building')} placeholder="Building A" maxLength={30} />
                      </div>
                      <div>
                        <label className="mb-1.5 block text-sm font-semibold">{t('checkout.streetNo')}</label>
                        <input className={input} value={taxInvoice.streetNo} onChange={setTaxInvoiceField('streetNo')} placeholder="123" maxLength={10} />
                      </div>
                    </div>

                    {/* Row 2: Village, Village name, Soi, Street */}
                    <div className="grid gap-3 sm:grid-cols-4">
                      <div>
                        <label className="mb-1.5 block text-sm font-semibold">{t('checkout.village')}</label>
                        <input className={input} value={taxInvoice.village} onChange={setTaxInvoiceField('village')} placeholder="10" maxLength={5} />
                      </div>
                      <div>
                        <label className="mb-1.5 block text-sm font-semibold">{t('checkout.villageName')}</label>
                        <input className={input} value={taxInvoice.villageName} onChange={setTaxInvoiceField('villageName')} maxLength={50} />
                      </div>
                      <div>
                        <label className="mb-1.5 block text-sm font-semibold">{t('checkout.soi')}</label>
                        <input className={input} value={taxInvoice.soi} onChange={setTaxInvoiceField('soi')} placeholder="123" maxLength={20} />
                      </div>
                      <div>
                        <label className="mb-1.5 block text-sm font-semibold">{t('checkout.street')} *</label>
                        <input className={input} value={taxInvoice.street} onChange={setTaxInvoiceField('street')} maxLength={50} />
                      </div>
                    </div>

                    {/* Row 3: Sub-district, District, Province, Postal code */}
                    <div className="grid gap-3 sm:grid-cols-4">
                      <div>
                        <label className="mb-1.5 block text-sm font-semibold">{t('checkout.subDistrict')} *</label>
                        <input className={input} value={taxInvoice.subDistrict} onChange={setTaxInvoiceField('subDistrict')} maxLength={50} />
                      </div>
                      <div>
                        <label className="mb-1.5 block text-sm font-semibold">{t('checkout.district')} *</label>
                        <input className={input} value={taxInvoice.district} onChange={setTaxInvoiceField('district')} maxLength={50} />
                      </div>
                      <div>
                        <label className="mb-1.5 block text-sm font-semibold">{t('checkout.province')} *</label>
                        <input className={input} value={taxInvoice.province} onChange={setTaxInvoiceField('province')} maxLength={50} />
                      </div>
                      <div>
                        <label className="mb-1.5 block text-sm font-semibold">{t('checkout.postalCode')} *</label>
                        <input className={input} value={taxInvoice.postalCode} onChange={setTaxInvoiceField('postalCode', (v) => v.replace(/[^\d]/g, ''))} inputMode="numeric" placeholder="10200" maxLength={5} />
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* สต็อกไม่พอ: บอกให้ชัดว่าติดตัวไหน แล้วให้กลับไปแก้ที่ตะกร้า */}
              {stockBlocked && (
                <div className="mt-4 flex items-start gap-2.5 rounded-lg border border-red-500/30 bg-red-500/10 p-3 text-sm" role="alert">
                  <Icon name="alert" size={17} className="mt-0.5 shrink-0 text-red-600 dark:text-red-400" />
                  <div>
                    <b className="text-red-600 dark:text-red-400">{t('cart.stockIssueTitle')}</b>
                    <ul className="mt-1 list-inside list-disc text-muted">
                      {stockProblems.map((p) => (
                        <li key={p.slug}>{p.name} · {p.out ? t('cart.outOfStock') : t('cart.onlyNLeft', { n: p.stock })}</li>
                      ))}
                    </ul>
                    <Link to="/cart" className="mt-1.5 inline-block font-semibold text-brand-600 hover:underline">{t('checkout.backToCart')}</Link>
                  </div>
                </div>
              )}
              {error && <div className="mt-3 rounded-lg bg-red-500/10 px-3 py-2 text-sm text-red-600 dark:text-red-400" role="alert">{error}</div>}
              <button onClick={placeOrder} disabled={loading || stockBlocked} className="mt-4 w-full rounded-xl bg-brand-600 py-3 font-semibold text-white transition-colors hover:bg-brand-700 disabled:cursor-not-allowed disabled:opacity-60 cursor-pointer">
                {loading ? t('checkout.placing') : !user ? t('checkout.loginToOrder') : t('checkout.confirm')}
              </button>
            </section>
          ) : (
            <PaymentStep order={placed} onPaid={() => { clear(); nav(`/track?order=${placed.code}`) }} />
          )}
        </div>

        <aside className="rounded-2xl border border-line bg-surface p-5 lg:sticky lg:top-[150px]">
          <h3 className="mb-3 font-bold">{t('checkout.yourOrder')}</h3>
          {items.map((it) => (
            <div key={it.slug}>
              <div className="flex justify-between gap-2 py-1.5 text-sm text-muted"><span className="truncate">{it.name} ×{it.qty}</span><span className="nums shrink-0 text-fg">฿{fmt(it.price * it.qty)}</span></div>
              {it.warranty_period_months && (
                <div className="ml-2 flex items-center gap-1 py-1 text-xs text-amber-600 dark:text-amber-400">
                  <Icon name="shield" size={13} /> {t('checkout.warrantyIncluded', { months: it.warranty_period_months })}
                </div>
              )}
            </div>
          ))}
          <div className="mt-2 flex justify-between border-t border-line pt-2 text-sm text-muted"><span>{t('cart.subtotal')}</span><span className="nums text-fg">฿{fmt(subtotal)}</span></div>
          <div className="flex justify-between py-1.5 text-sm text-muted"><span>{t('cart.shipping')}</span><span>{shipping === 0 ? <b className="text-emerald-600 dark:text-emerald-400">{t('common.free')}</b> : `฿${fmt(shipping)}`}</span></div>
          <div className="mt-1 flex justify-between border-t border-line pt-3 text-lg font-bold"><span>{t('cart.total')}</span><b className="nums text-brand-600">฿{fmt(placed ? placed.total : total)}</b></div>
          {!placed && <Link to="/cart" className="mt-3 block py-2 text-center text-sm text-muted hover:text-fg">{t('checkout.backToCart')}</Link>}
        </aside>
      </div>
    </div>
  )
}

function PaymentStep({ order, onPaid }) {
  const { t } = useLang()
  const [file, setFile] = useState(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const fileRef = useRef(null)
  const { data: pay } = useFetch(() => fetchSetting('payment'), [])
  const qr = pay?.promptpay_id ? promptpayQrUrl(pay.promptpay_id, order.total) : ''

  async function verify() {
    if (!file) { setError(t('checkout.chooseSlip')); return }
    setBusy(true); setError('')
    try {
      const fd = new FormData()
      fd.append('image', file)
      fd.append('orderCode', order.code)
      // verify-slip ต้องใช้ service_role (server-trust กันปลอมสถานะจ่าย)
      // โหมด API: ผ่าน worker /api/payments/verify-slip · fallback: Pages Function /api/verify-slip
      if (apiEnabled) {
        const data = await api.postForm('/api/payments/verify-slip', fd)
        if (data.ok) onPaid()
        else setError(data.error || t('checkout.verifyFail'))
      } else {
        const res = await fetch('/api/verify-slip', { method: 'POST', body: fd })
        const data = await res.json()
        if (data.ok) onPaid()
        else setError(data.error || t('checkout.verifyFail'))
      }
    } catch (e) {
      // ApiError = server ตอบมาพร้อมข้อความจริง (เช่น สลิปซ้ำ/ยอดไม่พอ) · อื่นๆ = ต่อไม่ได้
      setError(e instanceof ApiError ? e.message : t('checkout.verifyConn'))
    } finally {
      setBusy(false)
    }
  }

  return (
    <section className="rounded-2xl border border-line bg-surface p-5">
      <div className="mb-4 rounded-lg bg-brand-50 px-3 py-2 text-sm text-brand-700 dark:bg-brand-600/10 dark:text-brand-400">
        {t('checkout.orderCreated')} · {t('checkout.orderNo')} <b>#{order.code}</b>
      </div>
      <div className="grid gap-5 sm:grid-cols-[220px_1fr]">
        <div className="flex flex-col items-center gap-2 rounded-xl border-2 border-brand-600 bg-brand-50 p-4 text-center dark:bg-brand-600/10">
          <div className="flex items-center gap-2 text-sm font-bold"><Icon name="qr" size={18} className="text-brand-600" /> {t('checkout.promptpay')}</div>
          {qr ? (
            <>
              <img src={qr} alt="PromptPay QR" width="180" height="180" className="rounded-lg bg-white p-2" />
              {pay?.name && <div className="text-xs font-semibold">{pay.name}</div>}
              <div className="nums text-xl font-bold text-brand-600">฿{fmt(order.total)}</div>
              <div className="text-xs text-muted">{t('checkout.scanToPay')}</div>
            </>
          ) : (
            <div className="py-6 text-sm text-muted">{t('checkout.noPayAccount')}<br />{t('checkout.contactShop')}</div>
          )}
        </div>

        <div>
          <h3 className="mb-2 font-bold">{t('checkout.uploadSlip')}</h3>
          <input ref={fileRef} type="file" accept="image/*" onChange={(e) => { setFile(e.target.files?.[0] || null); setError('') }} className="hidden" />
          <button type="button" onClick={() => fileRef.current?.click()} className="flex w-full items-center justify-center gap-2 rounded-xl border-2 border-dashed border-line py-6 text-sm font-semibold text-muted transition-colors hover:border-brand-400 hover:text-brand-600 cursor-pointer">
            <Icon name="image" size={20} /> {file ? file.name : t('checkout.chooseSlip')}
          </button>
          {error && <div className="mt-3 rounded-lg bg-red-500/10 px-3 py-2 text-sm text-red-600 dark:text-red-400" role="alert">{error}</div>}
          <button onClick={verify} disabled={busy || !file} className="mt-3 w-full rounded-xl bg-brand-600 py-3 font-semibold text-white transition-colors hover:bg-brand-700 disabled:opacity-60 cursor-pointer">
            {busy ? t('checkout.verifying') : t('checkout.verifyPay')}
          </button>
          <p className="mt-2 text-xs text-muted">{t('checkout.qrDemo')}</p>
        </div>
      </div>
    </section>
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
