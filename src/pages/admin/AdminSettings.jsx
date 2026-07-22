import { useState } from 'react'
import { Icon } from '../../components/Icons'
import { fetchSetting, saveSetting } from '../../lib/api'
import { useFetch } from '../../lib/useFetch'
import { promptpayQrUrl } from '../../lib/promptpay'
import { useLang } from '../../i18n/LanguageContext'
import { Skeleton } from '../../components/Skeleton'

const input = 'w-full rounded-lg border border-line bg-surface px-3 py-2.5 text-sm focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20'

export default function AdminSettings() {
  const { data, loading } = useFetch(() => fetchSetting('payment'), [])
  const { data: shopData, loading: shopLoading } = useFetch(() => fetchSetting('shop'), [])
  if (loading || shopLoading) return (
    <div aria-hidden="true">
      <Skeleton className="mb-2 h-5 w-64" />
      <Skeleton className="mb-5 h-4 w-96 max-w-full" />
      <div className="grid gap-5 sm:grid-cols-[1fr_180px]">
        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5"><Skeleton className="h-4 w-48" /><Skeleton className="h-10 w-full rounded-lg" /></div>
          <div className="flex flex-col gap-1.5"><Skeleton className="h-4 w-56" /><Skeleton className="h-10 w-full rounded-lg" /></div>
          <Skeleton className="h-9 w-24 rounded-lg" />
        </div>
        <Skeleton className="h-[170px] rounded-xl" />
      </div>
    </div>
  )
  return (
    <div className="flex flex-col gap-8">
      <Form initial={data || {}} />
      <ShopInfoForm initial={shopData || {}} />
    </div>
  )
}

function ShopInfoForm({ initial }) {
  const { t } = useLang()
  const [f, setF] = useState({
    name: initial.name || '', tax_id: initial.tax_id || '', branch: initial.branch || '',
    address: initial.address || '', phone: initial.phone || '',
  })
  const [saving, setSaving] = useState(false)
  const [msg, setMsg] = useState('')
  const set = (k) => (e) => setF((s) => ({ ...s, [k]: e.target.value }))

  const save = async () => {
    setSaving(true); setMsg('')
    try { await saveSetting('shop', f); setMsg(t('admin.saved')) } catch (e) { setMsg(`${t('admin.errorPrefix')}: ${e.message}`) } finally { setSaving(false); setTimeout(() => setMsg(''), 2500) }
  }

  return (
    <div>
      <h3 className="mb-1 font-bold">{t('admin.shopInfoTitle')}</h3>
      <p className="mb-4 text-sm text-muted">{t('admin.shopInfoDesc')}</p>
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="mb-1.5 block text-sm font-semibold">{t('admin.shopName')}</label>
          <input className={input} value={f.name} onChange={set('name')} placeholder="BM Computer" />
        </div>
        <div>
          <label className="mb-1.5 block text-sm font-semibold">{t('admin.shopTaxId')}</label>
          <input className={input} value={f.tax_id} onChange={set('tax_id')} inputMode="numeric" maxLength={13} />
        </div>
        <div>
          <label className="mb-1.5 block text-sm font-semibold">{t('admin.shopBranch')}</label>
          <input className={input} value={f.branch} onChange={set('branch')} />
        </div>
        <div>
          <label className="mb-1.5 block text-sm font-semibold">{t('admin.shopPhone')}</label>
          <input className={input} value={f.phone} onChange={set('phone')} inputMode="tel" />
        </div>
        <div className="sm:col-span-2">
          <label className="mb-1.5 block text-sm font-semibold">{t('admin.shopAddress')}</label>
          <textarea className={input} rows={2} value={f.address} onChange={set('address')} />
        </div>
      </div>
      <div className="mt-4 flex items-center gap-3">
        <button onClick={save} disabled={saving} className="rounded-lg bg-brand-600 px-5 py-2 text-sm font-semibold text-white hover:bg-brand-700 disabled:opacity-60 cursor-pointer">{saving ? t('admin.saving') : t('admin.save')}</button>
        {msg && <span className="text-sm text-emerald-600">{msg}</span>}
      </div>
    </div>
  )
}

function Form({ initial }) {
  const { t } = useLang()
  const [f, setF] = useState({ promptpay_id: initial.promptpay_id || '', name: initial.name || '' })
  const [saving, setSaving] = useState(false)
  const [msg, setMsg] = useState('')
  const set = (k) => (e) => setF((s) => ({ ...s, [k]: e.target.value }))
  const preview = promptpayQrUrl(f.promptpay_id, 0, 180)

  const save = async () => {
    setSaving(true); setMsg('')
    try { await saveSetting('payment', f); setMsg(t('admin.saved')) } catch (e) { setMsg(`${t('admin.errorPrefix')}: ${e.message}`) } finally { setSaving(false); setTimeout(() => setMsg(''), 2500) }
  }

  return (
    <div>
      <h3 className="mb-1 font-bold">{t('admin.paymentTitle')}</h3>
      <p className="mb-4 text-sm text-muted">{t('admin.paymentDesc')}</p>

      <div className="grid gap-5 sm:grid-cols-[1fr_180px]">
        <div className="flex flex-col gap-4">
          <div>
            <label className="mb-1.5 block text-sm font-semibold">{t('admin.promptpayId')}</label>
            <input className={input} value={f.promptpay_id} onChange={set('promptpay_id')} inputMode="numeric" placeholder="0801234567" />
            <span className="mt-1 block text-xs text-muted">{t('admin.promptpayHint')}</span>
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-semibold">{t('admin.accountName')}</label>
            <input className={input} value={f.name} onChange={set('name')} placeholder="BM Computer" />
          </div>
          <div className="flex items-center gap-3">
            <button onClick={save} disabled={saving} className="rounded-lg bg-brand-600 px-5 py-2 text-sm font-semibold text-white hover:bg-brand-700 disabled:opacity-60 cursor-pointer">{saving ? t('admin.saving') : t('admin.save')}</button>
            {msg && <span className="text-sm text-emerald-600">{msg}</span>}
          </div>
        </div>

        <div className="rounded-xl border border-line bg-white p-3 text-center">
          {preview
            ? <img src={preview} alt="QR preview" className="mx-auto h-[130px] w-[130px]" />
            : <div className="grid h-[130px] place-items-center text-zinc-400"><Icon name="qr" size={40} /></div>}
          <div className="mt-1 text-xs text-zinc-500">{t('admin.qrPreview')}</div>
        </div>
      </div>
    </div>
  )
}
