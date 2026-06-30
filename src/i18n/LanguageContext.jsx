import { createContext, useContext, useEffect, useState } from 'react'
import { translations } from './translations'

const LanguageContext = createContext(null)

function getInitial() {
  if (typeof window === 'undefined') return 'th'
  return localStorage.getItem('bm-lang') || 'th'
}

export function LanguageProvider({ children }) {
  const [lang, setLang] = useState(getInitial)

  useEffect(() => {
    document.documentElement.setAttribute('lang', lang)
    localStorage.setItem('bm-lang', lang)
  }, [lang])

  // t('section.key', { n: 3 }) -> รองรับ {n} ในข้อความ
  const t = (path, vars) => {
    const parts = path.split('.')
    let cur = translations[lang]
    for (const p of parts) cur = cur?.[p]
    if (cur == null) return path
    if (vars) for (const k in vars) cur = cur.replace(`{${k}}`, vars[k])
    return cur
  }

  const toggle = () => setLang((l) => (l === 'th' ? 'en' : 'th'))

  return <LanguageContext.Provider value={{ lang, setLang, toggle, t }}>{children}</LanguageContext.Provider>
}

export const useLang = () => useContext(LanguageContext)
