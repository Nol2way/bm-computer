import { useMemo, useState } from 'react'
import { fmt } from '../../data/mock'
import { Icon } from '../Icons'
import { cx } from '../../lib/ui'
import { splitCandidates, slotByKey } from '../../lib/pcbuilder/compat'

const input = 'rounded-lg border border-line bg-surface px-3 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20'

// ค้นหาแบบง่าย: คำใน query ทุกคำต้องอยู่ในชื่อ/แบรนด์ (case-insensitive)
const match = (p, q) => {
  const hay = `${p.name} ${p.brand || ''}`.toLowerCase()
  return q.toLowerCase().split(/\s+/).filter(Boolean).every((w) => hay.includes(w))
}

// แปลงค่า attr ให้อ่านได้ (ใช้ label จาก attribute_defs - ไม่ hardcode)
function attrChips(p, defs, lang, max = 3) {
  const chips = []
  for (const d of defs) {
    const v = p.attrs?.[d.key]
    if (v === undefined || v === null || v === '' || !d.show_in_specs) continue
    let text
    if (Array.isArray(v)) text = v.join('/')
    else if (typeof v === 'boolean') text = v ? (lang === 'th' ? d.label_th : d.label_en) : null
    else text = `${v}${d.unit || ''}`
    if (text === null) continue
    chips.push(typeof v === 'boolean' ? text : `${lang === 'th' ? d.label_th : d.label_en}: ${text}`)
    if (chips.length >= max) break
  }
  return chips
}

