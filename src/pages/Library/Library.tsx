import { useEffect, useMemo, useRef, useState, type MouseEvent } from 'react'
import { ParentSize } from '@visx/responsive'
import gsap from 'gsap'
import { useNavigate } from 'react-router-dom'

import { bookData } from '../../data/books'
import type { BookRecord } from '../../data/books'
import { Timeline } from '../../components/Timeline'
import { BookDetail } from '../../components/BookDetail'

const prefersReducedMotion = () =>
  typeof window !== 'undefined' &&
  window.matchMedia &&
  window.matchMedia('(prefers-reduced-motion: reduce)').matches

export function LibraryPage() {
  const navigate = useNavigate()

  const [selectedBooks, setSelectedBooks] = useState<BookRecord[]>(bookData || [])
  const [selectedPeriod, setSelectedPeriod] = useState<string>('All Time')
  const [selectedLanguage, setSelectedLanguage] = useState<string>('All')

  const filterContainerRef = useRef<HTMLDivElement>(null)

  const languageStats = useMemo(() => {
    if (!bookData) return []
    const counts: Record<string, number> = {}

    selectedBooks.forEach((b) => {
      b.language?.forEach((l) => {
        counts[l] = (counts[l] || 0) + 1
      })
    })

    return Object.entries(counts)
      .map(([lang, count]) => ({ lang, count }))
      .sort((a, b) => b.count - a.count)
  }, [selectedBooks])

  const maxCount = useMemo(() => Math.max(...languageStats.map((s) => s.count), 0), [languageStats])

  useEffect(() => {
    if (prefersReducedMotion()) return
    if (!filterContainerRef.current) return

    const items = filterContainerRef.current.querySelectorAll('.legend-item')
    const bars = filterContainerRef.current.querySelectorAll('.legend-bar-inner')

    const tl = gsap.timeline()

    tl.fromTo(
      items,
      { opacity: 0, y: 10, filter: 'blur(4px)' },
      { opacity: 1, y: 0, filter: 'blur(0px)', duration: 0.55, stagger: 0.045, ease: 'expo.out' },
    )

    tl.fromTo(
      bars,
      { clipPath: 'inset(0 100% 0 0)' },
      {
        clipPath: (_i, target) => {
          const percentage = target.getAttribute('data-percentage')
          return `inset(0 ${100 - Number(percentage)}% 0 0)`
        },
        duration: 1.05,
        stagger: 0.045,
        ease: 'power4.out',
      },
      '-=0.35',
    )
  }, [languageStats])

  const handleSelectPeriod = (books: BookRecord[], period: string) => {
    if (selectedPeriod === period) {
      setSelectedBooks(bookData)
      setSelectedPeriod('All Time')
    } else {
      setSelectedBooks(books)
      setSelectedPeriod(period)
    }
    setSelectedLanguage('All')
  }

  const displayedBooks = useMemo(() => {
    const filtered =
      selectedLanguage === 'All' ? selectedBooks : selectedBooks.filter((b) => b.language?.includes(selectedLanguage))

    return [...filtered].sort((a, b) => a.year - b.year || a.title.localeCompare(b.title) || a.id.localeCompare(b.id))
  }, [selectedBooks, selectedLanguage])

  const handleLegendMouseEnter = (e: MouseEvent<HTMLDivElement>) => {
    if (prefersReducedMotion()) return
    const item = e.currentTarget
    const bar = item.querySelector('.legend-bar-inner')
    gsap.to(item, { scale: 1.02, duration: 0.25, ease: 'power2.out', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' })
    gsap.to(bar, { filter: 'saturate(2) contrast(1.1)', duration: 0.25 })
  }

  const handleLegendMouseLeave = (e: MouseEvent<HTMLDivElement>) => {
    if (prefersReducedMotion()) return
    const item = e.currentTarget
    const bar = item.querySelector('.legend-bar-inner')
    gsap.to(item, { scale: 1, duration: 0.25, ease: 'power2.out', boxShadow: 'none' })
    gsap.to(bar, { filter: 'saturate(1) contrast(1)', duration: 0.25 })
  }

  if (!bookData) return <div style={{ padding: '20px' }}>Loading data...</div>

  return (
    <>
      <section className="timeline-section">
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'baseline',
            marginBottom: '1.5rem',
            borderBottom: '1px solid rgba(148, 163, 184, 0.2)',
            paddingBottom: '0.5rem',
          }}
        >
          <h3 className="section-heading" style={{ fontSize: '1.75rem', margin: 0, color: 'inherit' }}>
            Temporal Distribution
          </h3>
        </div>
        <div className="timeline-wrapper">
          <ParentSize>
            {({ width, height }) => (
              <Timeline
                data={bookData}
                width={width}
                height={height || 400}
                onSelectPeriod={handleSelectPeriod}
                selectedPeriod={selectedPeriod}
              />
            )}
          </ParentSize>
        </div>

        <div className="language-filter" style={{ marginTop: '3rem' }}>
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'baseline',
              marginBottom: '1.5rem',
              borderBottom: '1px solid rgba(148, 163, 184, 0.2)',
              paddingBottom: '0.5rem',
            }}
          >
            <h3 className="section-heading" style={{ fontSize: '1.75rem', margin: 0, color: 'inherit' }}>
              Linguistic Distribution
            </h3>
            <button
              onClick={() => setSelectedLanguage('All')}
              style={{
                background: 'transparent',
                border: 'none',
                color: selectedLanguage === 'All' ? '#13cf71' : '#718096',
                fontSize: '0.8rem',
                cursor: 'pointer',
                fontWeight: 600,
                textTransform: 'uppercase',
                letterSpacing: '0.5px',
              }}
              type="button"
            >
              {selectedLanguage === 'All' ? '• Showing All' : 'Reset Filter'}
            </button>
          </div>

          <div
            ref={filterContainerRef}
            className="legend-grid"
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(400px, 1fr))',
              gap: '1rem 2.5rem',
            }}
          >
            {languageStats.map(({ lang, count }) => {
              const isActive = selectedLanguage === lang
              const percentage = maxCount > 0 ? (count / maxCount) * 100 : 0

              return (
                <div
                  key={lang}
                  className={`legend-item ${isActive ? 'active' : ''}`}
                  onClick={() => setSelectedLanguage(isActive ? 'All' : lang)}
                  onMouseEnter={handleLegendMouseEnter}
                  onMouseLeave={handleLegendMouseLeave}
                  style={{
                    position: 'relative',
                    cursor: 'pointer',
                    height: '36px',
                    borderRadius: '6px',
                    background: isActive ? 'rgba(168, 85, 247, 0.15)' : 'rgba(255, 255, 255, 0.03)',
                    border: isActive ? '1px solid rgba(168, 85, 247, 0.4)' : '1px solid rgba(255, 255, 255, 0.05)',
                    overflow: 'hidden',
                    transition: 'all 0.2s ease',
                  }}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault()
                      setSelectedLanguage(isActive ? 'All' : lang)
                    }
                  }}
                  aria-pressed={isActive}
                >
                  <div
                    className="legend-bar-inner"
                    data-percentage={percentage}
                    style={{
                      position: 'absolute',
                      inset: 0,
                      background: isActive
                        ? 'linear-gradient(90deg, rgba(147, 197, 253, 1) 0%, rgba(192, 132, 252, 1) 50%, rgba(244, 114, 182, 1) 100%)'
                        : 'linear-gradient(90deg, rgba(147, 197, 253, 0.8) 0%, rgba(192, 132, 252, 0.8) 50%, rgba(244, 114, 182, 0.8) 100%)',
                      clipPath: `inset(0 ${100 - percentage}% 0 0)`,
                      zIndex: 1,
                    }}
                  />

                  <div
                    style={{
                      position: 'absolute',
                      inset: 0,
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      padding: '0 1rem',
                      fontSize: '0.85rem',
                      fontWeight: 700,
                      letterSpacing: '0.02em',
                      color: '#0f172a',
                      textShadow: '0 0 4px rgba(255,255,255,0.8), 0 0 2px rgba(255,255,255,1)',
                      zIndex: 2,
                      pointerEvents: 'none',
                    }}
                  >
                    <span>{lang}</span>
                    <span style={{ fontWeight: 600 }}>
                      {count} {count === 1 ? 'Work' : 'Works'}
                    </span>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </section>

      <section className="detail-section" style={{ marginTop: '4rem' }}>
        <BookDetail
          books={displayedBooks}
          period={selectedPeriod}
          studioPathForBook={(b) => `/studio/${b.id}`}
          onSelectBook={(book) => {
            navigate(`/studio/${book.id}`)
          }}
        />
      </section>
    </>
  )
}
