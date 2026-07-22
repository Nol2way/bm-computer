import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Icon } from './Icons'
import { cx } from '../lib/ui'
import { useLang } from '../i18n/LanguageContext'

// แบนเนอร์หนึ่งใบ: ใส่รูปในหลังบ้าน = โชว์รูป · ไม่ใส่รูป (หรือรูปพัง) = แบนเนอร์ข้อความจากโค้ด
// แบบข้อความคมทุกความละเอียด อ่านออกโดยโปรแกรมอ่านหน้าจอ และแก้ข้อความในหลังบ้านได้ทันที
// (ไม่ต้องจ้างทำรูปใหม่ทุกครั้งที่เปลี่ยนโปร)

// ชุดสีเลือกได้จากหลังบ้าน (คอลัมน์ slides.theme)
const THEMES = {
  brand:   { bg: 'linear-gradient(115deg,#450a0a 0%,#991b1b 45%,#dc2626 100%)', glow: 'rgba(248,113,113,.45)' },
  dark:    { bg: 'linear-gradient(115deg,#09090b 0%,#18181b 45%,#334155 100%)', glow: 'rgba(220,38,38,.42)' },
  amber:   { bg: 'linear-gradient(115deg,#451a03 0%,#b45309 45%,#f59e0b 100%)', glow: 'rgba(253,224,71,.40)' },
  emerald: { bg: 'linear-gradient(115deg,#022c22 0%,#065f46 45%,#059669 100%)', glow: 'rgba(52,211,153,.40)' },
  violet:  { bg: 'linear-gradient(115deg,#2e1065 0%,#5b21b6 45%,#7c3aed 100%)', glow: 'rgba(196,181,253,.42)' },
}

// แบนเนอร์ของร้านเตรียมไว้ 2 ขนาด (public/banners/<ชื่อ>-1600.webp และ -800.webp)
// เจอรูปแบบนี้เมื่อไหร่ให้ทำ srcset ให้อัตโนมัติ เบราว์เซอร์จะเลือกไฟล์เล็กบนจอเล็ก/มือถือ
// รูปจาก URL ภายนอก (แอดมินวางลิงก์เอง) คืนค่าว่าง = ใช้ src ปกติ
function srcSetFor(url) {
  const m = /^(.*)-1600\.webp$/.exec(url || '')
  return m ? `${m[1]}-800.webp 800w, ${url} 1600w` : undefined
}

// พื้นหลังเบลอไม่ต้องคมชัด -> ใช้ไฟล์เล็กเสมอ ประหยัดแบนด์วิดท์ (ภาพนี้จะถูกเบลอทิ้งอยู่แล้ว)
function srcFallbackSmall(url) {
  const m = /^(.*)-1600\.webp$/.exec(url || '')
  return m ? `${m[1]}-800.webp` : url
}

// ขนาดตัวอักษร/ระยะห่าง ต่างกันระหว่างแบนเนอร์ใหญ่ (hero) กับใบเล็ก (โปรโมชัน)
const SIZES = {
  hero: {
    pad: 'px-7 sm:px-12', title: 'text-2xl sm:text-4xl xl:text-5xl', sub: 'mt-2.5 max-w-[42ch] text-sm sm:text-base',
    cta: 'mt-6 px-6 py-3 text-sm', badge: 'text-[11px] sm:text-xs', maxW: 'max-w-[62%]',
  },
  promo: {
    pad: 'px-6', title: 'text-lg sm:text-xl', sub: 'mt-1.5 max-w-[34ch] text-xs sm:text-[13px]',
    cta: 'mt-4 px-4 py-2 text-xs', badge: 'text-[10px]', maxW: 'max-w-full',
  },
}

