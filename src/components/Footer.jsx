import { Link } from 'react-router-dom'
import BrandLogo from './BrandLogo'
import { Icon } from './Icons'
import { useLang } from '../i18n/LanguageContext'

export default function Footer() {
  const { t, lang } = useLang()
  const col = 'block py-1 text-sm text-zinc-400 transition-colors hover:text-white'
  const social = [
    { icon: 'facebook', href: '#', label: 'Facebook' },
    { icon: 'line', href: '#', label: 'LINE' },
    { icon: 'instagram', href: '#', label: 'Instagram' },
    { icon: 'youtube', href: '#', label: 'YouTube' },
  ]

  return (
    <footer className="mt-16 bg-zinc-950 text-zinc-300">
      <div className="mx-auto max-w-[1200px] px-4 pt-10 pb-6">
        <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <div className="mb-3"><BrandLogo emblemClass="h-10" /></div>
            <p className="max-w-[32ch] text-sm text-zinc-400">{t('footer.about')}</p>
            <div className="mt-4 flex gap-2">
              {social.map((s) => (
                <a key={s.icon} href={s.href} aria-label={s.label} title={s.label}
                  className="grid h-9 w-9 place-items-center rounded-lg bg-white/5 text-zinc-300 transition-colors hover:bg-brand-600 hover:text-white">
                  <Icon name={s.icon} size={18} />
                </a>
              ))}
            </div>
          </div>

          <div>
            <h4 className="mb-2 font-semibold text-white">{t('footer.shopping')}</h4>
            <Link className={col} to="/products">{t('footer.allProducts')}</Link>
            <Link className={col} to="/builder">{t('footer.builder')}</Link>
            <Link className={col} to="/products?cat=gpu">{t('cats.gpu')}</Link>
            <Link className={col} to="/products?cat=notebook">{t('cats.notebook')}</Link>
          </div>

          <div>
            <h4 className="mb-2 font-semibold text-white">{t('footer.help')}</h4>
            <Link className={col} to="/track">{t('footer.track')}</Link>
            <Link className={col} to="/orders">{t('footer.history')}</Link>
            <a className={col} href="#">{t('footer.payInfo')}</a>
            <a className={col} href="#">{t('footer.warranty')}</a>
          </div>

          <div>
            <h4 className="mb-2 font-semibold text-white">{t('footer.contact')}</h4>
            <a className="flex items-center gap-2 py-1 text-sm text-zinc-400 hover:text-white" href="#"><Icon name="line" size={15} /> @bmcomputer</a>
            <a className="flex items-center gap-2 py-1 text-sm text-zinc-400 hover:text-white" href="tel:020000000"><Icon name="phone" size={15} /> 02-000-0000</a>
            <a className="flex items-center gap-2 py-1 text-sm text-zinc-400 hover:text-white" href="mailto:support@bmcomputer.co"><Icon name="mail" size={15} /> support@bmcomputer.co</a>
          </div>
        </div>

        {/* ช่องทางชำระเงิน */}
        <div className="mt-8 flex flex-wrap items-center gap-3 border-t border-white/10 pt-6">
          <span className="text-sm font-semibold text-white">{lang === 'th' ? 'ช่องทางชำระเงิน' : 'Payment'}</span>
          <span className="flex items-center gap-1.5 rounded-lg bg-white/5 px-3 py-1.5 text-sm"><Icon name="qr" size={16} className="text-brand-400" /> PromptPay</span>
        </div>

        <div className="mt-6 flex flex-wrap justify-between gap-3 text-xs text-zinc-500">
          <span>{t('footer.rights')}</span>
          <span>{t('footer.payNote')}</span>
        </div>
      </div>
    </footer>
  )
}
