import { useEffect, useState } from 'react'
import { Icon } from '../../components/Icons'
import { useLang } from '../../i18n/LanguageContext'
import { useAuth } from '../../auth/AuthContext'
import { accountApi } from '../../lib/accountApi'
import { PageHead, Field, InfoRow, PrimaryBtn, GhostBtn, inputCls, InfoSkeleton } from './ui'
import { checkAll, MAX } from '../../lib/validate'

export default function Profile() {
  const { t } = useLang()
  const { reload } = useAuth()
  const [p, setP] = useState(null)
  const [edit, setEdit] = useState(false)
  const [f, setF] = useState({})
  const [fieldErrs, setFieldErrs] = useState({})
  const [saving, setSaving] = useState(false)
  const [err, setErr] = useState('')

  const load = () => {
    accountApi.getProfile().then((r) => setP(r.profile)).catch((e) => setErr(e.message))
  }
  useEffect(() => { load() }, [])

  const startEdit = () => {
    setF({
      full_name: p.full_name || '', phone: p.phone || '', birthdate: p.birthdate || '',
      line_id: p.line_id || '', facebook: p.facebook || '',
    })
    setErr(''); setFieldErrs({}); setEdit(true)
  }
  const set = (k, filter) => (e) => {
    const v = filter ? filter(e.target.value) : e.target.value
    setF((s) => ({ ...s, [k]: v }))
    setFieldErrs((s) => ({ ...s, [k]: '' }))
  }

  const save = async (e) => {
    e.preventDefault()
    // ตรวจรูปแบบก่อนส่ง: ชื่อ 2-60 ตัว + เบอร์ไทย 9-10 หลัก
    const errs = checkAll({ full_name: ['required', 'name'], phone: ['required', 'phone'] }, f)
    setFieldErrs(errs)
    if (Object.keys(errs).length) return
    setSaving(true); setErr('')
    try {
      const body = { ...f, birthdate: f.birthdate || null, line_id: f.line_id || null, facebook: f.facebook || null }
      const r = await accountApi.updateProfile(body)
      setP(r.profile); setEdit(false)
      reload() // อัปเดตชื่อบน navbar/หัวบัญชี
    } catch (e2) { setErr(e2.message) } finally { setSaving(false) }
  }

  if (!p) return <InfoSkeleton />

  return (
    <div className="rounded-2xl border border-line bg-surface p-6">
      <PageHead
        title={t('account.title')}
        action={!edit && <GhostBtn onClick={startEdit}><Icon name="edit" size={16} /> {t('account.edit')}</GhostBtn>}
      />
      {err && <div className="mb-4 rounded-lg bg-red-500/10 px-3 py-2 text-sm text-red-600 dark:text-red-400">{err}</div>}

      {!edit ? (
        <div>
          <InfoRow label={t('account.fullName')} value={p.full_name} />
          <InfoRow label={t('account.email')} value={p.email} />
          <InfoRow label={t('account.phone')} value={p.phone} />
          <InfoRow label={t('account.birthdate')} value={p.birthdate} />
          <InfoRow label={t('account.lineId')} value={p.line_id} />
          <InfoRow label={t('account.facebook')} value={p.facebook} />
        </div>
      ) : (
        <form onSubmit={save} className="grid gap-4 sm:grid-cols-2" noValidate>
          <Field label={t('account.fullName')}>
            <input className={inputCls + (fieldErrs.full_name ? ' border-red-400' : '')} value={f.full_name} onChange={set('full_name')} maxLength={MAX.name} />
            {fieldErrs.full_name && <span className="mt-1 block text-xs text-red-500">{t(fieldErrs.full_name)}</span>}
          </Field>
          <Field label={t('account.email')}><input className={inputCls} value={p.email || ''} disabled /></Field>
          <Field label={t('account.phone')}>
            <input className={inputCls + (fieldErrs.phone ? ' border-red-400' : '')} value={f.phone} onChange={set('phone', (v) => v.replace(/[^\d]/g, ''))} type="tel" inputMode="tel" maxLength={MAX.phone} />
            {fieldErrs.phone && <span className="mt-1 block text-xs text-red-500">{t(fieldErrs.phone)}</span>}
          </Field>
          <Field label={t('account.birthdate')}><input className={inputCls} value={f.birthdate} onChange={set('birthdate')} type="date" max={new Date().toISOString().slice(0, 10)} /></Field>
          <Field label={t('account.lineId')}><input className={inputCls} value={f.line_id} onChange={set('line_id')} maxLength={60} /></Field>
          <Field label={t('account.facebook')}><input className={inputCls} value={f.facebook} onChange={set('facebook')} maxLength={120} /></Field>
          <div className="flex gap-2 sm:col-span-2">
            <PrimaryBtn type="submit" disabled={saving}>{saving ? t('common.loading') : t('account.save')}</PrimaryBtn>
            <GhostBtn type="button" onClick={() => setEdit(false)}>{t('account.cancel')}</GhostBtn>
          </div>
        </form>
      )}
    </div>
  )
}
