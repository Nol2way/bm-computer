import { Link } from 'react-router-dom'
import { asset } from '../lib/ui'

// โลโก้แบรนด์ (emblem + wordmark) ใช้ร่วมกันทั้ง header และ footer ให้ตรงกัน
export default function BrandLogo({ emblemClass = 'h-9 sm:h-11', textWrapClass = '', to = '/' }) {
  const content = (
    <>
      <img src={asset('emblem.png')} alt="" className={`w-auto drop-shadow ${emblemClass}`} />
      <span className={`leading-none ${textWrapClass}`}>
        <span className="block text-[1.15rem] font-extrabold tracking-wide text-white">COMPUTER</span>
        <span className="mt-0.5 block text-[11px] font-semibold tracking-[0.2em] text-brand-500">บ้านมีคอม</span>
      </span>
    </>
  )
  if (!to) return <div className="flex items-center gap-2.5">{content}</div>
  return <Link to={to} className="flex shrink-0 items-center gap-2.5" aria-label="BM Computer บ้านมีคอม">{content}</Link>
}
