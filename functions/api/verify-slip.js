// Cloudflare Pages Function: POST /api/verify-slip
// ตรวจสลิปโอนเงินจริงด้วย EasySlip แล้วอัปเดตออเดอร์เป็น "ชำระแล้ว" (ฝั่ง server เท่านั้น)
// ต้องตั้ง env ใน Cloudflare Pages: EASYSLIP_API_TOKEN, SUPABASE_SERVICE_ROLE_KEY

const SUPABASE_URL = 'https://xclugpegrcuqmnapysnf.supabase.co'

const json = (obj, status = 200) =>
  new Response(JSON.stringify(obj), { status, headers: { 'content-type': 'application/json' } })

// สถานะที่ถือว่าชำระแล้ว (กันจ่ายซ้ำ)
const PAID = ['paid', 'packing', 'shipping', 'done']

export async function onRequestPost({ request, env }) {
  try {
    if (!env.EASYSLIP_API_TOKEN) return json({ ok: false, error: 'ยังไม่ได้ตั้งค่า EASYSLIP_API_TOKEN' }, 500)
    if (!env.SUPABASE_SERVICE_ROLE_KEY) return json({ ok: false, error: 'ยังไม่ได้ตั้งค่า SUPABASE_SERVICE_ROLE_KEY' }, 500)

    const form = await request.formData()
    const image = form.get('image')
    const orderCode = (form.get('orderCode') || '').toString().trim()
    if (!image || typeof image === 'string') return json({ ok: false, error: 'กรุณาแนบรูปสลิป' }, 400)
    if (!orderCode) return json({ ok: false, error: 'ไม่มีรหัสคำสั่งซื้อ' }, 400)

    // 1) เรียก EasySlip ตรวจสลิป
    const es = new FormData()
    es.append('image', image)
    es.append('checkDuplicate', 'true')
    const esRes = await fetch('https://api.easyslip.com/v2/verify/bank', {
      method: 'POST',
      headers: { Authorization: `Bearer ${env.EASYSLIP_API_TOKEN}` },
      body: es,
    })
    const esData = await esRes.json().catch(() => ({}))
    if (!esRes.ok || !esData.success) {
      return json({ ok: false, error: esData?.message || 'ตรวจสอบสลิปไม่สำเร็จ (สลิปไม่ถูกต้อง)' }, 400)
    }
    const raw = esData.data?.rawSlip || {}
    const amount = Number(raw.amount?.amount || 0)
    const transRef = raw.transRef || null
    if (esData.data?.isDuplicate) return json({ ok: false, error: 'สลิปนี้ถูกใช้ไปแล้ว' }, 400)

    // 2) ดึงออเดอร์ด้วย service_role (ข้าม RLS อย่างปลอดภัยฝั่ง server)
    const h = {
      apikey: env.SUPABASE_SERVICE_ROLE_KEY,
      Authorization: `Bearer ${env.SUPABASE_SERVICE_ROLE_KEY}`,
      'content-type': 'application/json',
    }
    const oRes = await fetch(`${SUPABASE_URL}/rest/v1/orders?code=eq.${encodeURIComponent(orderCode)}&select=id,total,status`, { headers: h })
    const orders = await oRes.json()
    const order = Array.isArray(orders) ? orders[0] : null
    if (!order) return json({ ok: false, error: 'ไม่พบคำสั่งซื้อ' }, 404)
    if (PAID.includes(order.status)) return json({ ok: true, already: true, message: 'คำสั่งซื้อนี้ชำระแล้ว' })

    // 3) ตรวจยอดเงินให้ตรง
    if (Math.floor(amount) < order.total) {
      return json({ ok: false, error: `ยอดโอน ฿${amount} น้อยกว่ายอดที่ต้องชำระ ฿${order.total}` }, 400)
    }

    // 4) อัปเดตออเดอร์เป็นชำระแล้ว
    const up = await fetch(`${SUPABASE_URL}/rest/v1/orders?id=eq.${order.id}`, {
      method: 'PATCH',
      headers: { ...h, Prefer: 'return=minimal' },
      body: JSON.stringify({ status: 'paid' }),
    })
    if (!up.ok) return json({ ok: false, error: 'อัปเดตสถานะไม่สำเร็จ' }, 500)

    return json({ ok: true, amount, transRef })
  } catch (e) {
    return json({ ok: false, error: e.message || 'เกิดข้อผิดพลาด' }, 500)
  }
}
