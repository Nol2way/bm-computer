import { useEffect, useState } from 'react'
import { Icon } from '../../components/Icons'
import { cx } from '../../lib/ui'
import { useLang } from '../../i18n/LanguageContext'
import { PageHead, Field, PrimaryBtn, GhostBtn, DefaultBadge, EmptyState, CardListSkeleton, inputCls } from './ui'
import { check } from '../../lib/validate'

// คอมโพเนนต์ CRUD ทั่วไปสำหรับส่วนบัญชี (ที่อยู่ / ใบกำกับภาษี / ช่องทางชำระเงิน)
// fields: [{ key, label, type: 'text'|'tel'|'date'|'textarea'|'select', options?, required?, span?,
//            rules?: ['phone'|'postcode'|'taxId'|'name'|...], maxLength?, numeric? }]
export default function AccountCrud({ title, api, fields, blank, renderItem, emptyText, hasDefault = true, emptyIcon }) {
  const { t } = useLang()
  const [items, setItems] = useState(null)
  const [editing, setEditing] = useState(null) // 'new' | id | null
  const [f, setF] = useState(blank)
  const [fieldErrs, setFieldErrs] = useState({})
  const [saving, setSaving] = useState(false)
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState('')

  const load = () => api.list().then((r) => setItems(r.items)).catch((e) => setErr(e.message))
  useEffect(() => { load() }, [])

  const openNew = () => { setF(blank); setErr(''); setFieldErrs({}); setEditing('new') }
  const openEdit = (it) => {
    const next = { ...blank }
    for (const k of Object.keys(blank)) next[k] = it[k] ?? blank[k]
    setF(next); setErr(''); setFieldErrs({}); setEditing(it.id)
  }
  // fl รับได้ทั้ง field object และชื่อ key ตรงๆ (เช่น checkbox is_default ที่ไม่อยู่ใน fields)
  const set = (fl) => (e) => {
    const { key, numeric } = typeof fl === 'string' ? { key: fl } : fl
    let v = e.target.type === 'checkbox' ? e.target.checked : e.target.value
    if (numeric && typeof v === 'string') v = v.replace(/[^\d]/g, '') // ช่องตัวเลขล้วน (เบอร์/รหัสไปรษณีย์/เลขภาษี)
    setF((s) => ({ ...s, [key]: v }))
    setFieldErrs((s) => ({ ...s, [key]: '' }))
  }

  // ตรวจตามกติกาของแต่ละช่อง (required + rules) คืน object error ต่อช่อง
  const validate = () => {
    const errs = {}
    for (const fl of fields) {
      const v = f[fl.key]
      if (fl.required && !String(v ?? '').trim()) { errs[fl.key] = 'valid.required'; continue }
      if (!String(v ?? '').trim()) continue // ช่องว่างที่ไม่บังคับ = ผ่าน
      for (const r of fl.rules || []) {
        const e = check(r, v)
        if (e) { errs[fl.key] = e; break }
      }
    }
    return errs
  }

  const submit = async (e) => {
    e.preventDefault()
    const errs = validate()
    setFieldErrs(errs)
    if (Object.keys(errs).length) return
    setSaving(true); setErr('')
    try {
      if (editing === 'new') await api.create(f)
      else await api.update(editing, f)
      setEditing(null); await load()
    } catch (e2) { setErr(e2.message) } finally { setSaving(false) }
  }

  const remove = async (it) => {
    if (!window.confirm(t('account.confirmDelete'))) return
    setBusy(true)
    try { await api.remove(it.id); await load() } catch (e2) { setErr(e2.message) } finally { setBusy(false) }
  }
  const makeDefault = async (it) => {
    setBusy(true)
    try { await api.update(it.id, { is_default: true }); await load() } catch (e2) { setErr(e2.message) } finally { setBusy(false) }
  }

  if (items === null) return <CardListSkeleton />

  return (
    <div>
      <PageHead
        title={title}
        action={editing == null && <PrimaryBtn onClick={openNew}><Icon name="plus" size={16} /> {t('account.addNew')}</PrimaryBtn>}
      />
      {err && <div className="mb-4 rounded-lg bg-red-500/10 px-3 py-2 text-sm text-red-600 dark:text-red-400">{err}</div>}

      {editing != null && (
        <form onSubmit={submit} className="mb-5 grid gap-4 rounded-2xl border border-line bg-surface p-5 sm:grid-cols-2">
          {fields.map((fl) => {
            const errCls = fieldErrs[fl.key] ? ' border-red-400' : ''
            return (
              <Field key={fl.key} label={fl.label} className={fl.span === 2 ? 'sm:col-span-2' : ''}>
                {fl.type === 'textarea' ? (
                  <textarea className={inputCls + errCls} rows={2} value={f[fl.key] ?? ''} onChange={set(fl)} maxLength={fl.maxLength} />
                ) : fl.type === 'select' ? (
                  <select className={inputCls + errCls} value={f[fl.key] ?? ''} onChange={set(fl)}>
                    {fl.options.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
                  </select>
                ) : (
                  <input className={inputCls + errCls} type={fl.type || 'text'} value={f[fl.key] ?? ''} onChange={set(fl)}
                    maxLength={fl.maxLength} inputMode={fl.numeric ? 'numeric' : fl.type === 'tel' ? 'tel' : undefined} />
                )}
                {fieldErrs[fl.key] && <span className="mt-1 block text-xs text-red-500">{t(fieldErrs[fl.key])}</span>}
              </Field>
            )
          })}
          {hasDefault && (
            <label className="flex cursor-pointer items-center gap-2 text-sm sm:col-span-2">
              <input type="checkbox" className="h-4 w-4 accent-brand-600" checked={!!f.is_default} onChange={set('is_default')} />
              {t('account.setDefault')}
            </label>
          )}
          <div className="flex gap-2 sm:col-span-2">
            <PrimaryBtn type="submit" disabled={saving}>{saving ? t('common.loading') : t('account.save')}</PrimaryBtn>
            <GhostBtn type="button" onClick={() => setEditing(null)}>{t('account.cancel')}</GhostBtn>
          </div>
        </form>
      )}

      {items.length === 0 && editing == null ? (
        <EmptyState icon={emptyIcon} text={emptyText} />
      ) : (
        <div className="grid gap-3">
          {items.map((it) => (
            <div key={it.id} className={cx('rounded-xl border bg-surface p-4', it.is_default ? 'border-brand-500/50' : 'border-line')}>
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0 text-sm">{renderItem(it)}</div>
                <div className="flex shrink-0 items-center gap-1">
                  {hasDefault && it.is_default && <DefaultBadge>{t('account.isDefault')}</DefaultBadge>}
                  {hasDefault && !it.is_default && (
                    <button onClick={() => makeDefault(it)} disabled={busy} title={t('account.setDefault')}
                      className="grid h-8 w-8 place-items-center rounded-lg text-muted transition-colors hover:bg-surface2 hover:text-brand-600 cursor-pointer">
                      <Icon name="check" size={16} />
                    </button>
                  )}
                  <button onClick={() => openEdit(it)} title={t('account.edit')}
                    className="grid h-8 w-8 place-items-center rounded-lg text-muted transition-colors hover:bg-surface2 cursor-pointer">
                    <Icon name="edit" size={16} />
                  </button>
                  <button onClick={() => remove(it)} disabled={busy} title={t('account.delete')}
                    className="grid h-8 w-8 place-items-center rounded-lg text-muted transition-colors hover:bg-surface2 hover:text-brand-600 cursor-pointer">
                    <Icon name="trash" size={16} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
