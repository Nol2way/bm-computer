import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import ProductCard from '../../components/ProductCard'
import { useLang } from '../../i18n/LanguageContext'
import { accountApi } from '../../lib/accountApi'
import { useWishlist } from '../../wishlist/WishlistContext'
import { PageHead, EmptyState, PrimaryBtn } from './ui'
import { Skeleton, ProductGridSkeleton } from '../../components/Skeleton'

export default function Wishlist() {
  const { t } = useLang()
  const wl = useWishlist()
  const [items, setItems] = useState(null)

  // โหลดสินค้าที่ถูกใจ + รีเฟรชเมื่อกดหัวใจ (wl.slugs เปลี่ยน)
  useEffect(() => {
    let alive = true
    accountApi.listWishlist().then((r) => { if (alive) setItems(r.items) }).catch(() => { if (alive) setItems([]) })
    return () => { alive = false }
  }, [wl.slugs])

  if (items === null) return (
    <div aria-hidden="true">
      <div className="mb-5"><Skeleton className="h-6 w-40" /></div>
      <ProductGridSkeleton count={4} className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4" />
    </div>
  )

  return (
    <div>
      <PageHead title={t('account.wishlist')} />
      {items.length === 0 ? (
        <EmptyState icon="heart" text={t('account.emptyWishlist')} />
      ) : (
        <>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
            {items.map((p) => <ProductCard key={p.id} p={p} />)}
          </div>
        </>
      )}
      {items.length === 0 && (
        <div className="mt-4 flex justify-center">
          <Link to="/products"><PrimaryBtn>{t('account.browseProducts')}</PrimaryBtn></Link>
        </div>
      )}
    </div>
  )
}
