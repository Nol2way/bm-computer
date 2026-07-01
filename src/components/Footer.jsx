import { Link } from 'react-router-dom'
import BrandLogo from './BrandLogo'
import { useLang } from '../i18n/LanguageContext'

export default function Footer() {
  const { t } = useLang()
  const col = 'block py-1 text-sm text-zinc-400 transition-colors hover:text-white'
  return (
    <footer className="mt-16 bg-zinc-950 pt-10 pb-6 text-zinc-300">
      <div className="mx-auto max-w-[1200px] px-4">
        <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <div className="mb-3"><BrandLogo emblemClass="h-10" /></div>
            <p className="max-w-[32ch] text-sm text-zinc-400">{t('footer.about')}</p>
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
            <a className={col} href="#">LINE: @bmcomputer</a>
            <a className={col} href="#">02-000-0000</a>
            <a className={col} href="#">Facebook</a>
          </div>
        </div>
        <div className="mt-8 flex flex-wrap justify-between gap-3 border-t border-white/10 pt-5 text-xs text-zinc-500">
          <span>{t('footer.rights')}</span>
          <span>{t('footer.payNote')}</span>
        </div>
      </div>
    </footer>
  )
}
