// ===================================================================
// PC Builder - Compatibility Engine (pure JS, ไม่มี react/ข้อความ UI)
// ทุกกฎคืน issue เป็น code + params -> แปลข้อความที่ UI ด้วย t('builder.rule.'+code)
// หลักการสำคัญ: attr ขาด = ระดับ 'info' (ไม่มีข้อมูล) - "ห้าม" block การขาย
// ===================================================================

// นิยาม slot ของเครื่อง (key = ใช้ใน build items · cat = slug หมวดใน DB)
export const SLOTS = [
  { key: 'cpu',       cat: 'cpu',       icon: 'cpu',       core: true },
  { key: 'mainboard', cat: 'mainboard', icon: 'mainboard', core: true },
  { key: 'ram',       cat: 'ram',       icon: 'ram',       core: true, qty: true, maxQty: 4 },
  { key: 'cooler',    cat: 'cooler',    icon: 'cooler',    core: true },
  { key: 'gpu',       cat: 'gpu',       icon: 'gpu',       core: true },
  { key: 'storage',   cat: 'storage',   icon: 'storage',   core: true, multi: true, maxItems: 4 },
  { key: 'case',      cat: 'case',      icon: 'case',      core: true },
  { key: 'psu',       cat: 'psu',       icon: 'psu',       core: true },
  // อุปกรณ์เสริม (ไม่มีผลกับ compatibility)
  { key: 'monitor',   cat: 'monitor',   icon: 'monitor',   core: false, multi: true, maxItems: 2 },
  { key: 'gear',      cat: 'gear',      icon: 'gear',      core: false, multi: true, maxItems: 4 },
]
export const slotByKey = Object.fromEntries(SLOTS.map((s) => [s.key, s]))

const num = (v) => (typeof v === 'number' && isFinite(v) ? v : null)
const str = (v) => (typeof v === 'string' && v ? v : null)
const arr = (v) => (Array.isArray(v) ? v : null)

// ---- helper: อ่านสินค้าใน build ----
// build items: [{ slot, id (=slug), qty }]
export function pickedOf(items, byId, slotKey) {
  return items.filter((it) => it.slot === slotKey && byId[it.id]).map((it) => ({ ...it, p: byId[it.id] }))
}
const first = (list) => (list.length ? list[0] : null)

