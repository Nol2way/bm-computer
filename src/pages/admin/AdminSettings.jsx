import { useState } from 'react'
import { Icon } from '../../components/Icons'
import { fetchSetting, saveSetting } from '../../lib/api'
import { useFetch } from '../../lib/useFetch'
import { promptpayQrUrl } from '../../lib/promptpay'

const input = 'w-full rounded-lg border border-line bg-surface px-3 py-2.5 text-sm focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20'

export default function AdminSettings() {
  const { data, loading } = useFetch(() => fetchSetting('payment'), [])
  return loading ? <div className="py-10 text-center text-muted">กำลังโหลด...</div> : <Form initial={data || {}} />
}

function Form({ initial }) {
  const [f, setF] = useState({ promptpay_id: initial.promptpay_id || '', name: initial.name || '' })
  const [saving, setSaving] = useState(false)
  const [msg, setMsg] = useState('')
  const set = (k) => (e) => setF((s) => ({ ...s, [k]: e.target.value }))
  const preview = promptpayQrUrl(f.promptpay_id, 0, 180)

  const save = async () => {
    setSaving(true); setMsg('')
    try { await saveSetting('payment', f); setMsg('บันทึกแล้ว') } catch (e) { setMsg('ผิดพลาด: ' + e.message) } finally { setSaving(false); setTimeout(() => setMsg(''), 2500) }
  }

  return (
    <div>
      <h3 className="mb-1 font-bold">ตั้งค่าบัญชีรับเงิน (PromptPay)</h3>
      <p className="mb-4 text-sm text-muted">ระบบจะสร้าง QR PromptPay พร้อมล็อคยอดเงินให้ลูกค้าอัตโนมัติตอนชำระเงิน</p>

      <div className="grid gap-5 sm:grid-cols-[1fr_180px]">
        <div className="flex flex-col gap-4">
          <div>
            <label className="mb-1.5 block text-sm font-semibold">เบอร์พร้อมเพย์ / เลขบัตรประชาชน</label>
            <input className={input} value={f.promptpay_id} onChange={set('promptpay_id')} inputMode="numeric" placeholder="0801234567 หรือ 1234567890123" />
            <span className="mt-1 block text-xs text-muted">เบอร์มือถือ 10 หลัก หรือเลขบัตรประชาชน 13 หลัก</span>
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-semibold">ชื่อบัญชี/ร้าน (แสดงบนหน้าชำระเงิน)</label>
            <input className={input} value={f.name} onChange={set('name')} placeholder="BM Computer" />
          </div>
          <div className="flex items-center gap-3">
            <button onClick={save} disabled={saving} className="rounded-lg bg-brand-600 px-5 py-2 text-sm font-semibold text-white hover:bg-brand-700 disabled:opacity-60 cursor-pointer">{saving ? 'กำลังบันทึก...' : 'บันทึก'}</button>
            {msg && <span className="text-sm text-emerald-600">{msg}</span>}
          </div>
        </div>

        <div className="rounded-xl border border-line bg-white p-3 text-center">
          {preview
            ? <img src={preview} alt="QR preview" className="mx-auto h-[130px] w-[130px]" />
            : <div className="grid h-[130px] place-items-center text-zinc-400"><Icon name="qr" size={40} /></div>}
          <div className="mt-1 text-xs text-zinc-500">ตัวอย่าง QR</div>
        </div>
      </div>
    </div>
  )
}
