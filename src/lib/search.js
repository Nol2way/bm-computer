// ค้นหาแบบ fuzzy: รองรับพิมพ์ผิด/คำใกล้เคียง (Levenshtein + substring + trigram)

const norm = (s) => (s || '').toString().toLowerCase().replace(/\s+/g, ' ').trim()

function levenshtein(a, b) {
  if (a === b) return 0
  const m = a.length, n = b.length
  if (!m) return n
  if (!n) return m
  let prev = Array.from({ length: n + 1 }, (_, i) => i)
  for (let i = 1; i <= m; i++) {
    const cur = [i]
    for (let j = 1; j <= n; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1
      cur[j] = Math.min(prev[j] + 1, cur[j - 1] + 1, prev[j - 1] + cost)
    }
    prev = cur
  }
  return prev[n]
}

function trigrams(s) {
  const t = `  ${s} `
  const set = new Set()
  for (let i = 0; i < t.length - 2; i++) set.add(t.slice(i, i + 3))
  return set
}
function trigramSim(a, b) {
  const A = trigrams(a), B = trigrams(b)
  if (!A.size || !B.size) return 0
  let inter = 0
  for (const g of A) if (B.has(g)) inter++
  return inter / (A.size + B.size - inter)
}

// คะแนนความเข้ากันของ 1 token กับ haystack (0 = ไม่เจอ)
function tokenScore(token, hay, words) {
  if (!token) return 0
  if (hay.includes(token)) return token.length >= 2 ? 3 : 1.5 // ตรงเป๊ะ (substring)
  let best = 0
  for (const w of words) {
    if (w.startsWith(token) || token.startsWith(w)) best = Math.max(best, 2)
    const d = levenshtein(token, w)
    const tol = token.length <= 4 ? 1 : token.length <= 7 ? 2 : 3
    if (d <= tol) best = Math.max(best, 2 - d * 0.3)
    const sim = trigramSim(token, w)
    if (sim >= 0.4) best = Math.max(best, sim * 1.5)
  }
  return best
}

// filter + sort สินค้าตาม query (fuzzy) — ทุก token ต้องเจออย่างน้อยเล็กน้อย
export function fuzzyFilter(products, query, catName) {
  const q = norm(query)
  if (!q) return products
  const tokens = q.split(' ').filter(Boolean)
  const scored = []
  for (const p of products) {
    const hay = norm([p.name, p.brand, p.cat, catName?.(p.cat)].filter(Boolean).join(' '))
    const words = hay.split(' ')
    let total = 0, ok = true
    for (const tk of tokens) {
      const s = tokenScore(tk, hay, words)
      if (s <= 0.5) { ok = false; break }
      total += s
    }
    if (ok) scored.push({ p, total })
  }
  scored.sort((a, b) => b.total - a.total)
  return scored.map((x) => x.p)
}