// ===================================================================
// ตรวจทั้งเครื่อง -> [{slot, level:'fail'|'warn'|'info', code, params}]
// ===================================================================
export function checkBuild(items, byId) {
  const issues = []
  const push = (slot, level, code, params = {}) => issues.push({ slot, level, code, params })

  const cpu = first(pickedOf(items, byId, 'cpu'))?.p
  const mb = first(pickedOf(items, byId, 'mainboard'))?.p
  const rams = pickedOf(items, byId, 'ram')
  const cooler = first(pickedOf(items, byId, 'cooler'))?.p
  const gpu = first(pickedOf(items, byId, 'gpu'))?.p
  const stores = pickedOf(items, byId, 'storage')
  const cse = first(pickedOf(items, byId, 'case'))?.p
  const psu = first(pickedOf(items, byId, 'psu'))?.p

  const a = (p) => p?.attrs || {}
  // แจ้ง "ไม่มีข้อมูล" ครั้งเดียวต่อคู่กฎ - เก็บ key กันซ้ำ
  const noData = new Set()
  const needs = (slot, p, key) => {
    if (!p) return false // ยังไม่เลือก = ไม่ตรวจ
    const v = a(p)[key]
    if (v === undefined || v === null || v === '') {
      const k = `${slot}.${key}`
      if (!noData.has(k)) { noData.add(k); push(slot, 'info', 'NO_DATA', { key }) }
      return false
    }
    return true
  }

  // ---- CPU <-> Mainboard ----
  if (cpu && mb && needs('cpu', cpu, 'socket') && needs('mainboard', mb, 'socket')) {
    if (a(cpu).socket !== a(mb).socket) push('mainboard', 'fail', 'SOCKET_MISMATCH', { cpu: a(cpu).socket, mb: a(mb).socket })
  }

  // ---- RAM <-> Mainboard ----
  if (rams.length && mb) {
    const memType = str(a(mb).mem_type)
    for (const r of rams) {
      if (needs('ram', r.p, 'mem_type') && memType && a(r.p).mem_type !== memType) {
        push('ram', 'fail', 'RAM_TYPE', { ram: a(r.p).mem_type, mb: memType })
        break
      }
    }
    const totalModules = rams.reduce((s, r) => s + (num(a(r.p).modules) || 1) * (r.qty || 1), 0)
    const totalGb = rams.reduce((s, r) => s + (num(a(r.p).capacity_gb) || 0) * (r.qty || 1), 0)
    const slots = num(a(mb).ram_slots)
    const maxGb = num(a(mb).ram_max_gb)
    const maxMhz = num(a(mb).ram_max_mhz)
    if (slots && totalModules > slots) push('ram', 'fail', 'RAM_SLOTS', { n: totalModules, slots })
    if (maxGb && totalGb > maxGb) push('ram', 'warn', 'RAM_OVER_MAX', { gb: totalGb, max: maxGb })
    const fastest = Math.max(0, ...rams.map((r) => num(a(r.p).speed_mhz) || 0))
    if (maxMhz && fastest > maxMhz) push('ram', 'warn', 'RAM_SPEED_CAP', { mhz: fastest, max: maxMhz })
  }

  // ---- Cooler <-> CPU / Case ----
  if (cooler && cpu && needs('cooler', cooler, 'sockets') && needs('cpu', cpu, 'socket')) {
    const socks = arr(a(cooler).sockets) || []
    if (!socks.includes(a(cpu).socket)) push('cooler', 'fail', 'COOLER_SOCKET', { socket: a(cpu).socket })
  }
  if (cooler && cse) {
    const type = str(a(cooler).cooler_type)
    if (type === 'air') {
      const h = num(a(cooler).height_mm)
      const maxH = num(a(cse).max_cooler_mm)
      if (h && maxH && h > maxH) push('cooler', 'fail', 'COOLER_HEIGHT', { h, max: maxH })
    } else if (type === 'aio') {
      const rad = str(a(cooler).radiator_mm)
      const support = arr(a(cse).radiator_support)
      if (rad && support && !support.includes(rad)) push('cooler', 'fail', 'RADIATOR_FIT', { rad })
    }
  }
  if (cooler && cpu) {
    const rate = num(a(cooler).tdp_rating_w)
    const tdp = num(a(cpu).tdp_w)
    if (rate && tdp && rate < tdp) push('cooler', 'warn', 'COOLER_WEAK', { rate, tdp })
  }
  if (!cooler && cpu && a(cpu).boxed_cooler === false) push('cooler', 'warn', 'NO_COOLER', {})

  // ---- GPU <-> Case ----
  if (gpu && cse && needs('gpu', gpu, 'length_mm') && needs('case', cse, 'max_gpu_mm')) {
    const len = num(a(gpu).length_mm)
    const max = num(a(cse).max_gpu_mm)
    if (len && max && len > max) push('gpu', 'fail', 'GPU_LENGTH', { len, max })
  }

  // ---- Mainboard <-> Case ----
  if (mb && cse && needs('mainboard', mb, 'form_factor') && needs('case', cse, 'mb_support')) {
    const ff = a(mb).form_factor
    const support = arr(a(cse).mb_support) || []
    if (!support.includes(ff)) push('case', 'fail', 'MB_FORM', { ff })
  }

  // ---- Storage <-> Mainboard ----
  if (stores.length && mb) {
    const m2Used = stores.filter((s) => a(s.p).interface === 'm2_nvme').reduce((s, x) => s + (x.qty || 1), 0)
    const sataUsed = stores.filter((s) => String(a(s.p).interface || '').startsWith('sata')).reduce((s, x) => s + (x.qty || 1), 0)
    const m2 = num(a(mb).m2_slots)
    const sata = num(a(mb).sata_ports)
    if (m2 !== null && m2Used > m2) push('storage', 'fail', 'M2_SLOTS', { n: m2Used, slots: m2 })
    if (sata !== null && sataUsed > sata) push('storage', 'fail', 'SATA_PORTS', { n: sataUsed, ports: sata })
  }

  // ---- PSU <-> ทั้งเครื่อง / Case ----
  const { totalW } = estimatePower(items, byId)
  if (psu && needs('psu', psu, 'wattage_w')) {
    const w = num(a(psu).wattage_w)
    if (w && totalW > 0) {
      if (w < totalW) push('psu', 'fail', 'PSU_NOT_ENOUGH', { w, need: totalW })
      else if (w < Math.round(totalW * 1.3)) push('psu', 'warn', 'PSU_TIGHT', { w, need: totalW })
    }
  }
  if (psu && cse) {
    const form = str(a(psu).psu_form)
    const support = arr(a(cse).psu_form)
    if (form && support && !support.includes(form)) push('psu', 'fail', 'PSU_FORM', { form })
  }
  if (psu && gpu) {
    const conn = str(a(gpu).power_conn)
    if (conn === '16pin' && a(psu).pcie_16pin === false) push('psu', 'warn', 'PSU_CONN_16PIN', {})
  }

  return issues
}

// ===================================================================
// พลังงาน + แนะนำ PSU
// ===================================================================
const PSU_TIERS = [450, 550, 650, 750, 850, 1000, 1200]

export function estimatePower(items, byId) {
  const a = (p) => p?.attrs || {}
  const breakdown = []
  let total = 0
  const add = (slot, w) => { if (w > 0) { breakdown.push({ slot, w }); total += w } }

  const cpu = first(pickedOf(items, byId, 'cpu'))?.p
  const gpu = first(pickedOf(items, byId, 'gpu'))?.p
  const rams = pickedOf(items, byId, 'ram')
  const stores = pickedOf(items, byId, 'storage')

  add('cpu', num(a(cpu).tdp_w) || 0)
  add('gpu', num(a(gpu).power_w) || 0)
  const modules = rams.reduce((s, r) => s + (num(a(r.p).modules) || 1) * (r.qty || 1), 0)
  add('ram', modules * 10)
  const storW = stores.reduce((s, x) => {
    const iface = String(a(x.p).interface || '')
    return s + (iface === 'sata_hdd' ? 15 : 8) * (x.qty || 1)
  }, 0)
  add('storage', storW)
  if (cpu || gpu) add('base', 60) // เมนบอร์ด + พัดลม + อุปกรณ์พื้นฐาน

  return { totalW: Math.ceil(total / 10) * 10, breakdown }
}

