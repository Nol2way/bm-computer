import { Link } from 'react-router-dom'
import { fmt } from '../data/mock'
import { Icon } from '../components/Icons'
import { cx } from '../lib/ui'
import { useLang } from '../i18n/LanguageContext'
import { useCart } from '../cart/CartContext'
import { useCartStock } from '../cart/useCartStock'
import { useCatalog } from '../catalog/CatalogContext'
import { usePageMeta } from '../lib/usePageMeta'

const wrap = 'mx-auto max-w-[1200px] px-4'
const PH = 'https://placehold.co/200x200/f1f1f4/9ca3af?text=BM'

export default function Cart() {
  const { t } = useLang()
  const { catName } = useCatalog()
  const { items, setQty, remove, subtotal, shipping, total } = useCart()
  const { lines, problems, blocked } = useCartStock(items)
  usePageMeta(t('cart.title'))

  if (items.length === 0) {
    return (
      <div className={`${wrap} py-16`}>
        <div className="mx-auto max-w-md rounded-2xl border border-line bg-surface p-10 text-center">
          <div className="mx-auto mb-4 grid h-16 w-16 place-items-center rounded-full bg-surface2 text-muted"><Icon name="cart" size={30} /></div>
          <h2 className="text-xl font-bold">{t('cart.empty')}</h2>
          <Link to="/products" className="mt-5 inline-block rounded-xl bg-brand-600 px-6 py-3 font-semibold text-white transition-colors hover:bg-brand-700">{t('list.products')}</Link>
        </div>
      </div>
    )
  }

  return (
    <div className={`${wrap} py-6`}>
      <nav className="flex gap-1.5 py-3 text-sm text-muted"><Link to="/" className="hover:text-brand-600">{t('list.home')}</Link> / <span className="text-fg">{t('cart.title')}</span></nav>
      <h1 className="mb-5 text-2xl font-bold">{t('cart.title')} ({items.length})</h1>

      {blocked && (
        <div className="mb-5 flex items-start gap-2.5 rounded-xl border border-red-500/30 bg-red-500/10 p-4 text-sm" role="alert">
          <Icon name="alert" size={18} className="mt-0.5 shrink-0 text-red-600 dark:text-red-400" />
          <div>
            <b className="text-red-600 dark:text-red-400">{t('cart.stockIssueTitle')}</b>
            <p className="mt-1 text-muted">{t('cart.stockIssueHint')}</p>
          </div>
        </div>
      )}

      <div className="grid items-start gap-6 lg:grid-cols-[1fr_360px]">
        <div className="flex flex-col gap-4">
          {lines.map((it) => (
            <div key={it.slug} className={cx('grid grid-cols-[80px_1fr] items-center gap-4 rounded-xl border bg-surface p-4 sm:grid-cols-[90px_1fr_auto]',
              it.out || it.short ? 'border-red-500/40' : 'border-line')}>
              <Link to={`/product/${it.slug}`} className="overflow-hidden rounded-lg bg-white">
                <img src={it.image || PH} alt={it.name} className={cx('aspect-square w-full object-contain p-1', it.out && 'opacity-50 grayscale')} onError={(e) => { e.currentTarget.src = PH }} />
              </Link>
              <div>
                <Link to={`/product/${it.slug}`} className="font-semibold hover:text-brand-600">{it.name}</Link>
                <div className="text-sm text-muted">{it.cat ? catName(it.cat) : ''} {it.brand ? `· ${it.brand}` : ''}</div>
                {/* สถานะสต็อกจริง: ของหมด/ไม่พอ/เหลือน้อย - ตรวจกับหลังบ้านทุกครั้งที่เปิดตะกร้า */}
                {it.out ? (
                  <div className="mt-1 flex items-center gap-1.5 text-sm font-semibold text-red-600 dark:text-red-400">
                    <Icon name="alert" size={14} /> {it.missing || it.inactive ? t('cart.unavailable') : t('cart.outOfStock')}
                  </div>
                ) : it.short ? (
                  <div className="mt-1 flex items-center gap-1.5 text-sm font-semibold text-red-600 dark:text-red-400">
                    <Icon name="alert" size={14} /> {t('cart.onlyNLeft', { n: it.stock })}
                  </div>
                ) : it.stock !== null && it.stock <= 5 ? (
                  <div className="mt-1 text-sm font-semibold text-amber-600 dark:text-amber-400">{t('common.lowStock', { n: it.stock })}</div>
                ) : null}
                <div className="mt-2 flex flex-wrap items-center gap-4">
                  <div className="inline-flex items-center overflow-hidden rounded-lg border border-line">
                    <button onClick={() => setQty(it.slug, it.qty - 1)} disabled={it.qty <= 1} className="grid h-9 w-9 place-items-center hover:bg-surface2 cursor-pointer disabled:cursor-not-allowed disabled:opacity-40" aria-label="-"><Icon name="minus" size={14} /></button>
                    <span className="nums w-10 text-center text-sm">{it.qty}</span>
                    {/* เพิ่มจำนวนเกินสต็อกไม่ได้ (สั่งไปก็ถูกปฏิเสธที่หลังบ้านอยู่ดี) */}
                    <button onClick={() => setQty(it.slug, it.qty + 1)} disabled={it.stock !== null && it.qty >= it.stock}
                      className="grid h-9 w-9 place-items-center hover:bg-surface2 cursor-pointer disabled:cursor-not-allowed disabled:opacity-40" aria-label="+"><Icon name="plus" size={14} /></button>
                  </div>
                  {it.short && (
                    <button onClick={() => setQty(it.slug, it.stock)} className="rounded-lg border border-line px-2.5 py-1 text-xs font-semibold hover:bg-surface2 cursor-pointer">
                      {t('cart.setToMax', { n: it.stock })}
                    </button>
                  )}
                  <button onClick={() => remove(it.slug)} className="flex items-center gap-1 text-sm text-brand-600 hover:underline cursor-pointer"><Icon name="trash" size={15} /> {t('cart.remove')}</button>
                </div>
              </div>
              <div className="col-span-2 text-right sm:col-span-1">
                <div className="nums font-bold text-brand-600">฿{fmt(it.price * it.qty)}</div>
                {it.old && <div className="nums text-xs text-zinc-400 line-through">฿{fmt(it.old * it.qty)}</div>}
              </div>
            </div>
          ))}
          <Link to="/products" className="w-fit rounded-lg border border-line px-4 py-2 text-sm font-semibold transition-colors hover:bg-surface2">{t('cart.continue')}</Link>
        </div>

        <aside className="rounded-2xl border border-line bg-surface p-5 lg:sticky lg:top-[150px]">
          <h3 className="mb-3 font-bold">{t('cart.summary')}</h3>
          <Line l={t('cart.subtotal')} v={`฿${fmt(subtotal)}`} />
          <Line l={t('cart.shipping')} v={shipping === 0 ? <b className="text-emerald-600 dark:text-emerald-400">{t('common.free')}</b> : `฿${fmt(shipping)}`} />
          <div className="mt-3 flex justify-between border-t border-line pt-4 text-lg font-bold"><span>{t('cart.total')}</span><b className="nums text-brand-600">฿{fmt(total)}</b></div>
          {blocked ? (
            <div className="mt-4 cursor-not-allowed rounded-xl bg-brand-600/40 py-3 text-center font-semibold text-white" aria-disabled="true">{t('cart.checkout')}</div>
          ) : (
            <Link to="/checkout" className="mt-4 block rounded-xl bg-brand-600 py-3 text-center font-semibold text-white transition-colors hover:bg-brand-700">{t('cart.checkout')}</Link>
          )}
          {blocked && <p className="mt-2 text-center text-xs text-red-600 dark:text-red-400">{t('cart.fixStockFirst', { n: problems.length })}</p>}
          <p className="mt-3 flex items-center justify-center gap-1.5 text-center text-xs text-muted"><Icon name="lock" size={13} /> {t('cart.secure')}</p>
        </aside>
      </div>
    </div>
  )
}

function Line({ l, v }) {
  return <div className="flex justify-between py-1.5 text-sm text-muted"><span>{l}</span><span className="nums text-fg">{v}</span></div>
}
