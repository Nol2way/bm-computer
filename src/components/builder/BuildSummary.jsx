import { fmt } from '../../data/mock'
import { Icon } from '../Icons'
import { cx } from '../../lib/ui'

const input = 'w-full rounded-lg border border-line bg-surface px-3 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20'

export default function BuildSummary({
  t, loading, readOnly, name, setName, budget, setBudget,
  totals, totalW, recW, psuState, perf, issues, compat,
  addedAll, onAddAll, saving, savedFlash, onSave, onShare,
}) {
  if (loading) {
    return (
      <aside className="rounded-2xl border border-line bg-surface p-5 lg:sticky lg:top-[150px]">
        {[...Array(6)].map((_, i) => <div key={i} className="skeleton mb-3 h-5 rounded" aria-hidden="true" />)}
      </aside>
    )
  }

  const budgetNum = Number(budget) || 0
  const over = budgetNum > 0 && totals.total > budgetNum
  const psuLabel = psuState && {
    good: t('builder.psuGood'), recommended: t('builder.psuRecommended'),
    overkill: t('builder.psuOverkill'), not_enough: t('builder.psuNotEnough'),
  }[psuState]
  const visibleIssues = issues.filter((i) => i.level !== 'info')

  return (
    <aside className="rounded-2xl border border-line bg-surface p-5 lg:sticky lg:top-[150px]">
      <h3 className="mb-3 font-bold">{t('builder.summary')}</h3>

      {!readOnly && (
        <input className={`${input} mb-3`} value={name} onChange={(e) => setName(e.target.value)}
          placeholder={t('builder.buildNamePh')} maxLength={60} />
      )}

      <Line l={t('builder.chosen')} v={`${totals.count} ${t('builder.pieces')}`} />
      <Line l={t('builder.estPower')} v={totalW ? `~${totalW} ${t('builder.watt')}` : '-'} />
      <Line l={t('builder.recPsu')} v={recW ? `≥ ${recW} ${t('builder.watt')}` : '-'} />
      {psuLabel && (
        <div className={cx('mb-1 flex items-center justify-end gap-1 text-xs font-semibold',
          psuState === 'not_enough' ? 'text-red-500' : psuState === 'overkill' ? 'text-amber-500' : 'text-emerald-600')}>
          <Icon name="bolt" size={13} /> {psuLabel}
        </div>
      )}

      {/* งบประมาณ */}
      <div className="mt-2 border-t border-line pt-3">
        <label className="mb-1.5 block text-sm font-semibold">{t('builder.budget')}</label>
        <input className={input} type="number" min="0" value={budget} disabled={readOnly}
          onChange={(e) => setBudget(e.target.value)} placeholder={t('builder.budgetPh')} />
        {budgetNum > 0 && (
          <>
            <div className="mt-2 h-2 overflow-hidden rounded-full bg-surface2">
              <div className={cx('h-full rounded-full transition-all', over ? 'bg-red-500' : 'bg-emerald-500')}
                style={{ width: `${Math.min(100, (totals.total / budgetNum) * 100)}%` }} />
            </div>
            <div className={cx('nums mt-1 text-right text-xs font-semibold', over ? 'text-red-500' : 'text-emerald-600')}>
              {over ? `${t('builder.budgetOver')} ฿${fmt(totals.total - budgetNum)}` : `${t('builder.budgetLeft')} ฿${fmt(budgetNum - totals.total)}`}
            </div>
          </>
        )}
      </div>

      {/* ความเข้ากันได้ + สต็อก */}
      <div className="mt-2 border-t border-line pt-3">
        <div className={cx('flex items-center gap-1.5 text-sm font-semibold',
          compat.status === 'fail' ? 'text-red-500' : compat.status === 'warn' ? 'text-amber-500' : 'text-emerald-600')}>
          <Icon name={compat.status === 'ok' ? 'check' : compat.status === 'warn' ? 'shield' : 'x'} size={16} />
          {compat.status === 'fail' ? t('builder.compatFailN', { n: compat.fails })
            : compat.status === 'warn' ? t('builder.compatWarnN', { n: compat.warns })
            : t('builder.compatOk')}
        </div>
        {visibleIssues.length > 0 && (
          <ul className="mt-1.5 flex flex-col gap-1">
            {visibleIssues.map((i, idx) => (
              <li key={idx} className={cx('flex items-start gap-1.5 text-xs', i.level === 'fail' ? 'text-red-500' : 'text-amber-500')}>
                <Icon name={i.level === 'fail' ? 'x' : 'shield'} size={12} className="mt-0.5 shrink-0" />
                {t(`builder.rule.${i.code}`, i.params)}
              </li>
            ))}
          </ul>
        )}
        <div className={cx('mt-1.5 flex items-center gap-1.5 text-xs font-semibold', totals.outOfStock ? 'text-red-500' : 'text-emerald-600')}>
          <Icon name="truck" size={13} />
          {totals.outOfStock ? t('builder.stockOutN', { n: totals.outOfStock }) : totals.count > 0 ? t('builder.stockAllOk') : '-'}
        </div>
      </div>

      {/* ประสิทธิภาพ (เมื่อมีข้อมูล score) */}
      {perf && (
        <div className="mt-2 border-t border-line pt-3">
          <div className="mb-1 text-sm font-semibold">{t('builder.perfTitle')}</div>
          <Stars label="1080p" n={perf.p1080} />
          <Stars label="1440p" n={perf.p1440} />
          <Stars label="4K" n={perf.p4k} />
        </div>
      )}

      <div className="mt-3 flex items-center justify-between border-t border-line pt-4 text-lg font-bold">
        <span>{t('builder.total')}</span>
        <b className="nums text-brand-600">฿{fmt(totals.total)}</b>
      </div>

      <button onClick={onAddAll} disabled={!totals.count}
        className={cx('mt-4 flex w-full items-center justify-center gap-2 rounded-xl py-3 font-semibold text-white transition-colors disabled:opacity-50 cursor-pointer',
          addedAll ? 'bg-emerald-600' : 'bg-brand-600 hover:bg-brand-700')}>
        <Icon name={addedAll ? 'check' : 'cart'} size={17} /> {addedAll ? t('builder.addedAll') : t('builder.addAll')}
      </button>

      {!readOnly && (
        <div className="mt-2 grid grid-cols-2 gap-2">
          <button onClick={onSave} disabled={saving || !totals.count}
            className="flex items-center justify-center gap-1.5 rounded-xl border border-line py-2.5 text-sm font-semibold transition-colors hover:bg-surface2 disabled:opacity-40 cursor-pointer">
            <Icon name={savedFlash ? 'check' : 'save'} size={15} />
            {saving ? t('builder.saving') : savedFlash ? t('builder.saved') : t('builder.saveBuild')}
          </button>
          <button onClick={onShare} disabled={saving || !totals.count}
            className="flex items-center justify-center gap-1.5 rounded-xl border border-line py-2.5 text-sm font-semibold transition-colors hover:bg-surface2 disabled:opacity-40 cursor-pointer">
            <Icon name="share" size={15} /> {t('builder.share')}
          </button>
        </div>
      )}
    </aside>
  )
}

function Line({ l, v }) {
  return <div className="flex justify-between py-1 text-sm text-muted"><span>{l}</span><span className="nums font-semibold text-fg">{v}</span></div>
}

function Stars({ label, n }) {
  return (
    <div className="flex items-center justify-between py-0.5 text-sm">
      <span className="text-muted">{label}</span>
      <span className="text-amber-500">{'★'.repeat(n)}<span className="text-line">{'★'.repeat(5 - n)}</span></span>
    </div>
  )
}