export function recommendPsu(totalW, items, byId) {
  if (!totalW) return null
  const gpu = first(pickedOf(items || [], byId || {}, 'gpu'))?.p
  const fromCalc = totalW * 1.35
  const fromVendor = num(gpu?.attrs?.rec_psu_w) || 0
  const need = Math.max(fromCalc, fromVendor)
  return PSU_TIERS.find((t) => t >= need) || PSU_TIERS[PSU_TIERS.length - 1]
}

// สถานะ PSU ที่เลือกเทียบกับโหลด: good | recommended | overkill | not_enough
export function psuStatus(psuW, totalW) {
  if (!psuW || !totalW) return null
  if (psuW < totalW) return 'not_enough'
  if (psuW < totalW * 1.3) return 'good'        // พอใช้ แต่ headroom น้อย
  if (psuW <= totalW * 2.2) return 'recommended' // ช่วงกำลังดี
  return 'overkill'
}

// ===================================================================
// กรองตัวเลือกของ slot เทียบกับของที่เลือกแล้ว (ใช้ในหน้าเลือกสินค้า)
// วิธี: ลองใส่สินค้าเข้า build ชั่วคราวแล้วดู issue ที่ "เกิดใหม่" ของระดับ fail/warn
// ===================================================================
export function splitCandidates(slotKey, candidates, items, byId) {
  const slot = slotByKey[slotKey]
  const others = items.filter((it) => it.slot !== slotKey || slot?.multi)
  const baseFails = countByCode(checkBuild(others, byId))

  const ok = []
  const warn = []
  const blocked = []
  for (const p of candidates) {
    const trial = [...others, { slot: slotKey, id: p.id, qty: 1 }]
    const trialById = byId[p.id] ? byId : { ...byId, [p.id]: p }
    const issues = checkBuild(trial, trialById)
    // เอาเฉพาะ issue ที่เพิ่มขึ้นจากเดิม และเกี่ยวกับการเพิ่มชิ้นนี้
    const fresh = issues.filter((i) => i.level !== 'info' && (countByCode(issues)[i.code] || 0) > (baseFails[i.code] || 0))
    const fails = fresh.filter((i) => i.level === 'fail')
    const warns = fresh.filter((i) => i.level === 'warn')
    if (fails.length) blocked.push({ p, issues: fails })
    else if (warns.length) warn.push({ p, issues: warns })
    else ok.push({ p, issues: [] })
  }
  return { ok, warn, blocked }
}
const countByCode = (issues) => issues.reduce((m, i) => { m[i.code] = (m[i.code] || 0) + 1; return m }, {})

// ===================================================================
// คะแนนประสิทธิภาพ (จาก cpu_score/gpu_score ที่ admin กรอก - ไม่มีข้อมูล = ไม่แสดง)
// ===================================================================
const scale = (v, lo, hi) => Math.max(0, Math.min(5, Math.round(((v - lo) / (hi - lo)) * 5)))

export function perfEstimate(items, byId) {
  const cpu = first(pickedOf(items, byId, 'cpu'))?.p
  const gpu = first(pickedOf(items, byId, 'gpu'))?.p
  const cs = num(cpu?.attrs?.cpu_score)
  const gs = num(gpu?.attrs?.gpu_score)
  if (!cs || !gs) return null
  const eff = Math.min(gs, cs * 1.25) // คอขวด CPU กดเพดานเฟรมเรต
  return {
    p1080: scale(eff, 30, 120),
    p1440: scale(eff, 50, 150),
    p4k: scale(eff, 80, 190),
  }
}

// ===================================================================
// สรุปยอด (ราคาคิดสด - logic ราคาเดียวกับส่วนอื่นของร้าน: p.price คือราคาหลังลดแล้ว)
// ===================================================================
export function buildTotals(items, byId) {
  let total = 0
  let count = 0
  let outOfStock = 0
  for (const it of items) {
    const p = byId[it.id]
    if (!p) continue
    const qty = it.qty || 1
    total += p.price * qty
    count += qty
    if (p.stock <= 0) outOfStock += 1
  }
  return { total, count, outOfStock }
}

// ความเข้ากันโดยรวม: fail = ไม่ผ่าน, warn = ควรระวัง, ok = ผ่าน
export function compatSummary(issues) {
  const fails = issues.filter((i) => i.level === 'fail').length
  const warns = issues.filter((i) => i.level === 'warn').length
  return { fails, warns, status: fails ? 'fail' : warns ? 'warn' : 'ok' }
}
