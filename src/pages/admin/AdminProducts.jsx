import { useState } from 'react'
import { Icon } from '../../components/Icons'
import { cx } from '../../lib/ui'
import { fmt } from '../../data/mock'
import { adminListProducts, saveProduct, deleteProduct, fetchCategories, fetchBrands, fetchAttributeDefs } from '../../lib/api'
import { useFetch } from '../../lib/useFetch'
import { useLang } from '../../i18n/LanguageContext'
import { TableSkeleton } from '../../components/Skeleton'

const slugify = (s) => s.toString().toLowerCase().trim().replace(/[^a-z0-9ก-๙]+/g, '-').replace(/(^-|-$)/g, '')
const input = 'w-full rounded-lg border border-line bg-surface px-3 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20'

export default function AdminProducts() {
  const { t } = useLang()
  const [key, setKey] = useState(0)
  const { data, loading } = useFetch(() => adminListProducts(), [key])
  const { data: cats } = useFetch(() => fetchCategories(), [])
  const { data: brands } = useFetch(() => fetchBrands(), [])
  const { data: attrDefs } = useFetch(() => fetchAttributeDefs(), [])
  const [editing, setEditing] = useState(null)
  const rows = data || []

  const onDelete = async (p) => {
    if (!confirm(t('admin.confirmDelProduct', { name: p.name }))) return
    try { await deleteProduct(p.id); setKey((k) => k + 1) } catch (e) { alert(`${t('admin.delFail')}: ${e.message}`) }
  }

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <h3 className="font-bold">{t('admin.manageProducts')} ({rows.length})</h3>
        <button onClick={() => setEditing({})} className="flex items-center gap-1.5 rounded-lg bg-brand-600 px-3 py-2 text-sm font-semibold text-white hover:bg-brand-700 cursor-pointer">
          <Icon name="plus" size={16} /> {t('admin.addProduct')}
        </button>
      </div>

      {loading ? <TableSkeleton rows={6} cols={6} /> : (
        <div className="overflow-x-auto">
          <table className="w-full border-collapse overflow-hidden rounded-xl border border-line">
            <thead><tr className="bg-surface2 text-left text-xs text-muted">
              <th className="p-3">{t('admin.colProduct')}</th><th className="p-3">{t('admin.colCat')}</th><th className="p-3">{t('admin.colBrand')}</th><th className="p-3">{t('admin.colPrice')}</th><th className="p-3">{t('admin.colStock')}</th><th className="p-3">{t('admin.colStatus')}</th><th className="p-3">{t('admin.colManage')}</th>
            </tr></thead>
            <tbody>
              {rows.map((p) => (
                <tr key={p.id} className="border-t border-line text-sm hover:bg-surface2/50">
                  <td className="max-w-[280px] p-3">
                    <div className="flex items-center gap-2">
                      <img src={(p.images?.[0]) || 'https://placehold.co/40x40/f1f1f4/9ca3af?text=BM'} alt="" className="h-9 w-9 rounded bg-white object-contain" onError={(e) => { e.currentTarget.style.visibility = 'hidden' }} />
                      <span className="line-clamp-1">{p.name}</span>
                    </div>
                  </td>
                  <td className="p-3">{p.categories?.name_th || '-'}</td>
                  <td className="p-3">{p.brands?.name || '-'}</td>
                  <td className="nums p-3">฿{fmt(p.sale_price && p.sale_price < p.price ? p.sale_price : p.price)}</td>
                  <td className={cx('nums p-3 font-semibold', p.stock <= 5 ? 'text-amber-600' : 'text-emerald-600')}>{p.stock}</td>
                  <td className="p-3">{p.is_active ? <span className="rounded-full bg-emerald-500/15 px-2 py-0.5 text-xs text-emerald-600">{t('admin.show')}</span> : <span className="rounded-full bg-zinc-500/15 px-2 py-0.5 text-xs text-zinc-500">{t('admin.hide')}</span>}</td>
                  <td className="whitespace-nowrap p-3">
                    <button onClick={() => setEditing(p)} className="rounded p-1.5 hover:bg-surface2 hover:text-brand-600 cursor-pointer" title={t('admin.edit')}><Icon name="edit" size={16} /></button>
                    <button onClick={() => onDelete(p)} className="rounded p-1.5 text-brand-600 hover:bg-surface2 cursor-pointer" title={t('admin.del')}><Icon name="trash" size={16} /></button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {editing && <ProductForm product={editing} cats={cats || []} brands={brands || []} attrDefs={attrDefs || []} onClose={() => setEditing(null)} onSaved={() => { setEditing(null); setKey((k) => k + 1) }} />}
    </div>
  )
}

function ProductForm({ product, cats, brands, attrDefs, onClose, onSaved }) {
  const { t, lang } = useLang()
  const isNew = !product.id
  const [f, setF] = useState({
    id: product.id, name: product.name || '', slug: product.slug || '',
    category_id: product.category_id || '', brand_id: product.brand_id || '',
    price: product.price || '', old_price: product.old_price || '', sale_price: product.sale_price || '',
    stock: product.stock ?? 0, badge: product.badge || '', description: product.description || '',
    is_active: product.is_active !== false, is_featured: !!product.is_featured,
  })
  const [images, setImages] = useState(product.images?.length ? product.images : [''])
  const [specs, setSpecs] = useState(Object.entries(product.specs || {}).map(([k, v]) => ({ k, v: String(v) })))
  const [attrs, setAttrs] = useState(product.attrs || {})
  const [saving, setSaving] = useState(false)
  const [err, setErr] = useState('')
  const set = (k) => (e) => setF((s) => ({ ...s, [k]: e.target.type === 'checkbox' ? e.target.checked : e.target.value }))

  // นิยาม attr ของหมวดที่เลือก (dynamic จาก attribute_defs - ไม่ hardcode ฟิลด์)
  const catDefs = attrDefs.filter((d) => d.category_id === f.category_id).sort((a, b) => a.sort - b.sort)
  const setAttr = (key, value) => setAttrs((a) => {
    const next = { ...a }
    if (value === undefined || value === null || value === '' || (Array.isArray(value) && !value.length)) delete next[key]
    else next[key] = value
    return next
  })

  const submit = async (e) => {
    e.preventDefault(); setErr('')
    if (!f.name || !f.category_id || !f.brand_id || !f.price) { setErr(t('admin.fillRequired')); return }
    setSaving(true)
    try {
      // เก็บเฉพาะ attr key ที่มีนิยามในหมวดปัจจุบัน (เปลี่ยนหมวดแล้วค่าหมวดเก่าไม่ติดไป)
      const validKeys = new Set(catDefs.map((d) => d.key))
      const cleanAttrs = Object.fromEntries(Object.entries(attrs).filter(([k]) => validKeys.has(k)))
      await saveProduct({
        ...f, slug: f.slug || slugify(f.name),
        images: images.map((s) => s.trim()).filter(Boolean),
        specs: Object.fromEntries(specs.filter((s) => s.k.trim()).map((s) => [s.k.trim(), s.v])),
        attrs: cleanAttrs,
      })
      onSaved()
    } catch (e2) { setErr(e2.message || t('admin.saveFail')) } finally { setSaving(false) }
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-start justify-center overflow-y-auto bg-black/60 p-4 backdrop-blur-sm">
      <form onSubmit={submit} className="my-6 w-full max-w-2xl rounded-2xl border border-line bg-surface p-6 shadow-2xl">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-lg font-bold">{isNew ? t('admin.addProduct') : t('admin.editProduct')}</h3>
          <button type="button" onClick={onClose} className="grid h-9 w-9 place-items-center rounded-lg hover:bg-surface2 cursor-pointer"><Icon name="x" /></button>
        </div>
        {err && <div className="mb-3 rounded-lg bg-red-500/10 px-3 py-2 text-sm text-red-600">{err}</div>}

        <div className="grid gap-3 sm:grid-cols-2">
          <Field label={t('admin.productName')} className="sm:col-span-2"><input className={input} value={f.name} onChange={(e) => setF((s) => ({ ...s, name: e.target.value, slug: s.slug || slugify(e.target.value) }))} /></Field>
          <Field label={t('admin.slugUrl')}><input className={input} value={f.slug} onChange={set('slug')} placeholder="auto" /></Field>
          <Field label={t('admin.stock')}><input className={input} type="number" value={f.stock} onChange={set('stock')} /></Field>
          <Field label={t('admin.category')}><select className={input} value={f.category_id} onChange={set('category_id')}><option value="">{t('admin.choosePh')}</option>{cats.map((c) => <option key={c.id} value={c.id}>{c.name_th}</option>)}</select></Field>
          <Field label={t('admin.brand')}><select className={input} value={f.brand_id} onChange={set('brand_id')}><option value="">{t('admin.choosePh')}</option>{brands.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}</select></Field>
          <Field label={t('admin.price')}><input className={input} type="number" value={f.price} onChange={set('price')} /></Field>
          <Field label={t('admin.oldPrice')}><input className={input} type="number" value={f.old_price} onChange={set('old_price')} /></Field>
          <Field label={t('admin.salePrice')}><input className={input} type="number" value={f.sale_price} onChange={set('sale_price')} /></Field>
          <Field label={t('admin.badge')}><select className={input} value={f.badge} onChange={set('badge')}><option value="">{t('admin.badgeNone')}</option><option value="best">{t('admin.badgeBest')}</option><option value="sale">{t('admin.badgeSale')}</option><option value="low">{t('admin.badgeLow')}</option></select></Field>
        </div>

        <div className="mt-4">
          <label className="mb-1.5 block text-sm font-semibold">{t('admin.imagesUrl')}</label>
          {images.map((url, i) => (
            <div key={i} className="mb-2 flex gap-2">
              <input className={input} value={url} onChange={(e) => setImages((a) => a.map((x, j) => (j === i ? e.target.value : x)))} placeholder="https://..." />
              <button type="button" onClick={() => setImages((a) => a.filter((_, j) => j !== i))} className="rounded-lg border border-line px-2 hover:bg-surface2 cursor-pointer"><Icon name="trash" size={16} /></button>
            </div>
          ))}
          <button type="button" onClick={() => setImages((a) => [...a, ''])} className="text-sm font-semibold text-brand-600 hover:underline cursor-pointer">{t('admin.addImage')}</button>
        </div>

        <div className="mt-4">
          <label className="mb-1.5 block text-sm font-semibold">{t('admin.specsLabel')}</label>
          {specs.map((sp, i) => (
            <div key={i} className="mb-2 flex gap-2">
              <input className={`${input} w-1/3`} value={sp.k} onChange={(e) => setSpecs((a) => a.map((x, j) => (j === i ? { ...x, k: e.target.value } : x)))} placeholder={t('admin.specKeyPh')} />
              <input className={input} value={sp.v} onChange={(e) => setSpecs((a) => a.map((x, j) => (j === i ? { ...x, v: e.target.value } : x)))} placeholder={t('admin.specValPh')} />
              <button type="button" onClick={() => setSpecs((a) => a.filter((_, j) => j !== i))} className="rounded-lg border border-line px-2 hover:bg-surface2 cursor-pointer"><Icon name="trash" size={16} /></button>
            </div>
          ))}
          <button type="button" onClick={() => setSpecs((a) => [...a, { k: '', v: '' }])} className="text-sm font-semibold text-brand-600 hover:underline cursor-pointer">{t('admin.addSpec')}</button>
        </div>

        {/* สเปคเครื่องอ่านสำหรับ PC Builder - ฟอร์ม dynamic จาก attribute_defs ของหมวดที่เลือก */}
        <div className="mt-4 rounded-xl border border-line bg-surface2/40 p-4">
          <label className="flex items-center gap-1.5 text-sm font-semibold"><Icon name="cpu" size={15} className="text-brand-600" /> {t('admin.attrsLabel')}</label>
          <p className="mb-3 mt-0.5 text-xs text-muted">{t('admin.attrsHint')}</p>
          {!f.category_id ? (
            <p className="text-sm text-muted">{t('admin.attrsPickCat')}</p>
          ) : catDefs.length === 0 ? (
            <p className="text-sm text-muted">{t('admin.attrsNone')}</p>
          ) : (
            <div className="grid gap-3 sm:grid-cols-2">
              {catDefs.map((d) => (
                <AttrInput key={d.id} def={d} lang={lang} t={t} value={attrs[d.key]} onChange={(v) => setAttr(d.key, v)} />
              ))}
            </div>
          )}
        </div>

        <Field label={t('admin.descriptionLabel')} className="mt-4"><textarea className={input} rows="3" value={f.description} onChange={set('description')} /></Field>

        <div className="mt-4 flex gap-6">
          <label className="flex cursor-pointer items-center gap-2 text-sm"><input type="checkbox" className="h-4 w-4 accent-brand-600" checked={f.is_active} onChange={set('is_active')} /> {t('admin.showOnSite')}</label>
          <label className="flex cursor-pointer items-center gap-2 text-sm"><input type="checkbox" className="h-4 w-4 accent-brand-600" checked={f.is_featured} onChange={set('is_featured')} /> {t('admin.isFeatured')}</label>
        </div>

        <div className="mt-6 flex justify-end gap-2">
          <button type="button" onClick={onClose} className="rounded-lg border border-line px-4 py-2 text-sm font-semibold hover:bg-surface2 cursor-pointer">{t('admin.cancel')}</button>
          <button disabled={saving} className="rounded-lg bg-brand-600 px-5 py-2 text-sm font-semibold text-white hover:bg-brand-700 disabled:opacity-60 cursor-pointer">{saving ? t('admin.saving') : t('admin.save')}</button>
        </div>
      </form>
    </div>
  )
}

function Field({ label, children, className }) {
  return <div className={className}><label className="mb-1.5 block text-sm font-semibold">{label}</label>{children}</div>
}

// input ตามชนิดของ attribute_def: number/text/boolean/enum/enum_multi
function AttrInput({ def, lang, t, value, onChange }) {
  const label = (lang === 'th' ? def.label_th : def.label_en) + (def.unit ? ` (${def.unit})` : '')
  const options = Array.isArray(def.options) ? def.options : []

  if (def.type === 'boolean') {
    const v = value === true ? 'yes' : value === false ? 'no' : ''
    return (
      <Field label={label}>
        <select className={input} value={v} onChange={(e) => onChange(e.target.value === '' ? '' : e.target.value === 'yes')}>
          <option value="">{t('admin.attrUnset')}</option>
          <option value="yes">{t('admin.attrYes')}</option>
          <option value="no">{t('admin.attrNo')}</option>
        </select>
      </Field>
    )
  }
  if (def.type === 'enum') {
    return (
      <Field label={label}>
        <select className={input} value={value ?? ''} onChange={(e) => onChange(e.target.value)}>
          <option value="">{t('admin.attrUnset')}</option>
          {options.map((o) => <option key={o} value={o}>{o}</option>)}
        </select>
      </Field>
    )
  }
  if (def.type === 'enum_multi') {
    const arr = Array.isArray(value) ? value : []
    const toggle = (o) => onChange(arr.includes(o) ? arr.filter((x) => x !== o) : [...arr, o])
    return (
      <Field label={label} className="sm:col-span-2">
        <div className="flex flex-wrap gap-1.5">
          {options.map((o) => (
            <button key={o} type="button" onClick={() => toggle(o)}
              className={cx('rounded-full border px-3 py-1 text-xs font-semibold transition-colors cursor-pointer',
                arr.includes(o) ? 'border-brand-600 bg-brand-600 text-white' : 'border-line hover:bg-surface2')}>
              {o}
            </button>
          ))}
        </div>
      </Field>
    )
  }
  if (def.type === 'number') {
    return (
      <Field label={label}>
        <input className={input} type="number" step="any" value={value ?? ''}
          onChange={(e) => onChange(e.target.value === '' ? '' : Number(e.target.value))} />
      </Field>
    )
  }
  return (
    <Field label={label}>
      <input className={input} value={value ?? ''} onChange={(e) => onChange(e.target.value)} />
    </Field>
  )
}
