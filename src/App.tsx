import { useEffect, useLayoutEffect, useMemo, useRef } from 'react'
import { NavLink, Navigate, Route, Routes, useLocation, useNavigate } from 'react-router-dom'
import gsap from 'gsap'
import './App.css'

import { HomePage } from './pages/Home/Home'
import { LibraryPage } from './pages/Library/Library'
import { StudioPage } from './pages/Studio/Studio'
import { Storytelling } from './pages/Storytelling/Storytelling'
import { GeographicalDistribution } from './pages/GeographicalDistribution/GeographicalDistribution'

const prefersReducedMotion = () =>
  typeof window !== 'undefined' &&
  window.matchMedia &&
  window.matchMedia('(prefers-reduced-motion: reduce)').matches

export const scrollToContent = (heroRef: React.RefObject<HTMLElement | null>) => {
  const top = heroRef.current?.offsetHeight || 0;
  window.scrollTo({ top, behavior: prefersReducedMotion() ? 'auto' : 'smooth' })
}

const navItems = [
  { to: '/home', label: 'Home', end: true },
  { to: '/library', label: 'Library', end: true },
  { to: '/studio', label: 'Analysis Studio', end: false },
  { to: '/storyline', label: 'Storyline', end: true },
  { to: '/geography', label: 'Geographical Distribution', end: true },
] as const

function App() {
  const navigate = useNavigate()
  const location = useLocation()

  const heroTextRef = useRef<HTMLDivElement>(null)
  const heroSectionRef = useRef<HTMLElement>(null)
  const tabBarRef = useRef<HTMLDivElement>(null)

  const pathname = location.pathname
  const isReaderMode = useMemo(() => pathname.startsWith('/studio/') && pathname.split('/').length >= 3, [pathname])
  const isFullWidth = useMemo(
    () => pathname.startsWith('/storyline') || pathname.startsWith('/geography'),
    [pathname],
  )

  // Scroll to content on path change
  useEffect(() => {
    // Only scroll if we are not at the very top (optional logic, but usually good)
    // Actually user said "whenever i click another tab", so we do it.
    scrollToContent(heroSectionRef);
  }, [pathname]);

  useLayoutEffect(() => {
    if (prefersReducedMotion()) return
    if (!heroTextRef.current) return

    const elements = Array.from(heroTextRef.current.children)
    if (elements.length === 0) return

    gsap.fromTo(
      elements,
      { opacity: 0, y: 40, filter: 'blur(10px)' },
      {
        opacity: 1,
        y: 0,
        filter: 'blur(0px)',
        duration: 1.15,
        stagger: 0.18,
        ease: 'power3.out',
        delay: 0.05,
        clearProps: 'transform,filter',
      },
    )
  }, [])

  useEffect(() => {
    const handleScroll = () => {
      if (!tabBarRef.current) return
      if (window.scrollY > 50) tabBarRef.current.classList.add('scrolled')
      else tabBarRef.current.classList.remove('scrolled')
    }

    handleScroll()
    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  return (
    <div className="app-container">
      <a className="skip-link" href="#main">
        Skip to content
      </a>

      <header className="hero" ref={heroSectionRef}>
        <div className="hero-background"></div>
        <div className="hero-content" ref={heroTextRef}>
          <h1>
            Computational Analysis of <br />
            <span className="hero-gradient">Global Botanical Iconography</span>
          </h1>
          <p className="subtitle">Exploring the intersection of art history, science, and digital humanities.</p>
        </div>
      </header>

      <div className="tab-bar-container" ref={tabBarRef}>
        <div className="tab-bar-wrapper">
          <button
            className="brand"
            type="button"
            onClick={() => {
              navigate('/home')
            }}
            aria-label="Go to home"
          >
            <img src="/Icon.png" className="brand-icon" alt="PhytoVision Logo" />
            <span className="brand-title" aria-hidden="true">
              <span className="brand-phyto">Phyto</span>
              <span className="brand-vision">Vision</span>
            </span>
          </button>

          <nav className="tab-bar" aria-label="Primary">
            {navItems.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.end}
                className={({ isActive }) => `tab-btn ${isActive ? 'active' : ''}`}
              >
                {item.label}
              </NavLink>
            ))}
          </nav>
        </div>
      </div>

      <main
        id="main"
        className={`content ${isReaderMode ? 'reader-mode' : ''} ${isFullWidth ? 'full-width-content' : ''}`}
      >
        <Routes>
          <Route path="/" element={<Navigate to="/home" replace />} />
          <Route path="/home" element={<HomePage />} />
          <Route path="/library" element={<LibraryPage />} />
          <Route path="/studio" element={<StudioPage />} />
          <Route path="/studio/:bookId" element={<StudioPage />} />
          <Route path="/storyline" element={<Storytelling />} />
          <Route path="/geography" element={<GeographicalDistribution />} />
          <Route path="*" element={<Navigate to="/home" replace />} />
        </Routes>
      </main>

      <footer className="site-footer">
        <p>© 2026 MA Research Project - Computational Scientific Iconography</p>
      </footer>
    </div>
  )
}

export default App
