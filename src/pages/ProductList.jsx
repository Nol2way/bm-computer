import { useEffect, useMemo, useState } from 'react'
import { useSearchParams, Link } from 'react-router-dom'
import { Range } from 'react-range'
import ProductCard from '../components/ProductCard'
import { Icon } from '../components/Icons'
import { cx } from '../lib/ui'
import { fmt } from '../data/mock'
import { useLang } from '../i18n/LanguageContext'
import { fetchProducts, fetchBrands } from '../lib/api'
import { useFetch } from '../lib/useFetch'
import { fuzzyFilter } from '../lib/search'
import { ProductCardSkeleton, Skeleton } from '../components/Skeleton'
import { useCatalog } from '../catalog/CatalogContext'
import { usePageMeta } from '../lib/usePageMeta'

const wrap = 'mx-auto max-w-[1200px] px-4'

// ช่วงราคาแนะนำ (กดครั้งเดียวแทนพิมพ์เอง)
const PRICE_PRESETS = [
  { min: '', max: '1000', label: '< ฿1,000' },
  { min: '1000', max: '5000', label: '฿1,000 - 5,000' },
  { min: '5000', max: '20000', label: '฿5,000 - 20,000' },
  { min: '20000', max: '', label: '> ฿20,000' },
]

export default function ProductList() {
  const { t } = useLang()
  const [params, setParams] = useSearchParams()
  const cat = params.get('cat') || ''
  const q = params.get('q') || ''
  const brandsSel = useMemo(() => (params.get('brand') || '').split(',').filter(Boolean), [params])
  const pmin = params.get('pmin') || ''
  const pmax = params.get('pmax') || ''
  const stockOnly = params.get('stock') === '1'
  const saleOnly = params.get('sale') === '1'
  const rate4 = params.get('rate') === '4'
  const sort = params.get('sort') || 'popular'
  const [drawer, setDrawer] = useState(false)

  // ดึงตามหมวดจาก server ที่เหลือกรองฝั่ง client (ตอบสนองทันที ไม่ยิงซ้ำ)
  const { data, loading } = useFetch(() => fetchProducts({ cat }), [cat])
  const { data: brandRows } = useFetch(() => fetchBrands(), [])
  const { categories, loading: catsLoading, catName } = useCatalog()

  const update = (updates) => {
    const p = new URLSearchParams(params)
    Object.entries(updates).forEach(([k, v]) => (v ? p.set(k, v) : p.delete(k)))
    setParams(p)
  }
  const toggleBrand = (slug) => {
    const next = brandsSel.includes(slug) ? brandsSel.filter((s) => s !== slug) : [...brandsSel, slug]
    update({ brand: next.join(',') })
  }

  // slug -> name (สินค้าเก็บชื่อแบรนด์ ส่วน URL ใช้ slug)
  const brandName = useMemo(() => {
    const m = new Map()
    ;(brandRows || []).forEach((b) => m.set(b.slug, b.name))
    return m
  }, [brandRows])
  const selNames = useMemo(() => new Set(brandsSel.map((s) => brandName.get(s)).filter(Boolean)), [brandsSel, brandName])

  // pipeline: ค้นหา -> นับแบรนด์ (ก่อนกรองแบรนด์ เพื่อโชว์จำนวนที่เลือกได้) -> กรอง -> เรียง
  const base = data || []
  const searched = useMemo(() => (q ? fuzzyFilter(base, q, catName) : base), [base, q, catName])
  const brandCount = useMemo(() => {
    const m = new Map()
    searched.forEach((p) => m.set(p.brand, (m.get(p.brand) || 0) + 1))
    return m
  }, [searched])
  // ขอบเขตราคาจริงของสินค้าในหมวด (สำหรับ slider)
  const priceBounds = useMemo(() => {
    if (!base.length) return [0, 0]
    let lo = Infinity, hi = 0
    base.forEach((p) => { lo = Math.min(lo, p.price); hi = Math.max(hi, p.price) })
    return [lo, hi]
  }, [base])
  const list = useMemo(() => {
    const idx = new Map(base.map((p, i) => [p.id, i])) // ลำดับจาก DB = เก่า -> ใหม่
    const out = searched.filter((p) => {
      if (selNames.size && !selNames.has(p.brand)) return false
      if (pmin && p.price < Number(pmin)) return false
      if (pmax && p.price > Number(pmax)) return false
      if (stockOnly && p.stock <= 0) return false
      if (saleOnly && !p.sale) return false
      if (rate4 && !(p.rating >= 4)) return false
      return true
    })
    const by = {
      popular: (a, b) => (b.featured - a.featured) || (b.reviews - a.reviews) || (b.rating - a.rating),
      priceAsc: (a, b) => a.price - b.price,
      priceDesc: (a, b) => b.price - a.price,
      new: (a, b) => idx.get(b.id) - idx.get(a.id),
      discount: (a, b) => b.discount - a.discount,
    }
    return [...out].sort(by[sort] || by.popular)
  }, [searched, selNames, pmin, pmax, stockOnly, saleOnly, rate4, sort, base])

  const nActive = (cat ? 1 : 0) + brandsSel.length + (pmin || pmax ? 1 : 0) + stockOnly + saleOnly + rate4
  const title = q ? `${t('list.searchFor')} "${q}"`
    : cat ? catName(cat)
    : brandsSel.length === 1 ? (brandName.get(brandsSel[0]) || t('list.title'))
    : t('list.title')
  usePageMeta(title)

  // ล็อค scroll ตอนเปิด drawer มือถือ
  useEffect(() => {
    document.body.style.overflow = drawer ? 'hidden' : ''
    return () => { document.body.style.overflow = '' }
  }, [drawer])

  const filterProps = { t, categories, catsLoading, catName, cat, brandRows, brandsSel, brandCount, brandName, toggleBrand, pmin, pmax, priceBounds, stockOnly, saleOnly, rate4, update, nActive }

  return (
    <div className={`${wrap} py-6`}>
      <nav className="flex flex-wrap gap-1.5 py-3 text-sm text-muted">
        <Link to="/" className="hover:text-brand-600">{t('list.home')}</Link> / <Link to="/products" className="hover:text-brand-600">{t('list.products')}</Link>
        {(cat || brandsSel.length > 0 || q) && <> / <span className="text-fg">{title}</span></>}
      </nav>

      <div className="grid items-start gap-6 lg:grid-cols-[260px_1fr]">
        {/* FILTERS (desktop sidebar) */}
        <aside className="hidden max-h-[calc(100vh-170px)] overflow-y-auto rounded-2xl border border-line bg-surface p-5 lg:sticky lg:top-[150px] lg:block">
          <FilterPanel {...filterProps} />
        </aside>

        {/* RESULTS */}
        <section>
          {/* toolbar: หัวข้อ + จำนวน / ปุ่มตัวกรอง (มือถือ) + เรียงลำดับ */}
          <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
            <div>
              <h1 className="text-xl font-bold sm:text-2xl">{title}</h1>
              <span className="text-sm text-muted">{loading ? t('common.loading') : t('list.found', { n: list.length })}</span>
            </div>
            <div className="flex items-center gap-2">
              <button onClick={() => setDrawer(true)}
                className="flex items-center gap-2 rounded-lg border border-line bg-surface px-3 py-2 text-sm font-semibold transition-colors hover:bg-surface2 lg:hidden cursor-pointer">
                <Icon name="sliders" size={16} /> {t('list.filters')}
                {nActive > 0 && <span className="grid h-5 min-w-5 place-items-center rounded-full bg-brand-600 px-1 text-[11px] font-bold text-white">{nActive}</span>}
              </button>
              <label className="flex items-center gap-2 text-sm">
                <span className="hidden text-muted sm:block">{t('list.sortBy')}</span>
                <select value={sort} onChange={(e) => update({ sort: e.target.value === 'popular' ? null : e.target.value })}
                  className="cursor-pointer rounded-lg border border-line bg-surface px-3 py-2 text-sm font-semibold focus:border-brand-500 focus:outline-none">
                  <option value="popular">{t('list.sortPopular')}</option>
                  <option value="priceAsc">{t('list.sortPriceAsc')}</option>
                  <option value="priceDesc">{t('list.sortPriceDesc')}</option>
                  <option value="new">{t('list.sortNew')}</option>
                  <option value="discount">{t('list.sortDiscount')}</option>
                </select>
              </label>
            </div>
          </div>

          {/* active filter chips */}
          {nActive > 0 && (
            <div className="mb-4 flex flex-wrap items-center gap-2">
              {cat && <Chip label={catName(cat)} onClear={() => update({ cat: null })} />}
              {brandsSel.map((s) => <Chip key={s} label={brandName.get(s) || s} onClear={() => toggleBrand(s)} />)}
              {(pmin || pmax) && <Chip label={`฿${pmin ? fmt(Number(pmin)) : 0} - ${pmax ? '฿' + fmt(Number(pmax)) : '∞'}`} onClear={() => update({ pmin: null, pmax: null })} />}
              {stockOnly && <Chip label={t('list.stockOnly')} onClear={() => update({ stock: null })} />}
              {saleOnly && <Chip label={t('list.saleOnly')} onClear={() => update({ sale: null })} />}
              {rate4 && <Chip label={`★ ${t('list.rate4')}`} onClear={() => update({ rate: null })} />}
              <button onClick={() => setParams(q ? { q } : {})}
                className="text-sm font-semibold text-brand-600 hover:underline cursor-pointer">{t('list.clearAll')}</button>
            </div>
          )}

          <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-3 xl:grid-cols-4">
            {loading
              ? Array.from({ length: 8 }).map((_, i) => <ProductCardSkeleton key={i} />)
              : list.map((p) => <ProductCard key={p.id} p={p} />)}
          </div>

          {!loading && list.length === 0 && (
            <div className="rounded-2xl border border-line bg-surface p-12 text-center">
              <Icon name="search" size={36} className="mx-auto text-muted" />
              <p className="mt-3 font-semibold">{t('list.noResults')}</p>
              <p className="mt-1 text-sm text-muted">{t('list.noResultsHint')}</p>
              <button onClick={() => setParams({})}
                className="mt-4 rounded-lg bg-brand-600 px-5 py-2 text-sm font-semibold text-white transition-colors hover:bg-brand-700 cursor-pointer">
                {t('list.clearAll')}
              </button>
            </div>
          )}
        </section>
      </div>

      {/* FILTERS (mobile drawer) */}
      {drawer && (
        <div className="fixed inset-0 z-50 lg:hidden" role="dialog" aria-label={t('list.filters')}>
          <div className="absolute inset-0 bg-black/50" onClick={() => setDrawer(false)} />
          <div className="absolute inset-y-0 left-0 flex w-[320px] max-w-[85vw] flex-col bg-surface shadow-2xl">
            <div className="flex items-center justify-between border-b border-line px-5 py-3.5">
              <h3 className="flex items-center gap-2 font-bold"><Icon name="sliders" size={18} /> {t('list.filters')}</h3>
              <button onClick={() => setDrawer(false)} aria-label="close"
                className="grid h-9 w-9 place-items-center rounded-lg transition-colors hover:bg-surface2 cursor-pointer"><Icon name="x" size={18} /></button>
            </div>
            <div className="flex-1 overflow-y-auto p-5"><FilterPanel {...filterProps} /></div>
            <div className="border-t border-line p-4">
              <button onClick={() => setDrawer(false)}
                className="w-full rounded-xl bg-brand-600 py-2.5 font-semibold text-white transition-colors hover:bg-brand-700 cursor-pointer">
                {t('list.found', { n: list.length })}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function Chip({ label, onClear }) {
  return (
    <span className="flex items-center gap-1.5 rounded-full border border-brand-200 bg-brand-50 py-1 pl-3 pr-1.5 text-sm font-medium text-brand-700 dark:border-brand-600/30 dark:bg-brand-600/15 dark:text-brand-400">
      {label}
      <button onClick={onClear} aria-label="remove" className="grid h-5 w-5 place-items-center rounded-full transition-colors hover:bg-brand-600 hover:text-white cursor-pointer">
        <Icon name="x" size={12} />
      </button>
    </span>
  )
}

function Section({ title, defaultOpen = true, children }) {
  const [open, setOpen] = useState(defaultOpen)
  return (
    <div className="border-b border-line py-4 first:pt-0 last:border-b-0">
      <button onClick={() => setOpen((o) => !o)} className="flex w-full items-center justify-between text-sm font-bold cursor-pointer">
        {title}
        <Icon name="chevronDown" size={16} className={cx('text-muted transition-transform', open && 'rotate-180')} />
      </button>
      {open && <div className="mt-3">{children}</div>}
    </div>
  )
}

function Check({ checked, onChange, children }) {
  return (
    <label className="flex cursor-pointer items-center gap-2.5 rounded-md px-1 py-1.5 text-sm transition-colors hover:text-brand-600">
      <input type="checkbox" checked={checked} onChange={onChange} className="h-4 w-4 shrink-0 cursor-pointer accent-brand-600" />
      <span className={cx('flex-1', checked && 'font-semibold text-brand-600')}>{children}</span>
    </label>
  )
}

// slider ช่วงราคา (react-range) - ลากแล้วปล่อยจึงกรองจริง ระหว่างลากตัวเลขใน input อัปเดตตาม
function PriceSlider({ bounds, draft, setDraft, onCommit }) {
  const [lo, hi] = bounds
  if (!(hi > lo)) return null
  const clamp = (n, fallback) => Math.min(Math.max(Number.isFinite(n) ? n : fallback, lo), hi)
  const vMinRaw = clamp(draft.min === '' ? lo : Number(draft.min), lo)
  const vMaxRaw = clamp(draft.max === '' ? hi : Number(draft.max), hi)
  const vMin = Math.min(vMinRaw, vMaxRaw)
  const vMax = Math.max(vMinRaw, vMaxRaw)
  const pct = (v) => ((v - lo) / (hi - lo)) * 100
  return (
    <div className="mb-3 px-1.5">
      <Range
        step={1} min={lo} max={hi} values={[vMin, vMax]}
        onChange={([a, b]) => setDraft({ min: a <= lo ? '' : String(a), max: b >= hi ? '' : String(b) })}
        onFinalChange={([a, b]) => onCommit(a <= lo ? '' : String(a), b >= hi ? '' : String(b))}
        renderTrack={({ props, children }) => (
          <div {...props} style={props.style} className="flex h-6 w-full items-center">
            <div className="relative h-1.5 w-full rounded-full bg-line">
              <div className="absolute h-1.5 rounded-full bg-brand-600" style={{ left: `${pct(vMin)}%`, right: `${100 - pct(vMax)}%` }} />
            </div>
            {children}
          </div>
        )}
        renderThumb={({ props }) => {
          const { key, ...rest } = props // react-range ใส่ key มาใน props - ต้องส่งแยก ห้าม spread
          return (
            <div key={key} {...rest} style={rest.style}
              className="h-4 w-4 cursor-grab rounded-full border-2 border-white bg-brand-600 shadow-md focus:outline-none focus:ring-2 focus:ring-brand-500/40" />
          )
        }}
      />
      <div className="nums mt-1 flex justify-between text-xs text-muted">
        <span>฿{fmt(vMin)}</span>
        <span>฿{fmt(vMax)}</span>
      </div>
    </div>
  )
}

// แผงตัวกรองทั้งชุด - ใช้ร่วมกันทั้ง sidebar (จอใหญ่) และ drawer (มือถือ)
function FilterPanel({ t, categories, catsLoading, catName, cat, brandRows, brandsSel, brandCount, brandName, toggleBrand, pmin, pmax, priceBounds, stockOnly, saleOnly, rate4, update }) {
  const [bq, setBq] = useState('') // ค้นหาแบรนด์ในลิสต์
  const [showAllBrands, setShowAllBrands] = useState(false)
  const [priceDraft, setPriceDraft] = useState({ min: pmin, max: pmax })
  useEffect(() => { setPriceDraft({ min: pmin, max: pmax }) }, [pmin, pmax])

  // เรียงแบรนด์: ที่มีสินค้าในผลลัพธ์ปัจจุบันขึ้นก่อน แล้วค่อยตามตัวอักษร
  const brands = useMemo(() => {
    const all = (brandRows || []).filter((b) => !bq || b.name.toLowerCase().includes(bq.toLowerCase()))
    return [...all].sort((a, b) => (brandCount.get(b.name) || 0) - (brandCount.get(a.name) || 0) || a.name.localeCompare(b.name))
  }, [brandRows, bq, brandCount])
  const visibleBrands = showAllBrands || bq ? brands : brands.slice(0, 8)

  const applyPrice = (e) => {
    e?.preventDefault()
    update({ pmin: priceDraft.min || null, pmax: priceDraft.max || null })
  }
  const priceInput = 'w-full rounded-lg border border-line bg-surface px-2.5 py-2 text-sm focus:border-brand-500 focus:outline-none nums'

  return (
    <div>
      <Section title={t('list.category')}>
        <div className="flex flex-col gap-0.5">
          {catsLoading
            ? Array.from({ length: 8 }).map((_, i) => <Skeleton key={i} className="my-1 h-4 w-3/4" />)
            : categories.map((c) => (
                <button key={c.slug} onClick={() => update({ cat: c.slug === cat ? null : c.slug })}
                  className={cx('flex items-center gap-2 rounded-md px-1 py-1.5 text-left text-sm transition-colors hover:text-brand-600 cursor-pointer',
                    c.slug === cat ? 'font-bold text-brand-600' : 'text-fg')}>
                  <Icon name={c.icon || 'box'} size={16} className="shrink-0" /> <span className="flex-1">{catName(c.slug)}</span>
                  {c.slug === cat && <Icon name="check" size={14} />}
                </button>
              ))}
        </div>
      </Section>

      <Section title={t('list.brand')}>
        <div className="relative mb-2">
          <Icon name="search" size={15} className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-muted" />
          <input value={bq} onChange={(e) => setBq(e.target.value)} placeholder={t('list.searchBrand')}
            className="w-full rounded-lg border border-line bg-surface py-2 pl-8 pr-2.5 text-sm focus:border-brand-500 focus:outline-none" />
        </div>
        <div className="flex max-h-[260px] flex-col gap-0.5 overflow-y-auto">
          {visibleBrands.map((b) => (
            <Check key={b.id} checked={brandsSel.includes(b.slug)} onChange={() => toggleBrand(b.slug)}>
              <span className="flex items-center justify-between gap-2">
                <span className="truncate">{b.name}</span>
                {brandCount.get(b.name) > 0 && <span className="nums text-xs text-muted">{brandCount.get(b.name)}</span>}
              </span>
            </Check>
          ))}
        </div>
        {!bq && brands.length > 8 && (
          <button onClick={() => setShowAllBrands((v) => !v)} className="mt-1 text-sm font-semibold text-brand-600 hover:underline cursor-pointer">
            {showAllBrands ? t('list.showLess') : t('list.showAll', { n: brands.length })}
          </button>
        )}
      </Section>

      <Section title={t('list.price')}>
        <PriceSlider bounds={priceBounds} draft={priceDraft} setDraft={setPriceDraft}
          onCommit={(min, max) => update({ pmin: min || null, pmax: max || null })} />
        <form onSubmit={applyPrice} className="flex items-center gap-2">
          <input value={priceDraft.min} onChange={(e) => setPriceDraft((s) => ({ ...s, min: e.target.value.replace(/\D/g, '') }))}
            placeholder={t('list.min')} inputMode="numeric" className={priceInput} aria-label={t('list.min')} />
          <span className="text-muted">-</span>
          <input value={priceDraft.max} onChange={(e) => setPriceDraft((s) => ({ ...s, max: e.target.value.replace(/\D/g, '') }))}
            placeholder={t('list.max')} inputMode="numeric" className={priceInput} aria-label={t('list.max')} />
          <button type="submit" className="shrink-0 rounded-lg bg-brand-600 px-3 py-2 text-sm font-semibold text-white transition-colors hover:bg-brand-700 cursor-pointer">
            {t('list.apply')}
          </button>
        </form>
        <div className="mt-2.5 flex flex-wrap gap-1.5">
          {PRICE_PRESETS.map((r) => {
            const active = pmin === r.min && pmax === r.max
            return (
              <button key={r.label} onClick={() => update(active ? { pmin: null, pmax: null } : { pmin: r.min || null, pmax: r.max || null })}
                className={cx('nums rounded-full border px-2.5 py-1 text-xs font-medium transition-colors cursor-pointer',
                  active ? 'border-brand-600 bg-brand-600 text-white' : 'border-line hover:border-brand-500 hover:text-brand-600')}>
                {r.label}
              </button>
            )
          })}
        </div>
      </Section>

      <Section title={t('list.options')}>
        <Check checked={stockOnly} onChange={() => update({ stock: stockOnly ? null : '1' })}>{t('list.stockOnly')}</Check>
        <Check checked={saleOnly} onChange={() => update({ sale: saleOnly ? null : '1' })}>{t('list.saleOnly')}</Check>
        <Check checked={rate4} onChange={() => update({ rate: rate4 ? null : '4' })}>
          <span className="flex items-center gap-1"><span className="text-amber-500">★★★★</span> {t('list.up')}</span>
        </Check>
      </Section>
    </div>
  )
}
