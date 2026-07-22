import { useState, useEffect } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { fmt } from '../../data/mock'
import { Icon } from '../../components/Icons'
import { cx, orderStatusCls, orderFlow } from '../../lib/ui'
import { useLang } from '../../i18n/LanguageContext'
import { useAuth } from '../../auth/AuthContext'
import { fetchOrderByCode, fetchMyOrders, cancelOrder } from '../../lib/api'
import { useFetch } from '../../lib/useFetch'
import { OrderListSkeleton } from '../../components/Skeleton'
import { PageHead, EmptyState, PrimaryBtn } from './ui'

const CANCELLED_STATES = ['cancel', 'cancel_requested', 'refunded']
// ไม่แสดง "Delivered" เป็นขั้นตอนในไทม์ไลน์ - ป้ายสถานะด้านบนของการ์ดบอกอยู่แล้วว่าจัดส่งสำเร็จ
const VISIBLE_FLOW = orderFlow.filter((st) => st !== 'done')

const fmtDate = (iso, lang) => iso
  ? new Date(iso).toLocaleString(lang === 'th' ? 'th-TH' : 'en-US', { dateStyle: 'medium', timeStyle: 'short' })
  : ''

export default function AccountTrack() {
  const { t, lang } = useLang()
  const { user } = useAuth()
  const [params, setParams] = useSearchParams()
  const code = params.get('order')
  const [reloadKey, setReloadKey] = useState(0)
  const { data, loading } = useFetch(() => (user ? fetchMyOrders(user.id) : Promise.resolve([])), [user?.id, reloadKey])
  const orders = data || []
  // ออเดอร์ที่จัดส่งสำเร็จแล้ว หรือถูกยกเลิกแล้ว ไม่ต้องติดตามอีก - ให้ไปดูในประวัติคำสั่งซื้อแทน
  const trackableOrders = orders.filter((o) => o.status !== 'done' && !CANCELLED_STATES.includes(o.status))
  const [selected, setSelected] = useState(null)
  const [cancelTarget, setCancelTarget] = useState(null)
  const [searchCode, setSearchCode] = useState('')
  const [searchErr, setSearchErr] = useState('')

  // ลิงก์เข้ามาพร้อม order code (เช่นจากหน้าประวัติคำสั่งซื้อ) -> เปิดป็อปอัปติดตามให้อัตโนมัติ
  useEffect(() => {
    if (!code) return
    const found = orders.find((o) => o.code === code)
    if (found) setSelected(found)
    else if (!loading) fetchOrderByCode(code).then((o) => o && setSelected(o))
  }, [code, orders, loading])

  const closePopup = () => {
    setSelected(null)
    if (code) { params.delete('order'); setParams(params) }
  }

  const submitSearch = async (e) => {
    e.preventDefault()
    const v = searchCode.trim()
    if (!v) return
    setSearchErr('')
    const o = await fetchOrderByCode(v)
    if (o) setSelected(o)
    else setSearchErr(t('track.notFound'))
  }

  const doCancel = async (reason) => {
    await cancelOrder(cancelTarget.id, reason)
    setCancelTarget(null)
    setSelected(null)
    setReloadKey((k) => k + 1)
  }

  return (
    <div>
      <PageHead title={t('track.title')} />
      <form onSubmit={submitSearch} className="mb-6 flex max-w-sm gap-2">
        <input value={searchCode} onChange={(e) => setSearchCode(e.target.value)} placeholder={t('track.orderNo')}
          className="flex-1 rounded-lg border border-line bg-surface px-3 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20" />
        <button type="submit" className="rounded-lg border border-line px-4 py-2 text-sm font-semibold hover:bg-surface2 cursor-pointer">
          {t('track.trackStatus')}
        </button>
      </form>
      {searchErr && <div className="mb-4 rounded-lg bg-red-500/10 px-3 py-2 text-sm text-red-600 dark:text-red-400">{searchErr}</div>}

      {loading ? (
        <OrderListSkeleton />
      ) : trackableOrders.length === 0 ? (
        <>
          <EmptyState icon="receipt" text={t('orders.empty')} />
          <div className="mt-4 flex justify-center">
            <Link to="/products"><PrimaryBtn>{t('orders.shopNow')}</PrimaryBtn></Link>
          </div>
        </>
      ) : (
        <div className="flex flex-col gap-3">
          {trackableOrders.map((o) => (
            <button key={o.id} onClick={() => setSelected(o)}
              className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-line bg-surface p-4 text-left transition-colors hover:bg-surface2 cursor-pointer">
              <div>
                <b>#{o.code}</b>
                <div className="text-sm text-muted">{fmtDate(o.created_at, lang)} · {(o.order_items || []).length} {t('orders.items')}</div>
              </div>
              <span className={cx('rounded-full px-3 py-1 text-xs font-semibold', orderStatusCls[o.status])}>
                {t(`orders.status.${o.status}`)}
              </span>
            </button>
          ))}
        </div>
      )}

      {selected && (
        <TrackPopup order={selected} t={t} lang={lang} user={user} onClose={closePopup} onCancelClick={() => setCancelTarget(selected)} />
      )}
      {cancelTarget && <CancelDialog order={cancelTarget} onCancel={doCancel} onClose={() => setCancelTarget(null)} t={t} />}
    </div>
  )
}

