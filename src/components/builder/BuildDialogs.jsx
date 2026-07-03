import { useEffect, useState } from 'react'
import { fmt } from '../../data/mock'
import { Icon } from '../Icons'
import { cx } from '../../lib/ui'
import { listMyBuilds, createBuild, updateBuild, deleteBuild, duplicateBuild } from '../../lib/api'
import { tOutside } from '../../i18n/translations'

// ===================== hook: บันทึกสเปค (login-gate) =====================
export function useBuildActions({ user, openAuth, name, setName, items, budget, buildId, setBuildId, t }) {
  const [saving, setSaving] = useState(false)
  const [savedFlash, setSavedFlash] = useState(false)
  const [lastSaved, setLastSaved] = useState(null) // build ล่าสุดที่บันทึก (ใช้ในหน้าต่างแชร์)

  const save = async () => {
    if (!user) { openAuth('login'); return null }
    const buildName = name.trim() || t('builder.buildNamePh').split(' ')[0]
    if (!name.trim()) setName(buildName)
    setSaving(true)
    try {
      const body = { name: buildName, items, budget: Number(budget) || null }
      const b = buildId ? await updateBuild(buildId, body) : await createBuild(body)
      setBuildId(b.id)
      setLastSaved(b)
      setSavedFlash(true)
      setTimeout(() => setSavedFlash(false), 1500)
      return b
    } catch (e) {
      alert(e.message || tOutside('common.error'))
      return null
    } finally { setSaving(false) }
  }

  // แชร์ต้องมีสเปคที่บันทึกแล้ว - ถ้ายังไม่เคยบันทึกให้บันทึกให้อัตโนมัติ
  const ensureSaved = async () => {
    if (!user) { openAuth('login'); return null }
    if (buildId && lastSaved?.id === buildId) return await save() // sync ของล่าสุดก่อนแชร์
    return await save()
  }

  return { save, ensureSaved, saving, savedFlash, lastSaved, setLastSaved }
}

