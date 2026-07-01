import { Icon } from '../../components/Icons'
import { cx } from '../../lib/ui'

export const inputCls = 'w-full rounded-lg border border-line bg-surface px-3 py-2.5 text-sm focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20'

export function PageHead({ title, action }) {
  return (
    <div className="mb-5 flex items-center justify-between gap-3">
      <h1 className="text-xl font-bold">{title}</h1>
      {action}
    </div>
  )
}

export function Field({ label, children, className = '' }) {
  return (
    <label className={cx('block', className)}>
      <span className="mb-1.5 block text-sm font-semibold">{label}</span>
      {children}
    </label>
  )
}

// แถวแสดงข้อมูล (โหมดดู)
export function InfoRow({ label, value }) {
  return (
    <div className="grid grid-cols-1 gap-0.5 border-b border-line py-3 last:border-0 sm:grid-cols-[200px_1fr] sm:gap-4">
      <span className="text-sm text-muted">{label}</span>
      <span className="text-sm">{value || '-'}</span>
    </div>
  )
}

export function PrimaryBtn({ children, className = '', ...rest }) {
  return (
    <button {...rest} className={cx('inline-flex items-center justify-center gap-2 rounded-lg bg-brand-600 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-brand-700 disabled:cursor-not-allowed disabled:opacity-50 cursor-pointer', className)}>
      {children}
    </button>
  )
}

export function GhostBtn({ children, className = '', ...rest }) {
  return (
    <button {...rest} className={cx('inline-flex items-center justify-center gap-2 rounded-lg border border-line bg-surface px-4 py-2.5 text-sm font-semibold transition-colors hover:bg-surface2 disabled:opacity-50 cursor-pointer', className)}>
      {children}
    </button>
  )
}

export function DefaultBadge({ children }) {
  return <span className="rounded-full bg-brand-50 px-2 py-0.5 text-[11px] font-semibold text-brand-700 dark:bg-brand-600/15 dark:text-brand-400">{children}</span>
}

export function EmptyState({ icon = 'box', text }) {
  return (
    <div className="grid place-items-center gap-2 rounded-2xl border border-dashed border-line bg-surface py-14 text-center text-muted">
      <Icon name={icon} size={36} />
      <span className="text-sm">{text}</span>
    </div>
  )
}

export function Spinner() {
  return <div className="grid place-items-center py-14 text-muted"><Icon name="loader" size={28} className="animate-spin" /></div>
}
