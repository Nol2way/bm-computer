import { useEffect, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { fmt } from '../../data/mock'
import { Icon } from '../../components/Icons'
import { useLang } from '../../i18n/LanguageContext'
import { fetchOrderByCode, fetchSetting, confirmOrderTaxInvoiceProfile } from '../../lib/api'
import { accountApi } from '../../lib/accountApi'
import { useFetch } from '../../lib/useFetch'
import { Skeleton, TextLinesSkeleton } from '../../components/Skeleton'
import { PageHead, EmptyState, PrimaryBtn, GhostBtn } from './ui'
import { cx } from '../../lib/ui'

const ELIGIBLE = new Set(['paid', 'packing', 'shipping', 'done'])
const VAT_RATE = 0.07

export default function AccountInvoice() {
  const { t, lang } = useLang()
  const [params] = useSearchParams()
  const code = params.get('order')
  const { data: order, loading: orderLoading } = useFetch(() => fetchOrderByCode(code), [code])
  const { data: shop, loading: shopLoading } = useFetch(() => fetchSetting('shop'), [])
  const { data: profilesRes, loading: profilesLoading } = useFetch(() => accountApi.listTax(), [])
  const profiles = profilesRes?.items || []
  const [profileId, setProfileId] = useState('')
  const [confirmed, setConfirmed] = useState(false)
  const [confirming, setConfirming] = useState(false)

  useEffect(() => {
    if (!profiles?.length || confirmed) return
    const def = profiles.find((p) => p.is_default) || profiles[0]
    setProfileId(String(def.id))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [profilesRes])

  // กันกดยืนยันซ้ำได้หลัง reload หน้า: อ่านสถานะยืนยันจากออเดอร์ใน DB โดยตรง (ล็อกจริงฝั่ง server ไม่ใช่แค่เบราว์เซอร์เดียว)
  useEffect(() => {
    if (!order?.tax_invoice_confirmed_profile_id) return
    setProfileId(order.tax_invoice_confirmed_profile_id)
    setConfirmed(true)
  }, [order?.tax_invoice_confirmed_profile_id])

  const handleConfirm = async () => {
    if (!order || !profileId) return
    setConfirming(true)
    try {
      const res = await confirmOrderTaxInvoiceProfile(order.id, profileId)
      setProfileId(res.profile_id)
      setConfirmed(true)
    } catch (e) {
      alert(e.message)
    } finally {
      setConfirming(false)
    }
  }

  const loading = orderLoading || shopLoading || profilesLoading
  const fmtDate = (d) => new Date(d).toLocaleDateString(lang === 'th' ? 'th-TH' : 'en-US', { dateStyle: 'medium' })

  if (loading) return (
    <div aria-hidden="true">
      <Skeleton className="mb-5 h-6 w-48" />
      <div className="rounded-2xl border border-line bg-surface p-6">
        <TextLinesSkeleton lines={6} />
      </div>
    </div>
  )

  if (!order) return (
    <div>
      <PageHead title={t('invoice.title')} />
      <EmptyState icon="doc" text={t('track.notFound')} />
      <div className="mt-4 flex justify-center">
        <Link to="/account/orders"><PrimaryBtn>{t('track.viewHistory')}</PrimaryBtn></Link>
      </div>
    </div>
  )

  if (!ELIGIBLE.has(order.status)) return (
    <div>
      <PageHead title={t('invoice.title')} />
      <EmptyState icon="doc" text={t('invoice.notEligible')} />
      <div className="mt-4 flex justify-center">
        <Link to={`/account/track?order=${order.code}`}><PrimaryBtn>{t('track.viewHistory')}</PrimaryBtn></Link>
      </div>
    </div>
  )

  const profile = (profiles || []).find((p) => String(p.id) === profileId)
  // ถ้าตอน checkout ผู้ใช้กรอกใบกำกับภาษีไว้ ใช้ snapshot นั้นเป็นค่าเริ่มต้น (ถูกต้องตามช่วงเวลาที่สั่งซื้อ)
  // แต่ยังให้เลือกโปรไฟล์อื่นแทนได้ผ่าน dropdown ด้านบน
  const ti = order.tax_invoice
  const tiAddress = ti && [
    ti.addrNo, ti.building, ti.villageName || (ti.village ? `หมู่ ${ti.village}` : ''),
    ti.lane, ti.soi ? `ซอย${ti.soi}` : '', ti.street, ti.streetNo,
    ti.subDistrict, ti.district, ti.province, ti.postalCode,
  ].filter(Boolean).join(' ')
  const items = order.order_items || []
  const itemsTotal = items.reduce((s, it) => s + it.price * it.qty, 0)
  const shippingFee = Math.max(0, order.total - itemsTotal)
  const subtotalExclVat = Math.round((order.total / (1 + VAT_RATE)) * 100) / 100
  const vat = Math.round((order.total - subtotalExclVat) * 100) / 100

  const buyerName = profile?.name || order.ship_name
  const buyerAddress = profile?.address || tiAddress || order.ship_address
  const buyerTaxId = profile?.tax_id
  const buyerBranch = profile?.branch
  const buyerPhone = profile?.phone || order.ship_phone
  const bookNo = ti?.bookNo
  const invoiceNo = ti?.invoiceNo || order.code

  return (
    <div>
      <PageHead title={t('invoice.title')} action={
        (confirmed || !profiles?.length) && (
          <div className="no-print flex gap-2">
            <GhostBtn onClick={() => window.print()}><Icon name="printer" size={16} />{t('invoice.print')}</GhostBtn>
            <PrimaryBtn onClick={() => window.print()}><Icon name="save" size={16} />{t('invoice.download')}</PrimaryBtn>
          </div>
        )
      } />

      {confirmed ? (
        <div className="no-print mb-4 flex flex-wrap items-center gap-3 rounded-xl border border-line bg-surface p-4 text-sm">
          <Icon name="check" size={18} className="shrink-0 text-emerald-600" />
          <span>{t('invoice.confirmedWith')} <span className="font-semibold">{profile ? `${profile.name} · ${profile.tax_id}` : buyerName}</span></span>
        </div>
      ) : profiles?.length > 0 ? (
          <div className="no-print mb-4 flex flex-wrap items-end gap-3">
            <div>
              <label className="mb-1.5 block text-sm font-semibold">{t('invoice.selectProfile')}</label>
              <select value={profileId} onChange={(e) => setProfileId(e.target.value)}
                className="w-full max-w-sm rounded-lg border border-line bg-surface px-3 py-2.5 text-sm focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20 sm:w-auto">
                {profiles.map((p) => <option key={p.id} value={p.id}>{p.name} · {p.tax_id}</option>)}
              </select>
            </div>
            <PrimaryBtn onClick={handleConfirm} disabled={!profileId || confirming}>
              <Icon name="check" size={16} />{confirming ? t('common.loading') : t('invoice.confirm')}
            </PrimaryBtn>
          </div>
      ) : (
        <div className="no-print mb-4 flex flex-wrap items-center gap-3 rounded-xl border border-dashed border-line bg-surface p-4 text-sm">
          <span className="text-muted">{t('invoice.noProfile')}</span>
          <Link to="/account/tax" className="font-semibold text-brand-600 hover:underline">{t('invoice.addProfile')}</Link>
        </div>
      )}

      {!confirmed && profiles?.length > 0 && (
        <div className="no-print mb-4 rounded-xl border border-dashed border-line bg-surface p-4 text-center text-sm text-muted">
          {t('invoice.confirmHint')}
        </div>
      )}

      <div className="print-area mx-auto flex min-h-[297mm] w-[210mm] max-w-full flex-col rounded-md border border-fg/70 bg-white p-6 text-[13px] text-black sm:p-[12mm]">
        <div className="flex flex-wrap items-start justify-between gap-4 border-b-[3px] border-double border-black pb-4">
          <div className="flex items-center gap-2">
            <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-brand-600 text-white"><Icon name="receipt" size={18} /></span>
            <span className="text-lg font-extrabold">{shop?.name || '-'}</span>
          </div>
          <div className="text-right text-lg font-bold leading-snug">{t('invoice.docType')}</div>
        </div>

        <div className="mt-4 flex flex-wrap gap-x-10 gap-y-2">
          <DocField label={t('invoice.docDate')} value={fmtDate(order.created_at)} />
          {bookNo && <DocField label={t('invoice.bookNo')} value={bookNo} />}
          <DocField label={t('invoice.docNo')} value={invoiceNo} nums />
        </div>

        <div className="mt-4 space-y-2 border-t border-black/30 pt-4">
          <DocField label={t('invoice.sellerName')} value={shop?.name || '-'} full />
          {shop?.address && <DocField label={t('invoice.addressLabel')} value={shop.address} full />}
          <div className="flex flex-wrap gap-x-10 gap-y-2">
            {shop?.tax_id && <DocField label={t('invoice.taxIdLabel')} value={`${shop.tax_id}${shop.branch ? ` · ${shop.branch}` : ''}`} nums />}
            {shop?.phone && <DocField label={t('invoice.phoneLabel')} value={shop.phone} nums />}
          </div>
        </div>

        <div className="mt-4 space-y-2 border-t border-black/30 pt-4">
          <DocField label={t('invoice.buyerName')} value={buyerName} full />
          {buyerAddress && <DocField label={t('invoice.addressLabel')} value={buyerAddress} full />}
          <div className="flex flex-wrap gap-x-10 gap-y-2">
            {buyerTaxId && <DocField label={t('invoice.taxIdLabel')} value={`${buyerTaxId}${buyerBranch ? ` · ${buyerBranch}` : ''}`} nums />}
            {buyerPhone && <DocField label={t('invoice.phoneLabel')} value={buyerPhone} nums />}
          </div>
        </div>

        <div className="mt-5 overflow-x-auto">
          <table className="w-full border-collapse text-[13px]">
            <thead>
              <tr className="bg-black/5">
                <th className="w-10 border border-black/60 py-1.5 px-2 text-center font-semibold">{t('invoice.seq')}</th>
                <th className="border border-black/60 py-1.5 px-2 text-left font-semibold">{t('invoice.itemCol')}</th>
                <th className="w-16 border border-black/60 py-1.5 px-2 text-right font-semibold">{t('invoice.qtyCol')}</th>
                <th className="w-24 border border-black/60 py-1.5 px-2 text-right font-semibold">{t('invoice.priceCol')}</th>
                <th className="w-28 border border-black/60 py-1.5 px-2 text-right font-semibold">{t('invoice.amountCol')}</th>
              </tr>
            </thead>
            <tbody>
              {items.map((it, i) => (
                <tr key={it.id}>
                  <td className="nums border border-black/40 py-1.5 px-2 text-center">{i + 1}</td>
                  <td className="border border-black/40 py-1.5 px-2">{it.name}</td>
                  <td className="nums border border-black/40 py-1.5 px-2 text-right">{it.qty}</td>
                  <td className="nums border border-black/40 py-1.5 px-2 text-right">{fmt(it.price)}</td>
                  <td className="nums border border-black/40 py-1.5 px-2 text-right">{fmt(it.price * it.qty)}</td>
                </tr>
              ))}
              {shippingFee > 0 && (
                <tr>
                  <td className="nums border border-black/40 py-1.5 px-2 text-center">{items.length + 1}</td>
                  <td className="border border-black/40 py-1.5 px-2">{t('invoice.shippingFee')}</td>
                  <td className="nums border border-black/40 py-1.5 px-2 text-right">1</td>
                  <td className="nums border border-black/40 py-1.5 px-2 text-right">{fmt(shippingFee)}</td>
                  <td className="nums border border-black/40 py-1.5 px-2 text-right">{fmt(shippingFee)}</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="mt-auto pt-6">
          <div className="flex justify-end">
            <table className="w-full max-w-xs border-collapse text-[13px]">
              <tbody>
                <tr><td className="border border-black/40 py-1.5 px-2 text-muted">{t('invoice.subtotal')}</td><td className="nums border border-black/40 py-1.5 px-2 text-right">{fmt(subtotalExclVat)}</td></tr>
                <tr><td className="border border-black/40 py-1.5 px-2 text-muted">{t('invoice.vat')}</td><td className="nums border border-black/40 py-1.5 px-2 text-right">{fmt(vat)}</td></tr>
                <tr className="bg-black/5"><td className="border border-black/60 py-1.5 px-2 text-base font-bold">{t('invoice.total')}</td><td className="nums border border-black/60 py-1.5 px-2 text-right text-base font-bold">{fmt(order.total)}</td></tr>
              </tbody>
            </table>
          </div>

          <div className="mt-10 flex flex-wrap justify-end gap-8 text-center text-sm">
            <div>
              <div className="w-40 border-b border-dotted border-black/60 pb-8" />
              <div className="mt-1 text-muted">ผู้รับเงิน / Received by</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

function DocField({ label, value, full, nums }) {
  return (
    <div className={cx('flex items-baseline gap-1.5', full ? 'w-full' : '')}>
      <span className="shrink-0 text-black/70">{label}</span>
      <span className={cx('flex-1 border-b border-dotted border-black/50 px-1 font-semibold', nums && 'nums')}>{value}</span>
    </div>
  )
}
