import { useEffect } from 'react'
import { useNavigate, useLocation, Link } from 'react-router-dom'
import AuthForm from '../components/AuthForm'
import { Icon } from '../components/Icons'
import { useAuth } from '../auth/AuthContext'
import { useLang } from '../i18n/LanguageContext'
import { usePageMeta } from '../lib/usePageMeta'

// หน้า login/register แบบเต็มหน้า - ฟอร์มเดี่ยวกลางจอ (ตัดแผงแบรนด์/gradient ออก ให้โฟกัสที่ฟอร์ม)
export default function AuthPage({ view }) {
  const { t } = useLang()
  const { user, loading } = useAuth()
  const nav = useNavigate()
  const loc = useLocation()
  const isLogin = view === 'login'
  usePageMeta(isLogin ? t('auth.loginTitle') : t('auth.registerTitle'))

  const redirect = new URLSearchParams(loc.search).get('redirect') || '/'
  const redirectQS = redirect && redirect !== '/' ? `?redirect=${encodeURIComponent(redirect)}` : ''

  // ล็อกอินอยู่แล้ว -> เด้งไปหน้าปลายทางทันที (กันเปิด /login ทั้งที่ล็อกอินแล้ว)
  useEffect(() => {
    if (!loading && user) nav(redirect, { replace: true })
  }, [loading, user, redirect, nav])

  const setView = (v) => nav(`/${v === 'register' ? 'register' : 'login'}${redirectQS}`)
  const onClose = () => nav(redirect, { replace: true })

  return (
    <div className="mx-auto w-full max-w-[480px] px-4 py-8 lg:py-12">
      <Link to="/" className="mb-5 inline-flex items-center gap-1.5 text-sm text-muted transition-colors hover:text-fg">
        <Icon name="chevronLeft" size={16} /> {t('auth.backHome')}
      </Link>
      <AuthForm view={view} setView={setView} onClose={onClose} redirectTo={redirect} />
    </div>
  )
}