function TextBanner({ slide, size, lang }) {
  const th = THEMES[slide.theme] || THEMES.brand
  const s = SIZES[size]
  // อังกฤษ: ใช้ฟิลด์ _en ถ้าแอดมินกรอกไว้ · ไม่กรอก = ใช้ข้อความไทย (ดีกว่าโชว์ช่องว่าง)
  const tr = (k) => (lang === 'en' ? slide[`${k}_en`] || slide[k] : slide[k])
  const title = tr('title')
  const subtitle = tr('subtitle')
  const badge = tr('badge')
  const cta = tr('cta_label')
  return (
    <div className="group/banner relative h-full w-full overflow-hidden text-white" style={{ background: th.bg }}>
      {/* แสงเรืองมุมขวาบน - ใช้ radial-gradient ไม่ใช่ filter blur (เบากว่ามาก ไม่ทำภาพกระตุกตอนสไลด์) */}
      <span aria-hidden="true" className="absolute -right-20 -top-24 h-[26rem] w-[26rem] transition-transform duration-700 group-hover/banner:scale-110"
        style={{ background: `radial-gradient(circle, ${th.glow} 0%, transparent 65%)` }} />
      {/* เส้นกริดจางให้มีมิติ เฟดหายตรงขอบ */}
      <span aria-hidden="true" className="absolute inset-0 opacity-[0.07]"
        style={{
          backgroundImage: 'linear-gradient(to right,#fff 1px,transparent 1px),linear-gradient(to bottom,#fff 1px,transparent 1px)',
          backgroundSize: '48px 48px',
          maskImage: 'radial-gradient(ellipse at 70% 40%, black 30%, transparent 80%)',
          WebkitMaskImage: 'radial-gradient(ellipse at 70% 40%, black 30%, transparent 80%)',
        }} />
      {/* แสงกวาดตอน hover */}
      <span aria-hidden="true" className="absolute inset-y-[-40%] left-[-30%] w-1/5 rotate-12 transition-transform duration-700 ease-out group-hover/banner:translate-x-[600%]"
        style={{ background: 'linear-gradient(90deg,transparent,rgba(255,255,255,.10),transparent)' }} />

      <div className={cx('relative flex h-full flex-col justify-center', s.pad, s.maxW)}>
        {badge && (
          <span className={cx('mb-3 w-fit rounded-full bg-white/15 px-2.5 py-1 font-bold uppercase tracking-wide backdrop-blur-sm', s.badge)}>
            {badge}
          </span>
        )}
        <h3 className={cx('font-extrabold leading-[1.15] tracking-tight drop-shadow-sm', s.title)}>{title}</h3>
        {subtitle && <p className={cx('leading-relaxed text-white/85', s.sub)}>{subtitle}</p>}
        {cta && (
          <span className={cx('inline-flex w-fit items-center gap-1.5 rounded-xl bg-white font-bold text-zinc-900 shadow-lg transition-transform group-hover/banner:translate-x-0.5', s.cta)}>
            {cta} <Icon name="arrowRight" size={size === 'hero' ? 16 : 14} />
          </span>
        )}
      </div>
    </div>
  )
}

// slide = แถวจากตาราง slides · size = 'hero' | 'promo'
// langOverride: ใช้ในหลังบ้านเพื่อพรีวิวภาษาที่กำลังแก้อยู่ (หน้าร้านไม่ต้องส่ง ใช้ภาษาของผู้ใช้)
export default function Banner({ slide, size = 'hero', eager = false, langOverride }) {
  const { lang: uiLang } = useLang()
  const lang = langOverride || uiLang
  const [broken, setBroken] = useState(false)
  const hasImage = !!slide.image_url && !broken
  const label = (lang === 'en' ? slide.title_en || slide.title : slide.title) || ''

  const inner = hasImage ? (
    // งานอาร์ตแบนเนอร์เป็นโปสเตอร์ (สัดส่วนสูงกว่ากรอบ hero มาก)
    // ถ้า object-cover จะโดนครอปจนอ่านไม่ครบ -> ใช้ object-contain ไม่ให้เสียเนื้อหา
    // แล้วเติมช่องว่างสองข้างด้วยภาพเดิมแบบเบลอ+ซูม ให้ดูตั้งใจ ไม่ใช่แถบดำโล่ง
    <div className="relative h-full w-full overflow-hidden bg-zinc-950">
      <img
        src={srcFallbackSmall(slide.image_url)}
        alt=""
        aria-hidden="true"
        className="absolute inset-0 h-full w-full scale-110 object-cover opacity-45 blur-2xl"
        loading="lazy"
        decoding="async"
      />
      <img
        src={slide.image_url}
        srcSet={srcSetFor(slide.image_url)}
        sizes={size === 'hero' ? '(max-width: 1240px) 100vw, 1200px' : '(max-width: 640px) 100vw, 380px'}
        alt={label}
        className="relative h-full w-full object-contain"
        loading={eager ? 'eager' : 'lazy'}
        // แบนเนอร์ใบแรกคือภาพใหญ่ที่สุดที่ผู้ใช้เห็นทันที (LCP) - บอกเบราว์เซอร์ให้โหลดก่อนเพื่อน
        // React 18 ยังไม่รู้จัก fetchPriority แบบ camelCase ต้องเขียนตัวพิมพ์เล็กให้ผ่านไปเป็น attribute ตรงๆ
        fetchpriority={eager ? 'high' : 'auto'}
        decoding="async"
        onError={() => setBroken(true)}
      />
    </div>
  ) : (
    <TextBanner slide={slide} size={size} lang={lang} />
  )

  // แบนเนอร์ที่ตั้งลิงก์ไว้ในหลังบ้าน = กดได้ · ไม่ตั้ง = ภาพประกอบเฉยๆ
  if (!slide.link) return inner
  return (
    <Link to={slide.link} className="block h-full w-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500"
      aria-label={label || undefined}>
      {inner}
    </Link>
  )
}
