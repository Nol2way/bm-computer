import { useState } from 'react'
import { Link, NavLink } from 'react-router-dom'
import { categories } from '../data/mock'
import { Icon } from './Icons'
import { cx } from '../lib/ui'
import BrandLogo from './BrandLogo'
import { useTheme } from '../theme/ThemeContext'
import { useLang } from '../i18n/LanguageContext'
import { useAuthModal } from './AuthModal'

function ActionBtn({ children, ...rest }) {
  return (
    <button
      className="relative grid h-10 w-10 place-items-center rounded-lg text-zinc-300 transition-colors hover:bg-white/10 hover:text-white cursor-pointer"
      {...rest}
    >
      {children}
    </button>
  )
}

export default function Navbar() {
  const { theme, toggle } = useTheme()
  const { lang, toggle: toggleLang, t } = useLang()
  const { open: openAuth } = useAuthModal()
  const [open, setOpen] = useState(false)

  return (
    <header className="sticky top-0 z-50 bg-zinc-950 text-white shadow-lg shadow-black/20">
      {/* แถบบน */}
      <div className="mx-auto flex h-16 max-w-[1200px] items-center gap-3 px-4">
        <button className="grid h-10 w-10 place-items-center rounded-lg text-zinc-300 hover:bg-white/10 md:hidden cursor-pointer"
          aria-label="menu" onClick={() => setOpen((o) => !o)}>
          <Icon name={open ? 'x' : 'menu'} />
        </button>

        <BrandLogo emblemClass="h-9 sm:h-11" textWrapClass="hidden sm:block" />

        {/* ค้นหา (desktop) */}
        <form className="hidden flex-1 items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 md:flex"
          role="search" onSubmit={(e) => e.preventDefault()}>
          <Icon name="search" size={18} className="text-zinc-400" />
          <input className="w-full bg-transparent text-sm text-white placeholder:text-zinc-500 focus:outline-none"
            placeholder={t('common.search')} aria-label={t('common.search')} />
        </form>

        <div className="ml-auto flex items-center gap-1">
          {/* สลับภาษา */}
          <button onClick={toggleLang} title={t('nav.language')}
            className="flex h-10 items-center gap-1.5 rounded-lg px-2.5 text-sm font-semibold text-zinc-300 transition-colors hover:bg-white/10 hover:text-white cursor-pointer">
            <Icon name="globe" size={18} /><span className="uppercase">{lang}</span>
          </button>
          {/* สลับธีม */}
          <ActionBtn onClick={toggle} title={theme === 'dark' ? t('nav.lightMode') : t('nav.darkMode')} aria-label="toggle theme">
            <Icon name={theme === 'dark' ? 'sun' : 'moon'} />
          </ActionBtn>

          <Link to="/track"><ActionBtn title={t('nav.track')}><Icon name="heart" /></ActionBtn></Link>
          <ActionBtn title={t('nav.login')} onClick={() => openAuth('login')}><Icon name="user" /></ActionBtn>
          <Link to="/cart">
            <ActionBtn title={t('nav.cart')}>
              <Icon name="cart" />
              <span className="absolute right-1 top-1 grid h-[17px] min-w-[17px] place-items-center rounded-full bg-brand-600 px-1 text-[10px] font-bold text-white">3</span>
            </ActionBtn>
          </Link>
        </div>
      </div>

      {/* ค้นหา (mobile) */}
      <div className="border-t border-white/10 px-4 py-2.5 md:hidden">
        <form className="flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2" role="search" onSubmit={(e) => e.preventDefault()}>
          <Icon name="search" size={18} className="text-zinc-400" />
          <input className="w-full bg-transparent text-sm text-white placeholder:text-zinc-500 focus:outline-none" placeholder={t('common.search')} />
        </form>
      </div>

      {/* แถวหมวดหมู่ */}
      <nav className={cx('border-t border-white/10', open ? 'block' : 'hidden md:block')} aria-label="categories">
        <div className="mx-auto flex max-w-[1200px] gap-1 overflow-x-auto px-2 md:px-4 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden flex-col md:flex-row">
          <CatLink to="/products" label={t('nav.all')} accent onClick={() => setOpen(false)} />
          {categories.map((c) => (
            <CatLink key={c.slug} to={`/products?cat=${c.slug}`} icon={c.icon} label={t(`cats.${c.slug}`)} onClick={() => setOpen(false)} />
          ))}
          <CatLink to="/builder" icon="cpu" label={t('nav.builder')} onClick={() => setOpen(false)} />
        </div>
      </nav>
    </header>
  )
}

function CatLink({ to, label, icon, accent, onClick }) {
  return (
    <NavLink to={to} onClick={onClick}
      className={({ isActive }) => cx(
        'flex items-center gap-1.5 whitespace-nowrap border-b-2 px-3 py-2.5 text-sm font-medium transition-colors',
        accent ? 'text-brand-400' : 'text-zinc-300',
        isActive ? 'border-brand-500 text-white' : 'border-transparent hover:text-white',
      )}>
      {icon && <Icon name={icon} size={16} />}{label}
    </NavLink>
  )
}
