import { Link } from 'react-router-dom'
import { fmt } from '../data/mock'
import { Icon } from './Icons'
import { badgeMap, badgeLabel, cx } from '../lib/ui'
import { useLang } from '../i18n/LanguageContext'

export default function ProductCard({ p }) {
  const { lang, t } = useLang()
  const b = p.badge ? badgeMap[p.badge] : null
  return (
    <article className="card-hover group flex flex-col overflow-hidden rounded-2xl border border-line bg-surface hover:border-zinc-300 hover:shadow-xl hover:shadow-black/5 dark:hover:border-zinc-700">
      <Link to={`/product/${p.id}`} className="relative block">
        {p.images?.[0]
          ? <img src={p.images[0]} alt={p.name} loading="lazy" className="aspect-square w-full bg-white object-contain p-3"
              onError={(e) => { e.currentTarget.src = 'https://placehold.co/600x600/f1f1f4/9ca3af?text=BM+Computer' }} />
          : <div className="ph grid aspect-square place-items-center text-zinc-400"><Icon name="image" size={40} /></div>}
        {p.discount > 0 && <span className="absolute left-3 top-3 rounded-full bg-brand-600 px-2.5 py-1 text-[11px] font-bold text-white">-{p.discount}%</span>}
        {b && <span className={cx('absolute right-3 top-3 rounded-full px-2.5 py-1 text-[11px] font-semibold', b.cls)}>{badgeLabel[lang][p.badge]}</span>}
      </Link>
      <div className="flex flex-1 flex-col gap-1.5 p-4">
        <span className="text-xs text-muted">{t(`cats.${p.cat}`)} · {p.brand}</span>
        <Link to={`/product/${p.id}`} className="line-clamp-2 min-h-[2.6em] text-sm font-semibold leading-snug transition-colors group-hover:text-brand-600">{p.name}</Link>
        <span className="flex items-center gap-1 text-xs text-amber-500">★ {p.rating} <span className="text-muted">({p.reviews})</span></span>
        <div className="mt-auto flex items-baseline gap-2 pt-1">
          <span className="nums text-lg font-bold text-brand-600">฿{fmt(p.price)}</span>
          {p.old && <span className="nums text-xs text-zinc-400 line-through">฿{fmt(p.old)}</span>}
        </div>
        <span className={cx('text-xs font-semibold', p.stock <= 5 ? 'text-amber-600 dark:text-amber-400' : 'text-emerald-600 dark:text-emerald-400')}>
          {p.stock <= 5 ? t('common.lowStock', { n: p.stock }) : t('common.inStock')}
        </span>
      </div>
      <div className="p-4 pt-0">
        <button className="flex w-full items-center justify-center gap-2 rounded-lg bg-brand-600 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-brand-700 cursor-pointer">
          <Icon name="cart" size={16} /> {t('common.addToCart')}
        </button>
      </div>
    </article>
  )
}
