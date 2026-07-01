import { useState } from 'react'
import { fmt } from '../../data/mock'
import { orderStatusCls, orderFlow, cx } from '../../lib/ui'
import { adminListOrders, updateOrderStatus } from '../../lib/api'
import { useFetch } from '../../lib/useFetch'

const STATUS = [...orderFlow, 'cancel']
const label = { pending: 'รอชำระเงิน', paid: 'ชำระเงินแล้ว', packing: 'กำลังแพ็ค', shipping: 'กำลังจัดส่ง', done: 'จัดส่งสำเร็จ', cancel: 'ยกเลิก' }

export default function AdminOrders() {
  const [key, setKey] = useState(0)
  const { data, loading } = useFetch(() => adminListOrders(), [key])
  const [busy, setBusy] = useState(null)
  const rows = data || []

  const change = async (o, status) => {
    setBusy(o.id)
    try { await updateOrderStatus(o.id, status); setKey((k) => k + 1) } catch (e) { alert('อัปเดตไม่สำเร็จ: ' + e.message) } finally { setBusy(null) }
  }
  const fmtDate = (iso) => new Date(iso).toLocaleString('th-TH', { dateStyle: 'medium', timeStyle: 'short' })

  return (
    <div>
      <h3 className="mb-4 font-bold">จัดการออเดอร์ ({rows.length})</h3>
      {loading ? <div className="py-10 text-center text-muted">กำลังโหลด...</div> : rows.length === 0 ? (
        <div className="rounded-xl border border-line bg-surface p-10 text-center text-muted">ยังไม่มีคำสั่งซื้อ</div>
      ) : (
        <div className="flex flex-col gap-3">
          {rows.map((o) => (
            <div key={o.id} className="rounded-xl border border-line bg-surface p-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <b>#{o.code}</b> <span className={cx('ml-1 rounded-full px-2 py-0.5 text-xs font-semibold', orderStatusCls[o.status])}>{label[o.status]}</span>
                  <div className="text-sm text-muted">{fmtDate(o.created_at)} · {(o.order_items || []).length} ราย. · {o.ship_name || '-'} {o.ship_phone || ''}</div>
                </div>
                <div className="flex items-center gap-3">
                  <b className="nums text-brand-600">฿{fmt(o.total)}</b>
                  <select disabled={busy === o.id} value={o.status} onChange={(e) => change(o, e.target.value)}
                    className="rounded-lg border border-line bg-surface px-2 py-1.5 text-sm cursor-pointer">
                    {STATUS.map((s) => <option key={s} value={s}>{label[s]}</option>)}
                  </select>
                </div>
              </div>
              {o.ship_address && <div className="mt-2 border-t border-line pt-2 text-sm text-muted">{o.ship_address}</div>}
              <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted">
                {(o.order_items || []).map((it) => <span key={it.id}>{it.name} ×{it.qty}</span>)}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
