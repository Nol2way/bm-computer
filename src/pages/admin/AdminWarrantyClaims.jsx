import { useState, useMemo } from 'react'
import { Icon } from '../../components/Icons'
import { cx } from '../../lib/ui'
import { useLang } from '../../i18n/LanguageContext'
import { useFetch } from '../../lib/useFetch'
import { TableSkeleton } from '../../components/Skeleton'
import { adminWarrantyApi } from '../../lib/warrantyApi'

const input = 'w-full rounded-lg border border-line bg-surface px-3 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20'

export default function AdminWarrantyClaims() {
  const { t } = useLang()
  const { data, loading, refetch } = useFetch(() => adminWarrantyApi.listAllClaims(), [])
  const claims = data?.items || []

  const [filter, setFilter] = useState('all')
  const [selectedClaim, setSelectedClaim] = useState(null)

  const rows = useMemo(() => {
    if (filter === 'all') return claims
    return claims.filter((c) => c.status === filter)
  }, [claims, filter])

  const statusColors = {
    pending: 'bg-amber-500/15 text-amber-600 dark:text-amber-400',
    approved: 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400',
    rejected: 'bg-red-500/15 text-red-600 dark:text-red-400',
    processed: 'bg-blue-500/15 text-blue-600 dark:text-blue-400',
  }

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <h3 className="font-bold">{t('admin.warrantyClaimsTitle')} ({rows.length})</h3>
      </div>

      {/* Filter tabs */}
      <div className="mb-4 flex flex-wrap gap-2 border-b border-line pb-3">
        {[
          ['all', t('admin.orderFilterAll')],
          ['pending', t('warranty.status.pending')],
          ['approved', t('warranty.status.approved')],
          ['rejected', t('warranty.status.rejected')],
          ['processed', t('warranty.status.processed')],
        ].map(([status, label]) => (
          <button
            key={status}
            onClick={() => setFilter(status)}
            className={cx(
              'rounded-full px-3 py-1.5 text-sm font-semibold transition-colors cursor-pointer',
              filter === status
                ? 'bg-brand-600 text-white'
                : 'bg-surface2 text-muted hover:bg-surface2/80'
            )}
          >
            {label}
          </button>
        ))}
      </div>

      {loading ? (
        <TableSkeleton rows={6} cols={5} />
      ) : rows.length === 0 ? (
        <div className="rounded-xl border border-line bg-surface p-8 text-center text-sm text-muted">
          {t('admin.noClaims')}
        </div>
      ) : (
        <div className="space-y-3">
          {rows.map((claim) => (
            <div
              key={claim.id}
              onClick={() => setSelectedClaim(claim)}
              className="cursor-pointer rounded-xl border border-line bg-surface p-4 transition-colors hover:bg-surface2"
            >
              <div className="flex flex-wrap items-start justify-between gap-3 mb-2">
                <div className="min-w-0">
                  <div className="font-semibold">{claim.product_name}</div>
                  <div className="text-xs text-muted">
                    Order: {claim.order_code} · User: {claim.user_name || claim.user_email}
                  </div>
                </div>
                <span className={cx('rounded-full px-2.5 py-1 text-xs font-semibold whitespace-nowrap', statusColors[claim.status])}>
                  {t(`warranty.status.${claim.status}`)}
                </span>
              </div>
              <p className="line-clamp-2 text-sm text-muted">{claim.reason}</p>
            </div>
          ))}
        </div>
      )}

      {/* Claim detail modal */}
      {selectedClaim && (
        <ClaimDetailModal claim={selectedClaim} onClose={() => setSelectedClaim(null)} onSaved={refetch} t={t} />
      )}
    </div>
  )
}

function ClaimDetailModal({ claim, onClose, onSaved, t }) {
  const [status, setStatus] = useState(claim.status)
  const [notes, setNotes] = useState(claim.admin_notes || '')
  const [saving, setSaving] = useState(false)

  const handleSave = async () => {
    setSaving(true)
    try {
      await adminWarrantyApi.updateClaim(claim.id, { status, admin_notes: notes })
      onSaved()
      onClose()
    } catch (e) {
      alert(`${t('common.error')}: ${e.message}`)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center overflow-y-auto bg-black/60 p-4 backdrop-blur-sm">
      <div className="my-6 w-full max-w-2xl rounded-2xl border border-line bg-surface p-6 shadow-2xl">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-lg font-bold">{t('admin.claimDetail')}</h3>
          <button onClick={onClose} className="grid h-9 w-9 place-items-center rounded-lg hover:bg-surface2 cursor-pointer">
            <Icon name="x" />
          </button>
        </div>

        <div className="mb-6 space-y-4 rounded-lg bg-surface2 p-4">
          <div>
            <div className="text-xs font-semibold text-muted">{t('admin.product')}</div>
            <div className="mt-1 font-semibold">{claim.product_name}</div>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <div className="text-xs font-semibold text-muted">{t('admin.order')}</div>
              <div className="mt-1 font-semibold">{claim.order_code}</div>
            </div>
            <div>
              <div className="text-xs font-semibold text-muted">{t('admin.customer')}</div>
              <div className="mt-1">
                <div className="font-semibold">{claim.user_name || claim.user_email}</div>
                <div className="text-sm text-muted">{claim.user_email}</div>
              </div>
            </div>
          </div>
          <div>
            <div className="text-xs font-semibold text-muted">{t('warranty.claimReason')}</div>
            <div className="mt-1 text-sm text-muted">{claim.reason}</div>
          </div>
          {claim.evidence_url && (
            <div>
              <div className="text-xs font-semibold text-muted">{t('warranty.uploadEvidence')}</div>
              <img src={claim.evidence_url} alt="Evidence" className="mt-2 max-h-[200px] rounded-lg border border-line" />
            </div>
          )}
        </div>

        <div className="mb-4 space-y-3">
          <div>
            <label className="mb-1.5 block text-sm font-semibold">{t('admin.status')}</label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className={input}
            >
              <option value="pending">{t('warranty.status.pending')}</option>
              <option value="approved">{t('warranty.status.approved')}</option>
              <option value="rejected">{t('warranty.status.rejected')}</option>
              <option value="processed">{t('warranty.status.processed')}</option>
            </select>
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-semibold">{t('warranty.adminNotes')}</label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={4}
              placeholder={t('admin.notesPh')}
              className={input}
              maxLength={500}
            />
            <div className="mt-1 text-xs text-muted">{notes.length}/500</div>
          </div>
        </div>

        <div className="flex gap-2">
          <button
            type="button"
            onClick={onClose}
            disabled={saving}
            className="flex-1 rounded-lg border border-line px-4 py-2.5 font-semibold hover:bg-surface2 cursor-pointer disabled:opacity-60"
          >
            {t('admin.cancel')}
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex-1 rounded-lg bg-brand-600 px-4 py-2.5 font-semibold text-white hover:bg-brand-700 cursor-pointer disabled:opacity-60"
          >
            {saving ? t('common.loading') : t('admin.save')}
          </button>
        </div>
      </div>
    </div>
  )
}
