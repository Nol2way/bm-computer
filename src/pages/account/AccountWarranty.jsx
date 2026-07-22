import { useEffect, useState } from 'react'
import { Icon } from '../../components/Icons'
import { cx } from '../../lib/ui'
import { useLang } from '../../i18n/LanguageContext'
import { useAuth } from '../../auth/AuthContext'
import { fetchMyOrders } from '../../lib/api'
import { warrantyApi } from '../../lib/warrantyApi'
import { useFetch } from '../../lib/useFetch'
import { CardListSkeleton } from './ui'

const ELIGIBLE_ORDER_STATUS = new Set(['paid', 'packing', 'shipping', 'done'])

export default function AccountWarranty() {
  const { t } = useLang()
  const { user } = useAuth()
  const { data: ordersRes, loading: ordersLoading } = useFetch(() => (user ? fetchMyOrders(user.id) : Promise.resolve([])), [user?.id])
  const [claims, setClaims] = useState([])
  const [claimsLoading, setClaimsLoading] = useState(true)
  const [claimForm, setClaimForm] = useState(null)
  const [uploadedFile, setUploadedFile] = useState(null)
  const [submitting, setSubmitting] = useState(false)
  const [err, setErr] = useState('')

  const orders = Array.isArray(ordersRes) ? ordersRes : []

  const loadClaims = () => {
    setClaimsLoading(true)
    warrantyApi.listClaims().then((r) => setClaims(r.items || [])).catch((e) => setErr(e.message)).finally(() => setClaimsLoading(false))
  }
  useEffect(() => { loadClaims() }, [])

  const claimedItemIds = new Set(claims.map((c) => c.order_item_id).filter(Boolean))
  const claimableItems = orders
    .filter((o) => ELIGIBLE_ORDER_STATUS.has(o.status))
    .flatMap((o) => (o.order_items || []).map((it) => ({ ...it, order_id: o.id, order_code: o.code })))
    .filter((it) => !claimedItemIds.has(it.id))

  const handleClaimSubmit = async (e) => {
    e.preventDefault()
    setErr('')
    if (!claimForm.itemKey || !claimForm.reason || !uploadedFile) {
      setErr(t('warranty.fillRequired'))
      return
    }
    const item = claimableItems.find((it) => it.id === claimForm.itemKey)
    if (!item) return
    setSubmitting(true)
    try {
      await warrantyApi.submitClaim({ order_id: item.order_id, order_item_id: item.id, reason: claimForm.reason, evidence: uploadedFile })
      setClaimForm(null)
      setUploadedFile(null)
      loadClaims()
    } catch (e) {
      setErr(e.message)
    } finally {
      setSubmitting(false)
    }
  }

  const loading = ordersLoading || claimsLoading

  return (
    <div>
      <h2 className="text-2xl font-bold mb-6">{t('account.warranty')}</h2>

      {loading ? (
        <CardListSkeleton count={2} />
      ) : claims.length === 0 ? (
        <div className="rounded-2xl border border-line bg-surface p-10 text-center">
          <div className="mx-auto mb-4 grid h-16 w-16 place-items-center rounded-full bg-surface2">
            <Icon name="shield" size={28} className="text-muted" />
          </div>
          <p className="text-muted">{t('warranty.noClaims')}</p>
        </div>
      ) : (
        <div className="space-y-4">
          {claims.map((claim) => (
            <div key={claim.id} className="rounded-xl border border-line bg-surface p-5">
              <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
                <div>
                  <h3 className="font-semibold">{claim.product_name}</h3>
                  <p className="text-sm text-muted">{claim.order_code}</p>
                </div>
                <span className={cx('rounded-full px-3 py-1 text-xs font-semibold',
                  claim.status === 'approved' || claim.status === 'processed' ? 'bg-emerald-500/15 text-emerald-600' :
                  claim.status === 'rejected' ? 'bg-red-500/15 text-red-600' :
                  'bg-amber-500/15 text-amber-600'
                )}>
                  {t(`warranty.status.${claim.status}`)}
                </span>
              </div>
              <p className="text-sm text-muted">{claim.reason}</p>
              {claim.admin_notes && (
                <div className="mt-3 rounded-lg bg-surface2 p-3 text-sm">
                  <b className="text-sm">{t('warranty.adminNotes')}:</b>
                  <p className="mt-1 text-muted">{claim.admin_notes}</p>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {!loading && !claimForm && (
        <div className="mt-6 text-center">
          <p className="mb-4 text-sm text-muted">{t('warranty.startClaimInfo')}</p>
          <button
            onClick={() => setClaimForm({ itemKey: '', reason: '' })}
            disabled={claimableItems.length === 0}
            className="rounded-lg bg-brand-600 px-6 py-2.5 font-semibold text-white hover:bg-brand-700 disabled:cursor-not-allowed disabled:opacity-50 cursor-pointer"
          >
            {t('warranty.submitClaim')}
          </button>
          {claimableItems.length === 0 && <p className="mt-2 text-xs text-muted">{t('warranty.noEligibleOrders')}</p>}
        </div>
      )}

      {claimForm && (
        <div className="mt-6 rounded-2xl border border-line bg-surface p-6">
          <h3 className="mb-4 text-lg font-bold">{t('warranty.newClaim')}</h3>
          <form onSubmit={handleClaimSubmit} className="space-y-4">
            <div>
              <label className="mb-1.5 block text-sm font-semibold">{t('warranty.selectOrder')}</label>
              <select
                value={claimForm.itemKey}
                onChange={(e) => setClaimForm({ ...claimForm, itemKey: e.target.value })}
                className="w-full rounded-lg border border-line bg-surface px-3 py-2 text-sm focus:border-brand-500 focus:outline-none"
              >
                <option value="">{t('warranty.choosePh')}</option>
                {claimableItems.map((it) => (
                  <option key={it.id} value={it.id}>{it.name} · {it.order_code}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-semibold">{t('warranty.claimReason')}</label>
              <textarea
                value={claimForm.reason}
                onChange={(e) => setClaimForm({ ...claimForm, reason: e.target.value })}
                rows={4}
                placeholder={t('warranty.reasonPlaceholder')}
                className="w-full rounded-lg border border-line bg-surface px-3 py-2.5 text-sm focus:border-brand-500 focus:outline-none"
                maxLength={500}
              />
              <div className="mt-1 text-xs text-muted">{claimForm.reason.length}/500</div>
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-semibold">{t('warranty.uploadEvidence')}</label>
              <div className="rounded-lg border-2 border-dashed border-line p-6 text-center">
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => setUploadedFile(e.target.files?.[0] || null)}
                  className="hidden"
                  id="file-input"
                />
                <label htmlFor="file-input" className="cursor-pointer">
                  <Icon name="image" size={24} className="mx-auto mb-2 text-muted" />
                  <p className="text-sm font-semibold">{uploadedFile ? uploadedFile.name : t('warranty.uploadPlaceholder')}</p>
                  <p className="text-xs text-muted">{t('warranty.uploadHint')}</p>
                </label>
              </div>
            </div>

            {err && <p className="text-sm text-red-600">{err}</p>}

            <div className="flex gap-2 pt-4">
              <button
                type="button"
                onClick={() => { setClaimForm(null); setUploadedFile(null); setErr('') }}
                disabled={submitting}
                className="flex-1 rounded-lg border border-line px-4 py-2.5 font-semibold hover:bg-surface2 cursor-pointer disabled:opacity-60"
              >
                {t('common.cancel')}
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="flex-1 rounded-lg bg-brand-600 px-4 py-2.5 font-semibold text-white hover:bg-brand-700 cursor-pointer disabled:opacity-60"
              >
                {submitting ? t('common.loading') : t('warranty.submitClaim')}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  )
}
