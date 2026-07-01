import { useState } from 'react'
import { Icon } from '../../components/Icons'
import { adminListSlides, saveSlide, deleteSlide } from '../../lib/api'
import { useFetch } from '../../lib/useFetch'

const input = 'w-full rounded-lg border border-line bg-surface px-3 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20'
const PLACEMENTS = [
  { v: 'hero', l: 'แบนเนอร์หลัก (Hero carousel)' },
  { v: 'promo', l: 'โปรโมชัน (การ์ดข้าง)' },
  { v: 'flashsale', l: 'แถบ Flash Sale' },
]

export default function AdminSlides() {
  const [key, setKey] = useState(0)
  const { data, loading } = useFetch(() => adminListSlides(), [key])
  const [editing, setEditing] = useState(null)
  const rows = data || []

  const onDelete = async (s) => {
    if (!confirm('ลบสไลด์นี้?')) return
    try { await deleteSlide(s.id); setKey((k) => k + 1) } catch (e) { alert('ลบไม่สำเร็จ: ' + e.message) }
  }

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <h3 className="font-bold">จัดการสไลด์/แบนเนอร์ ({rows.length})</h3>
        <button onClick={() => setEditing({})} className="flex items-center gap-1.5 rounded-lg bg-brand-600 px-3 py-2 text-sm font-semibold text-white hover:bg-brand-700 cursor-pointer">
          <Icon name="plus" size={16} /> เพิ่มสไลด์
        </button>
      </div>

      {loading ? <div className="py-10 text-center text-muted">กำลังโหลด...</div> : (
        <div className="grid gap-3 sm:grid-cols-2">
          {rows.map((s) => (
            <div key={s.id} className="overflow-hidden rounded-xl border border-line bg-surface">
              <div className="aspect-[1200/440] bg-surface2">
                {s.image_url && <img src={s.image_url} alt="" className="h-full w-full object-cover" onError={(e) => { e.currentTarget.style.display = 'none' }} />}
              </div>
              <div className="flex items-center justify-between gap-2 p-3">
                <div className="min-w-0">
                  <div className="truncate text-sm font-semibold">{s.title || '(ไม่มีชื่อ)'}</div>
                  <div className="text-xs text-muted">{PLACEMENTS.find((p) => p.v === s.placement)?.l || s.placement} · {s.is_active ? 'แสดง' : 'ซ่อน'}</div>
                </div>
                <div className="flex shrink-0">
                  <button onClick={() => setEditing(s)} className="rounded p-1.5 hover:bg-surface2 hover:text-brand-600 cursor-pointer" title="แก้ไข"><Icon name="edit" size={16} /></button>
                  <button onClick={() => onDelete(s)} className="rounded p-1.5 text-brand-600 hover:bg-surface2 cursor-pointer" title="ลบ"><Icon name="trash" size={16} /></button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {editing && <SlideForm slide={editing} onClose={() => setEditing(null)} onSaved={() => { setEditing(null); setKey((k) => k + 1) }} />}
    </div>
  )
}

function SlideForm({ slide, onClose, onSaved }) {
  const [f, setF] = useState({
    id: slide.id, placement: slide.placement || 'hero', title: slide.title || '',
    image_url: slide.image_url || '', link: slide.link || '', sort: slide.sort ?? 0, is_active: slide.is_active !== false,
  })
  const [saving, setSaving] = useState(false)
  const [err, setErr] = useState('')
  const set = (k) => (e) => setF((s) => ({ ...s, [k]: e.target.type === 'checkbox' ? e.target.checked : e.target.value }))

  const submit = async (e) => {
    e.preventDefault(); setErr('')
    if (!f.image_url) { setErr('ใส่ URL รูปแบนเนอร์'); return }
    setSaving(true)
    try { await saveSlide(f); onSaved() } catch (e2) { setErr(e2.message || 'บันทึกไม่สำเร็จ') } finally { setSaving(false) }
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-start justify-center overflow-y-auto bg-black/60 p-4 backdrop-blur-sm">
      <form onSubmit={submit} className="my-6 w-full max-w-lg rounded-2xl border border-line bg-surface p-6 shadow-2xl">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-lg font-bold">{slide.id ? 'แก้ไขสไลด์' : 'เพิ่มสไลด์'}</h3>
          <button type="button" onClick={onClose} className="grid h-9 w-9 place-items-center rounded-lg hover:bg-surface2 cursor-pointer"><Icon name="x" /></button>
        </div>
        {err && <div className="mb-3 rounded-lg bg-red-500/10 px-3 py-2 text-sm text-red-600">{err}</div>}
        {f.image_url && <img src={f.image_url} alt="" className="mb-3 aspect-[1200/440] w-full rounded-lg bg-surface2 object-cover" onError={(e) => { e.currentTarget.style.display = 'none' }} />}
        <div className="flex flex-col gap-3">
          <div><label className="mb-1.5 block text-sm font-semibold">ตำแหน่ง</label><select className={input} value={f.placement} onChange={set('placement')}>{PLACEMENTS.map((p) => <option key={p.v} value={p.v}>{p.l}</option>)}</select></div>
          <div><label className="mb-1.5 block text-sm font-semibold">URL รูปแบนเนอร์ *</label><input className={input} value={f.image_url} onChange={set('image_url')} placeholder="https://..." /></div>
          <div><label className="mb-1.5 block text-sm font-semibold">ชื่อ/ข้อความ</label><input className={input} value={f.title} onChange={set('title')} /></div>
          <div><label className="mb-1.5 block text-sm font-semibold">ลิงก์เมื่อกด</label><input className={input} value={f.link} onChange={set('link')} placeholder="/products?cat=gpu" /></div>
          <div className="flex gap-4">
            <div className="w-24"><label className="mb-1.5 block text-sm font-semibold">ลำดับ</label><input className={input} type="number" value={f.sort} onChange={set('sort')} /></div>
            <label className="mt-7 flex cursor-pointer items-center gap-2 text-sm"><input type="checkbox" className="h-4 w-4 accent-brand-600" checked={f.is_active} onChange={set('is_active')} /> แสดงบนเว็บ</label>
          </div>
        </div>
        <div className="mt-6 flex justify-end gap-2">
          <button type="button" onClick={onClose} className="rounded-lg border border-line px-4 py-2 text-sm font-semibold hover:bg-surface2 cursor-pointer">ยกเลิก</button>
          <button disabled={saving} className="rounded-lg bg-brand-600 px-5 py-2 text-sm font-semibold text-white hover:bg-brand-700 disabled:opacity-60 cursor-pointer">{saving ? 'กำลังบันทึก...' : 'บันทึก'}</button>
        </div>
      </form>
    </div>
  )
}