// ===================== หน้าต่าง "สเปคของฉัน" =====================
export function MyBuildsDialog({ t, onClose, onLoad, onShare }) {
  const [builds, setBuilds] = useState(null)
  const [err, setErr] = useState('')
  const reload = () => listMyBuilds().then(setBuilds).catch((e) => setErr(e.message))
  useEffect(() => { reload() }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const onDelete = async (b) => {
    if (!confirm(t('builder.confirmDelete', { name: b.name }))) return
    try { await deleteBuild(b.id); reload() } catch (e) { setErr(e.message) }
  }
  const onDup = async (b) => {
    try { await duplicateBuild(b.id); reload() } catch (e) { setErr(e.message) }
  }

  return (
    <Modal title={t('builder.myBuilds')} icon="doc" onClose={onClose}>
      {err && <div className="mb-3 rounded-lg bg-red-500/10 px-3 py-2 text-sm text-red-600">{err}</div>}
      {builds === null ? (
        <div className="flex flex-col gap-2">{[...Array(3)].map((_, i) => <div key={i} className="skeleton h-14 rounded-xl" aria-hidden="true" />)}</div>
      ) : builds.length === 0 ? (
        <div className="py-8 text-center text-sm text-muted">{t('builder.noBuilds')}</div>
      ) : (
        <div className="flex flex-col gap-2">
          {builds.map((b) => (
            <div key={b.id} className="flex items-center gap-3 rounded-xl border border-line p-3">
              <div className="min-w-0 flex-1">
                <div className="line-clamp-1 text-sm font-semibold">{b.name}</div>
                <div className="text-xs text-muted">
                  {(b.items || []).length} {t('builder.pieces')}
                  {b.budget ? <> · {t('builder.budget')} <span className="nums">฿{fmt(b.budget)}</span></> : null}
                  {b.is_public && <span className="ml-1.5 rounded-full bg-emerald-500/15 px-1.5 py-0.5 text-[10px] font-bold text-emerald-600">{t('builder.sharing')}</span>}
                </div>
              </div>
              <button onClick={() => onLoad(b)} className="rounded-lg bg-brand-600 px-3 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-brand-700 cursor-pointer">{t('builder.load')}</button>
              <IconBtn icon="share" title={t('builder.share')} onClick={() => onShare(b)} />
              <IconBtn icon="copy" title={t('builder.duplicate')} onClick={() => onDup(b)} />
              <IconBtn icon="trash" title={t('builder.del')} danger onClick={() => onDelete(b)} />
            </div>
          ))}
        </div>
      )}
    </Modal>
  )
}

// ===================== หน้าต่างแชร์ =====================
export function ShareDialog({ t, build, onClose, onChanged }) {
  const [busy, setBusy] = useState(false)
  const [copied, setCopied] = useState(false)
  const [err, setErr] = useState('')
  const url = `${window.location.origin}/builder?b=${build.share_code}`

  const togglePublic = async () => {
    setBusy(true); setErr('')
    try { onChanged(await updateBuild(build.id, { is_public: !build.is_public })) }
    catch (e) { setErr(e.message) } finally { setBusy(false) }
  }
  const copy = async () => {
    try { await navigator.clipboard.writeText(url) } catch {
      const ta = document.createElement('textarea')
      ta.value = url; document.body.appendChild(ta); ta.select()
      document.execCommand('copy'); document.body.removeChild(ta)
    }
    setCopied(true); setTimeout(() => setCopied(false), 1500)
  }

  return (
    <Modal title={t('builder.shareTitle')} icon="share" onClose={onClose}>
      {err && <div className="mb-3 rounded-lg bg-red-500/10 px-3 py-2 text-sm text-red-600">{err}</div>}
      <p className="mb-3 text-sm text-muted">{t('builder.shareHint')}</p>

      <button onClick={togglePublic} disabled={busy}
        className={cx('flex w-full items-center justify-between rounded-xl border p-3 transition-colors cursor-pointer disabled:opacity-60',
          build.is_public ? 'border-emerald-400/60 bg-emerald-500/10' : 'border-line hover:bg-surface2')}>
        <span className="text-sm font-semibold">{build.is_public ? t('builder.sharing') : t('builder.notShared')}</span>
        <span className={cx('relative h-6 w-11 rounded-full transition-colors', build.is_public ? 'bg-emerald-500' : 'bg-line')}>
          <span className={cx('absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-all', build.is_public ? 'left-[22px]' : 'left-0.5')} />
        </span>
      </button>

      {build.is_public && (
        <div className="mt-4 flex flex-col items-center gap-3">
          <img src={`https://api.qrserver.com/v1/create-qr-code/?size=180x180&qzone=2&data=${encodeURIComponent(url)}`}
            alt="QR" width="180" height="180" className="rounded-xl bg-white p-2" />
          <div className="flex w-full items-center gap-2">
            <input readOnly value={url} onFocus={(e) => e.target.select()}
              className="w-full rounded-lg border border-line bg-surface2 px-3 py-2 text-xs" />
            <button onClick={copy}
              className="flex shrink-0 items-center gap-1.5 rounded-lg bg-brand-600 px-3 py-2 text-xs font-semibold text-white transition-colors hover:bg-brand-700 cursor-pointer">
              <Icon name={copied ? 'check' : 'copy'} size={14} /> {copied ? t('builder.copied') : t('builder.copyLink')}
            </button>
          </div>
        </div>
      )}
    </Modal>
  )
}

// ===================== ชิ้นส่วนร่วม =====================
function Modal({ title, icon, onClose, children }) {
  return (
    <div className="fixed inset-0 z-[100] flex items-start justify-center overflow-y-auto bg-black/60 p-4 backdrop-blur-sm"
      onMouseDown={(e) => { if (e.target === e.currentTarget) onClose() }}>
      <div className="my-8 w-full max-w-md rounded-2xl border border-line bg-surface p-5 shadow-2xl">
        <div className="mb-4 flex items-center gap-2">
          <Icon name={icon} size={20} className="text-brand-600" />
          <h3 className="text-lg font-bold">{title}</h3>
          <button onClick={onClose} className="ml-auto grid h-9 w-9 place-items-center rounded-lg hover:bg-surface2 cursor-pointer" aria-label="close"><Icon name="x" /></button>
        </div>
        {children}
      </div>
    </div>
  )
}

function IconBtn({ icon, title, onClick, danger }) {
  return (
    <button onClick={onClick} title={title}
      className={cx('rounded p-1.5 text-muted transition-colors hover:bg-surface2 cursor-pointer', danger ? 'hover:text-red-500' : 'hover:text-brand-600')}>
      <Icon name={icon} size={16} />
    </button>
  )
}
