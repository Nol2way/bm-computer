import { useEffect, useState } from 'react'
import ProductRow from './ProductRow'
import { Icon } from './Icons'
import { useLang } from '../i18n/LanguageContext'

// แฟลชเซลรายวัน นับถอยหลังถึง 20:00 (แบบ iHaveCPU)
function nextEight() {
  const t = new Date(); t.setHours(20, 0, 0, 0)
  if (new Date() >= t) t.setDate(t.getDate() + 1)
  return t
}
function useCountdown(target) {
  const [ms, setMs] = useState(() => target - new Date())
  useEffect(() => {
    const id = setInterval(() => setMs(target - new Date()), 1000)
    return () => clearInterval(id)
  }, [target])
  const s = Math.max(0, Math.floor(ms / 1000))
  const p = (n) => String(n).padStart(2, '0')
  return { h: p(Math.floor(s / 3600)), m: p(Math.floor((s % 3600) / 60)), s: p(s % 60) }
}

export default function FlashSale({ items }) {
  const { t } = useLang()
  const [target] = useState(nextEight)
  const { h, m, s } = useCountdown(target)
  if (!items?.length) return null

  const Box = ({ v }) => <span className="nums rounded bg-black/30 px-2 py-1">{v}</span>

  return (
    <section className="mt-12 overflow-hidden rounded-2xl border border-brand-200 dark:border-brand-900/60">
      <div className="flex flex-wrap items-center gap-x-3 gap-y-2 bg-gradient-to-r from-brand-700 to-brand-600 px-5 py-3 text-white">
        <Icon name="bolt" className="text-amber-300" />
        <span className="text-lg font-extrabold tracking-wide">{t('home.flashSale')}</span>
        <span className="ml-auto text-sm text-brand-100">{t('home.endsIn')}</span>
        <div className="flex items-center gap-1 font-bold"><Box v={h} />:<Box v={m} />:<Box v={s} /></div>
      </div>
      <div className="bg-surface p-4">
        <ProductRow items={items} />
      </div>
    </section>
  )
}
