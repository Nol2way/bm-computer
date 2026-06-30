import { useState } from 'react'
import { IconGoogle, Icon } from './Icons'
import { useLang } from '../i18n/LanguageContext'

const input = 'w-full rounded-lg border border-line bg-surface px-3 py-2.5 text-sm focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20'

export default function AuthForm({ view, setView, onClose }) {
  const { t } = useLang()
  const [show, setShow] = useState(false)
  const isLogin = view === 'login'

  return (
    <div className="rounded-2xl border border-line bg-surface p-7 shadow-2xl">
      <div className="mb-5 text-center">
        <h2 className="text-xl font-bold">{isLogin ? t('auth.loginTitle') : t('auth.registerTitle')}</h2>
        <p className="mt-1 text-sm text-muted">{isLogin ? t('auth.loginSub') : t('auth.registerSub')}</p>
      </div>

      <button className="flex w-full items-center justify-center gap-2.5 rounded-lg border border-line bg-surface py-3 font-semibold transition-colors hover:bg-surface2 cursor-pointer">
        <IconGoogle /> {isLogin ? t('auth.googleLogin') : t('auth.googleRegister')}
      </button>
      <div className="my-5 flex items-center gap-3 text-xs text-muted before:h-px before:flex-1 before:bg-line after:h-px after:flex-1 after:bg-line">
        {isLogin ? t('auth.orEmail') : t('auth.orEmailReg')}
      </div>

      <form onSubmit={(e) => { e.preventDefault(); onClose?.() }} className="flex flex-col gap-4">
        {!isLogin && (
          <div><label className="mb-1.5 block text-sm font-semibold">{t('auth.displayName')}</label><input className={input} placeholder="ชื่อของคุณ" autoComplete="name" /></div>
        )}
        <div><label className="mb-1.5 block text-sm font-semibold">{t('auth.email')}</label><input className={input} type="email" placeholder="you@email.com" autoComplete="email" /></div>
        <div>
          <div className="mb-1.5 flex items-center justify-between">
            <label className="text-sm font-semibold">{t('auth.password')}</label>
            {isLogin && <a href="#" className="text-sm text-brand-600 hover:underline">{t('auth.forgot')}</a>}
          </div>
          <div className="relative">
            <input className={`${input} pr-10`} type={show ? 'text' : 'password'} placeholder="••••••••" autoComplete={isLogin ? 'current-password' : 'new-password'} />
            <button type="button" onClick={() => setShow((s) => !s)} className="absolute right-2 top-1/2 grid h-7 w-7 -translate-y-1/2 place-items-center rounded text-muted hover:text-fg cursor-pointer" aria-label="toggle password">
              <Icon name={show ? 'sun' : 'moon'} size={16} />
            </button>
          </div>
          {!isLogin && <span className="mt-1 block text-xs text-muted">{t('auth.passwordHint')}</span>}
        </div>

        {isLogin
          ? <label className="flex cursor-pointer items-center gap-2 text-sm"><input type="checkbox" className="h-4 w-4 accent-brand-600" /> {t('auth.remember')}</label>
          : <label className="flex cursor-pointer items-start gap-2 text-sm"><input type="checkbox" className="mt-0.5 h-4 w-4 accent-brand-600" /> {t('auth.agree')}</label>}

        <button className="rounded-xl bg-brand-600 py-3 font-semibold text-white transition-colors hover:bg-brand-700 cursor-pointer">
          {isLogin ? t('auth.signin') : t('auth.signup')}
        </button>
      </form>

      <p className="mt-5 text-center text-sm text-muted">
        {isLogin ? t('auth.noAccount') : t('auth.hasAccount')}{' '}
        <button onClick={() => setView(isLogin ? 'register' : 'login')} className="font-semibold text-brand-600 hover:underline cursor-pointer">
          {isLogin ? t('auth.signup') : t('auth.signin')}
        </button>
      </p>
    </div>
  )
}