export default function PartPicker({ slotKey, candidates, items, byId, defs, t, lang, onSelect, onClose }) {
  const [q, setQ] = useState('')
  const [sort, setSort] = useState('priceAsc')
  const [showBlocked, setShowBlocked] = useState(false)
  const slot = slotByKey[slotKey]
  const slotDefs = useMemo(() => defs.filter((d) => d.cat === slot.cat).sort((a, b) => a.sort - b.sort), [defs, slot.cat])

  const groups = useMemo(() => {
    const filtered = candidates.filter((p) => !q || match(p, q))
    const sorted = [...filtered].sort((a, b) =>
      sort === 'priceAsc' ? a.price - b.price : sort === 'priceDesc' ? b.price - a.price : (b.rating || 0) - (a.rating || 0))
    return splitCandidates(slotKey, sorted, items, byId)
  }, [candidates, q, sort, slotKey, items, byId])

  const Row = ({ p, issues, blocked }) => (
    <div className={cx('flex items-center gap-3 rounded-xl border border-line p-3', blocked && 'opacity-55')}>
      <img src={p.images?.[0] || 'https://placehold.co/80x80/f1f1f4/9ca3af?text=BM'} alt=""
        loading="lazy" className="h-14 w-14 shrink-0 rounded-lg bg-white object-contain p-1" />
      <div className="min-w-0 flex-1">
        <div className="line-clamp-1 text-sm font-semibold">{p.name}</div>
        <div className="mt-0.5 flex flex-wrap items-center gap-1.5">
          {attrChips(p, slotDefs, lang).map((c, i) => (
            <span key={i} className="rounded-full bg-surface2 px-2 py-0.5 text-[11px] text-muted">{c}</span>
          ))}
        </div>
        {issues?.length > 0 && (
          <div className={cx('mt-1 text-xs font-medium', blocked ? 'text-red-500' : 'text-amber-500')}>
            {issues.map((i) => t(`builder.rule.${i.code}`, i.params)).join(' · ')}
          </div>
        )}
      </div>
      <div className="flex shrink-0 flex-col items-end gap-1.5">
        <span className="nums text-sm font-bold text-brand-600">฿{fmt(p.price)}</span>
        <span className={cx('text-[11px] font-semibold', p.stock <= 0 ? 'text-red-500' : p.stock <= 5 ? 'text-amber-500' : 'text-emerald-600')}>
          {p.stock <= 0 ? t('builder.outOfStock') : p.stock <= 5 ? t('common.lowStock', { n: p.stock }) : t('common.inStock')}
        </span>
        <button onClick={() => onSelect(p)} disabled={blocked || p.stock <= 0}
          className="rounded-lg bg-brand-600 px-3 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-brand-700 disabled:cursor-not-allowed disabled:opacity-40 cursor-pointer">
          {t('builder.select')}
        </button>
      </div>
    </div>
  )

  const Group = ({ title, tone, list, blocked }) => list.length > 0 && (
    <div>
      <h4 className={cx('mb-2 flex items-center gap-1.5 text-sm font-bold', tone)}>
        <Icon name={blocked ? 'x' : tone.includes('amber') ? 'shield' : 'check'} size={15} /> {title} ({list.length})
      </h4>
      <div className="flex flex-col gap-2">{list.map((x) => <Row key={x.p.id} p={x.p} issues={x.issues} blocked={blocked} />)}</div>
    </div>
  )

  return (
    <div className="fixed inset-0 z-[100] flex items-start justify-center overflow-y-auto bg-black/60 p-3 backdrop-blur-sm sm:p-4" onMouseDown={(e) => { if (e.target === e.currentTarget) onClose() }}>
      <div className="my-4 flex w-full max-w-2xl flex-col rounded-2xl border border-line bg-surface shadow-2xl">
        <div className="flex items-center gap-2 border-b border-line p-4">
          <Icon name={slot.icon} size={20} className="text-brand-600" />
          <h3 className="text-lg font-bold">{t('builder.pickTitle', { slot: t(`builder.slot.${slotKey}`) })}</h3>
          <button onClick={onClose} className="ml-auto grid h-9 w-9 place-items-center rounded-lg hover:bg-surface2 cursor-pointer" aria-label="close"><Icon name="x" /></button>
        </div>

        <div className="flex flex-wrap gap-2 border-b border-line p-4">
          <div className="flex min-w-[200px] flex-1 items-center gap-2 rounded-lg border border-line bg-surface px-3">
            <Icon name="search" size={16} className="shrink-0 text-muted" />
            <input value={q} onChange={(e) => setQ(e.target.value)} placeholder={t('builder.searchPh')}
              className="w-full bg-transparent py-2 text-sm focus:outline-none" autoFocus />
          </div>
          <select value={sort} onChange={(e) => setSort(e.target.value)} className={input}>
            <option value="priceAsc">{t('builder.sortPriceAsc')}</option>
            <option value="priceDesc">{t('builder.sortPriceDesc')}</option>
            <option value="rating">{t('builder.sortRating')}</option>
          </select>
        </div>

        <div className="flex flex-col gap-5 overflow-y-auto p-4" style={{ maxHeight: 'calc(100vh - 220px)' }}>
          {groups.ok.length + groups.warn.length + groups.blocked.length === 0 && (
            <div className="py-10 text-center text-sm text-muted">{t('builder.pickerEmpty')}</div>
          )}
          <Group title={t('builder.groupOk')} tone="text-emerald-600 dark:text-emerald-400" list={groups.ok} />
          <Group title={t('builder.groupWarn')} tone="text-amber-600 dark:text-amber-400" list={groups.warn} />
          {groups.blocked.length > 0 && (
            <div>
              <button onClick={() => setShowBlocked((s) => !s)}
                className="mb-2 flex items-center gap-1.5 text-sm font-bold text-muted transition-colors hover:text-fg cursor-pointer">
                <Icon name={showBlocked ? 'minus' : 'plus'} size={14} />
                {showBlocked ? t('builder.hideBlocked') : t('builder.showBlocked', { n: groups.blocked.length })}
              </button>
              {showBlocked && (
                <div className="flex flex-col gap-2">
                  {groups.blocked.map((x) => <Row key={x.p.id} p={x.p} issues={x.issues} blocked />)}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