function TrackPopup({ order, t, lang, user, onClose, onCancelClick }) {
  const idx = orderFlow.indexOf(order.status)
  const cancelled = CANCELLED_STATES.includes(order.status)
  const canCancel = user && ['pending', 'paid', 'packing'].includes(order.status)

  return (
    <div className="fixed inset-0 z-[90] flex items-center justify-center p-4" role="dialog" aria-modal="true">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative z-10 max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl border border-line bg-surface p-6 shadow-2xl">
        <button onClick={onClose} aria-label="close"
          className="absolute right-4 top-4 grid h-8 w-8 place-items-center rounded-lg text-muted hover:bg-surface2 cursor-pointer">
          <Icon name="x" size={18} />
        </button>

        <div className="mb-4 flex flex-wrap items-center justify-between gap-2 pr-10">
          <div>
            <div className="font-bold">#{order.code}</div>
            <span className="text-sm text-muted">{t('track.orderedOn')} {fmtDate(order.created_at, lang)}</span>
          </div>
          <span className={cx('rounded-full px-3 py-1 text-xs font-semibold', orderStatusCls[order.status])}>
            {t(`orders.status.${order.status}`)}
          </span>
        </div>

        {cancelled ? (
          <div className="rounded-xl bg-zinc-500/10 p-4 text-center text-muted">
            {t(`orders.status.${order.status}`)}
            {order.cancel_reason && <div className="mt-1 text-sm">"{order.cancel_reason}"</div>}
          </div>
        ) : (
          <ol className="relative ml-2">
            {VISIBLE_FLOW.map((st, i) => (
              <li key={st} className="relative pb-7 pl-8 last:pb-0">
                <span className={cx('absolute left-0 top-1 h-4 w-4 rounded-full ring-4 ring-surface',
                  i < idx ? 'bg-emerald-500' : i === idx ? 'bg-brand-600' : 'bg-line')} />
                {i < VISIBLE_FLOW.length - 1 && (
                  <span className={cx('absolute left-[7px] top-5 h-full w-0.5', i < idx ? 'bg-emerald-500' : 'bg-line')} />
                )}
                <b className={cx(i > idx && 'text-muted')}>{t(`orders.status.${st}`)}</b>
              </li>
            ))}
          </ol>
        )}

        {order.tracking_no && (
          <div className="mt-4 flex flex-wrap items-center gap-x-6 gap-y-1 rounded-xl border border-line bg-surface2 p-4 text-sm">
            <div><span className="text-muted">{t('orders.courier')}: </span><b>{order.courier || '-'}</b></div>
            <div><span className="text-muted">{t('orders.tracking')}: </span><b className="nums">{order.tracking_no}</b></div>
          </div>
        )}

        {order.ship_address && (
          <div className="mt-4 rounded-xl border border-line bg-surface2 p-4 text-sm">
            <div className="font-semibold">{order.ship_name} · {order.ship_phone}</div>
            <div className="text-muted">{order.ship_address}</div>
          </div>
        )}

        <div className="mt-4 border-t border-line pt-4">
          <h3 className="mb-3 font-bold">{t('checkout.yourOrder')}</h3>
          {(order.order_items || []).map((it) => (
            <div key={it.id} className="flex justify-between gap-2 py-1.5 text-sm text-muted">
              <span className="truncate">{it.name} ×{it.qty}</span>
              <span className="nums shrink-0 text-fg">฿{fmt(it.price * it.qty)}</span>
            </div>
          ))}
          <div className="mt-2 flex justify-between border-t border-line pt-3 text-lg font-bold">
            <span>{t('cart.total')}</span>
            <b className="nums text-brand-600">฿{fmt(order.total)}</b>
          </div>
        </div>

        {canCancel && (
          <button onClick={onCancelClick}
            className="mt-4 inline-flex w-full items-center justify-center gap-1.5 rounded-lg border border-line px-4 py-2 text-sm font-semibold text-brand-600 transition-colors hover:bg-brand-50 dark:hover:bg-brand-600/10 cursor-pointer">
            <Icon name="x" size={15} />
            {order.status === 'pending' ? t('orders.cancelBtn') : t('orders.cancelReqBtn')}
          </button>
        )}
      </div>
    </div>
  )
}

function CancelDialog({ order, onCancel, onClose, t }) {
  const [reason, setReason] = useState('')
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState('')
  const isPaid = order.status !== 'pending'
  const submit = async () => {
    setBusy(true); setErr('')
    try { await onCancel(reason.trim() || undefined) } catch (e) { setErr(e.message || t('common.error')); setBusy(false) }
  }
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4" role="dialog" aria-modal="true">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative z-10 w-full max-w-[420px] rounded-2xl border border-line bg-surface p-6 shadow-2xl">
        <h3 className="text-lg font-bold">{t('orders.cancelTitle')} #{order.code}</h3>
        <p className="mt-1.5 text-sm text-muted">{isPaid ? t('orders.cancelPaidNote') : t('orders.cancelPendingNote')}</p>
        <textarea value={reason} onChange={(e) => setReason(e.target.value)} rows={3} placeholder={t('orders.cancelReasonPh')}
          className="mt-3 w-full rounded-lg border border-line bg-surface px-3 py-2.5 text-sm focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20" />
        {err && <div className="mt-2 rounded-lg bg-red-500/10 px-3 py-2 text-sm text-red-600">{err}</div>}
        <div className="mt-4 flex gap-2">
          <button disabled={busy} onClick={submit}
            className="flex-1 rounded-xl bg-brand-600 py-2.5 font-semibold text-white hover:bg-brand-700 disabled:opacity-60 cursor-pointer">
            {busy ? t('common.loading') : t('orders.cancelConfirm')}
          </button>
          <button disabled={busy} onClick={onClose}
            className="flex-1 rounded-xl border border-line py-2.5 font-semibold hover:bg-surface2 cursor-pointer">
            {t('orders.cancelKeep')}
          </button>
        </div>
      </div>
    </div>
  )
}
