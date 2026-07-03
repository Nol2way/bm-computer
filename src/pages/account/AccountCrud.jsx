import { useEffect, useState } from 'react'
import { Icon } from '../../components/Icons'
import { cx } from '../../lib/ui'
import { useLang } from '../../i18n/LanguageContext'
import { PageHead, Field, PrimaryBtn, GhostBtn, DefaultBadge, EmptyState, CardListSkeleton, inputCls } from './ui'

// คอมโพเนนต์ CRUD ทั่วไปสำหรับส่วนบัญชี (ที่อยู่ / ใบกำกับภาษี / ช่องทางชำระเงิน)
// fields: [{ key, label, type: 'text'|'tel'|'date'|'textarea'|'select', options?, required?, span? }]
export default function AccountCrud({ title, api, fields, blank, renderItem, emptyText, hasDefault = true, emptyIcon }) {
  const { t } = useLang()
  const [items, setItems] = useState(null)
  const [editing, setEditing] = useState(null) // 'new' | id | null
  const [f, setF] = useState(blank)
  const [saving, setSaving] = useState(false)
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState('')

  const load = () => api.list().then((r) => setItems(r.items)).catch((e) => setErr(e.message))
  useEffect(() => { load() }, [])

  const openNew = () => { setF(blank); setErr(''); setEditing('new') }
  const openEdit = (it) => {
    const next = { ...blank }
    for (const k of Object.keys(blank)) next[k] = it[k] ?? blank[k]
    setF(next); setErr(''); setEditing(it.id)
  }
  const set = (k) => (e) => setF((s) => ({ ...s, [k]: e.target.type === 'checkbox' ? e.target.checked : e.target.value }))

  const submit = async (e) => {
    e.preventDefault(); setSaving(true); setErr('')
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
          {fields.map((fl) => (
            <Field key={fl.key} label={fl.label} className={fl.span === 2 ? 'sm:col-span-2' : ''}>
              {fl.type === 'textarea' ? (
                <textarea className={inputCls} rows={2} value={f[fl.key] ?? ''} onChange={set(fl.key)} required={fl.required} />
              ) : fl.type === 'select' ? (
                <select className={inputCls} value={f[fl.key] ?? ''} onChange={set(fl.key)}>
                  {fl.options.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
                </select>
              ) : (
                <input className={inputCls} type={fl.type || 'text'} value={f[fl.key] ?? ''} onChange={set(fl.key)} required={fl.required}
                  inputMode={fl.type === 'tel' ? 'tel' : undefined} />
              )}
            </Field>
          ))}
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
