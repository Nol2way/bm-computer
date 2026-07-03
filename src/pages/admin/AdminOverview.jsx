import { fmt } from '../../data/mock'
import { Icon } from '../../components/Icons'
import { adminStats } from '../../lib/api'
import { useFetch } from '../../lib/useFetch'
import { useLang } from '../../i18n/LanguageContext'
import { Skeleton } from '../../components/Skeleton'

export default function AdminOverview() {
  const { t } = useLang()
  const { data, loading } = useFetch(() => adminStats(), [])
  const s = data || { products: 0, orders: 0, revenue: 0 }
  const cards = [
    { icon: 'box', label: t('admin.totalProducts'), value: fmt(s.products) },
    { icon: 'receipt', label: t('admin.totalOrders'), value: fmt(s.orders) },
    { icon: 'card', label: t('admin.totalRevenue'), value: `฿${fmt(s.revenue)}` },
  ]
  return (
    <div>
      <h3 className="mb-4 font-bold">{t('admin.storeOverview')}</h3>
      <div className="grid gap-4 sm:grid-cols-3">
        {cards.map((c) => (
          <div key={c.label} className="rounded-2xl border border-line bg-surface p-5">
            <div className="mb-2 grid h-10 w-10 place-items-center rounded-full bg-brand-50 text-brand-600 dark:bg-brand-600/15"><Icon name={c.icon} /></div>
            {loading ? <Skeleton className="h-8 w-24" /> : <div className="nums text-2xl font-bold">{c.value}</div>}
            <div className="mt-1 text-sm text-muted">{c.label}</div>
          </div>
        ))}
      </div>
      <p className="mt-4 text-sm text-muted">{t('admin.overviewHint')}</p>
    </div>
  )
}
