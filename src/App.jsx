import { Routes, Route, useLocation, Navigate } from 'react-router-dom'
import { useEffect } from 'react'
import Navbar from './components/Navbar'
import Footer from './components/Footer'
import { Icon } from './components/Icons'
import { AuthModalProvider, useAuthModal } from './components/AuthModal'

import Home from './pages/Home'
import ProductList from './pages/ProductList'
import ProductDetail from './pages/ProductDetail'
import Cart from './pages/Cart'
import Checkout from './pages/Checkout'
import OrderTracking from './pages/OrderTracking'
import OrderHistory from './pages/OrderHistory'
import PCBuilder from './pages/PCBuilder'
import AdminDashboard from './pages/AdminDashboard'
import AccountLayout from './pages/account/AccountLayout'
import Profile from './pages/account/Profile'
import Addresses from './pages/account/Addresses'
import TaxProfiles from './pages/account/TaxProfiles'
import PaymentMethods from './pages/account/PaymentMethods'
import Wishlist from './pages/account/Wishlist'
import NotFound from './pages/NotFound'

function ScrollTop() {
  const { pathname } = useLocation()
  useEffect(() => window.scrollTo(0, 0), [pathname])
  return null
}

// /login, /register -> เปิด popup modal แล้วพากลับหน้าแรก (รองรับลิงก์ตรง)
function AuthRedirect({ view }) {
  const { open } = useAuthModal()
  useEffect(() => { open(view) }, [view, open])
  return <Navigate to="/" replace />
}

export default function App() {
  return (
    <AuthModalProvider>
      <div className="flex min-h-dvh flex-col bg-bg text-fg">
        <div className="flex items-center justify-center gap-2 bg-zinc-900 px-4 py-1.5 text-center text-xs text-zinc-400">
          <Icon name="truck" size={14} className="shrink-0 text-brand-400" />
          ส่งฟรีทั่วไทยเมื่อช้อปครบ 1,500 บาท · ของแท้ประกันศูนย์ · ผ่อน 0% 10 เดือน
        </div>
        <Navbar />
        <ScrollTop />
        <main className="flex-1">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/products" element={<ProductList />} />
            <Route path="/product/:id" element={<ProductDetail />} />
            <Route path="/cart" element={<Cart />} />
            <Route path="/checkout" element={<Checkout />} />
            <Route path="/login" element={<AuthRedirect view="login" />} />
            <Route path="/register" element={<AuthRedirect view="register" />} />
            <Route path="/track" element={<OrderTracking />} />
            <Route path="/orders" element={<OrderHistory />} />
            <Route path="/builder" element={<PCBuilder />} />
            <Route path="/account" element={<AccountLayout />}>
              <Route index element={<Profile />} />
              <Route path="addresses" element={<Addresses />} />
              <Route path="tax" element={<TaxProfiles />} />
              <Route path="payment" element={<PaymentMethods />} />
              <Route path="wishlist" element={<Wishlist />} />
            </Route>
            <Route path="/admin" element={<AdminDashboard />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </main>
        <Footer />
      </div>
    </AuthModalProvider>
  )
}
