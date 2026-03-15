import { useState, useMemo, useEffect, useLayoutEffect, useRef } from 'react'
import { ParentSize } from '@visx/responsive'
import { bookData } from './data/books'
import type { BookRecord } from './data/books'
import { Timeline } from './components/Timeline'
import { BookDetail } from './components/BookDetail'
import { BookReader } from './components/BookReader'
import { Storytelling } from './pages/Storytelling/Storytelling'
import { GeographicalDistribution } from './pages/GeographicalDistribution/GeographicalDistribution'
import gsap from 'gsap'
import { AnimatePresence, Reorder } from 'motion/react'
import './App.css'

type PageTab = 'library' | 'studio' | 'storyline' | 'geography';

interface TabItem {
  id: PageTab;
  label: string;
}

const initialTabs: TabItem[] = [
  { id: 'library', label: 'Library' },
  { id: 'studio', label: 'Analysis Studio' },
  { id: 'storyline', label: 'Storyline' },
  { id: 'geography', label: 'Geographical Distribution' }
];

function App() {
  const [activeTab, setActiveTab] = useState<PageTab>('library')
  const [tabs, setTabs] = useState<TabItem[]>(initialTabs)
  const [selectedBooks, setSelectedBooks] = useState<BookRecord[]>(bookData || [])
  const [selectedPeriod, setSelectedPeriod] = useState<string>('All Time')
  const [selectedBook, setSelectedBook] = useState<BookRecord | null>(null)
  const [selectedLanguage, setSelectedLanguage] = useState<string>('All')

  const filterContainerRef = useRef<HTMLDivElement>(null);
  const activeBgRef = useRef<HTMLDivElement>(null);
  const tabBarRef = useRef<HTMLDivElement>(null);
  const heroRef = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    if (!heroRef.current) return;
    const elements = heroRef.current.children;
    gsap.fromTo(elements, 
      { opacity: 0, y: 40, filter: 'blur(10px)' }, 
      { 
        opacity: 1, 
        y: 0, 
        filter: 'blur(0px)',
        duration: 1.2, 
        stagger: 0.2, 
        ease: "power3.out",
        delay: 0.1
      }
    );
  }, []);

  useEffect(() => {
    const handleScroll = () => {
      if (tabBarRef.current) {
        if (window.scrollY > 300) { // Adjust this value based on hero section height
          tabBarRef.current.classList.add('sticky');
        } else {
          tabBarRef.current.classList.remove('sticky');
        }
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useLayoutEffect(() => {
    const updatePill = () => {
      // Use requestAnimationFrame to ensure we measure after layout
      requestAnimationFrame(() => {
        if (!filterContainerRef.current || !activeBgRef.current) return;
        
        const activeBtn = filterContainerRef.current.querySelector('.filter-chip.active') as HTMLElement;
        if (activeBtn && activeBgRef.current) {
          gsap.to(activeBgRef.current, {
            x: activeBtn.offsetLeft,
            y: activeBtn.offsetTop,
            width: activeBtn.offsetWidth,
            height: activeBtn.offsetHeight,
            duration: 0.4,
            ease: "power3.out"
          });
        }
      });
    };

    updatePill();
    window.addEventListener('resize', updatePill);
    
    const timer = setTimeout(updatePill, 100);

    return () => {
      window.removeEventListener('resize', updatePill);
      clearTimeout(timer);
    };
  }, [selectedLanguage, selectedBooks, selectedBook]); // Run when selection changes

  useEffect(() => {
    if (!filterContainerRef.current) return;
    const buttons = filterContainerRef.current.querySelectorAll('.filter-chip');
    gsap.fromTo(buttons, 
      { 
        opacity: 0, 
        x: -12, 
        scale: 0.9,
        filter: 'blur(8px)'
      },
      { 
        opacity: 1, 
        x: 0, 
        scale: 1,
        filter: 'blur(0px)',
        duration: 0.8, 
        stagger: {
          each: 0.04,
          from: "start"
        },
        ease: "power3.out" 
      }
    );
  }, []); // Run once on mount

  const languageStats = useMemo(() => {
    if (!bookData) return [];
    const counts: Record<string, number> = {};
    // Only count from the currently selected temporal period (selectedBooks)
    selectedBooks.forEach(b => {
      b.language?.forEach(l => {
        counts[l] = (counts[l] || 0) + 1;
      });
    });
    
    return Object.entries(counts)
      .map(([lang, count]) => ({ lang, count }))
      .sort((a, b) => b.count - a.count);
  }, [selectedBooks]);

  const maxCount = useMemo(() => 
    Math.max(...languageStats.map(s => s.count), 0)
  , [languageStats]);

  useEffect(() => {
    if (!filterContainerRef.current) return;
    const items = filterContainerRef.current.querySelectorAll('.legend-item');
    const bars = filterContainerRef.current.querySelectorAll('.legend-bar-inner');
    
    const tl = gsap.timeline();
    
    tl.fromTo(items, 
      { 
        opacity: 0, 
        y: 10,
        filter: 'blur(4px)'
      },
      { 
        opacity: 1, 
        y: 0, 
        filter: 'blur(0px)',
        duration: 0.6, 
        stagger: 0.05,
        ease: "expo.out" 
      }
    );

    // Wipe bars from left
    tl.fromTo(bars,
      { clipPath: 'inset(0 100% 0 0)' },
      { 
        clipPath: (_i, target) => {
          const percentage = target.getAttribute('data-percentage');
          return `inset(0 ${100 - Number(percentage)}% 0 0)`;
        },
        duration: 1.2,
        stagger: 0.05,
        ease: "power4.out"
      },
      "-=0.4"
    );

  }, [languageStats]); // Re-run when stats change (period changes)

  const handleLegendMouseEnter = (e: React.MouseEvent<HTMLDivElement>) => {
    const item = e.currentTarget;
    const bar = item.querySelector('.legend-bar-inner');
    gsap.to(item, { scale: 1.02, duration: 0.3, ease: "power2.out", boxShadow: '0 4px 12px rgba(0,0,0,0.1)' });
    gsap.to(bar, { filter: 'saturate(2) contrast(1.1)', duration: 0.3 });
  };

  const handleLegendMouseLeave = (e: React.MouseEvent<HTMLDivElement>) => {
    const item = e.currentTarget;
    const bar = item.querySelector('.legend-bar-inner');
    gsap.to(item, { scale: 1, duration: 0.3, ease: "power2.out", boxShadow: 'none' });
    gsap.to(bar, { filter: 'saturate(1) contrast(1)', duration: 0.3 });
  };

  if (!bookData) return <div style={{ padding: '20px' }}>Loading data...</div>;

  const handleSelectPeriod = (books: BookRecord[], period: string) => {
    if (selectedPeriod === period) {
      setSelectedBooks(bookData);
      setSelectedPeriod('All Time');
    } else {
      setSelectedBooks(books);
      setSelectedPeriod(period);
    }
    setSelectedBook(null);
    setSelectedLanguage('All'); // Reset language when period changes
  }

  const handleSelectBook = (book: BookRecord) => {
    setSelectedBook(book)
    setActiveTab('studio')
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const handleBackToGrid = () => {
    setSelectedBook(null)
    setActiveTab('library')
  }

  const displayedBooks = useMemo(() => {
    const filtered = selectedLanguage === 'All'
      ? selectedBooks
      : selectedBooks.filter(b => b.language?.includes(selectedLanguage));
    return [...filtered].sort(() => Math.random() - 0.5);
  }, [selectedBooks, selectedLanguage]);

  return (
    <div className="app-container">
      <header className="hero">
        <div className="hero-content" ref={heroRef}>
          <h1>Computational Analysis of <br /><span className="hero-gradient">Global Scientific Iconography</span></h1>
          <p className="subtitle">Exploring the intersection of art history, science, and digital humanities.</p>
        </div>
      </header>

      <div className="tab-bar-container" ref={tabBarRef}>
        <div className="tab-bar-wrapper">
          <div className="brand" onClick={() => { setActiveTab('library'); window.scrollTo({ top: 0, behavior: 'smooth' }); }}>
            <img src="/Icon.png" className="brand-icon" alt="PhytoVision Logo" />
            <span className="brand-title">
              <span className="brand-phyto">Phyto</span>
              <span className="brand-vision">Vision</span>
            </span>
          </div>

          <Reorder.Group
            as="div"
            axis="x"
            values={tabs}
            onReorder={setTabs}
            className="tab-bar"
          >
            <AnimatePresence>
              {tabs.map((item) => {
                const isDisabled = item.id === 'studio' && !selectedBook;
                const title = isDisabled ? 'Select a manuscript in Library to enter Analysis Studio' : undefined;
                
                return (
                  <Reorder.Item
                    as="button"
                    key={item.id}
                    value={item}
                    className={`tab-btn ${activeTab === item.id ? 'active' : ''} ${isDisabled ? 'is-disabled' : ''}`}
                    onClick={() => {
                      if (isDisabled) return;
                      setActiveTab(item.id);
                    }}
                    aria-disabled={isDisabled}
                    title={title}
                    whileHover={!isDisabled ? { scale: 1.02 } : {}}
                    whileTap={!isDisabled ? { scale: 0.98 } : {}}
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    transition={{ type: "spring", stiffness: 400, damping: 25 }}
                  >
                    {item.label}
                  </Reorder.Item>
                );
              })}
            </AnimatePresence>
          </Reorder.Group>
        </div>
      </div>

      <main className={`content ${activeTab === 'studio' && selectedBook ? 'reader-mode' : ''} ${['storyline', 'geography'].includes(activeTab) ? 'full-width-content' : ''}`}>
        {activeTab === 'storyline' ? (
          <Storytelling />
        ) : activeTab === 'geography' ? (
          <GeographicalDistribution />
        ) : activeTab === 'studio' ? (
          selectedBook ? (
            <BookReader book={selectedBook} onBack={handleBackToGrid} />
          ) : (
            <div style={{ textAlign: 'center', padding: '6rem 2rem', color: '#718096' }}>
              <h2 style={{ fontFamily: '"Cinzel", serif', fontSize: '2rem', marginBottom: '1rem', color: '#a0aec0' }}>Analysis Studio</h2>
              <p style={{ fontSize: '1.2rem' }}>Please select a manuscript from the Library to begin analysis.</p>
              <button 
                onClick={() => setActiveTab('library')}
                style={{ 
                  marginTop: '2rem', 
                  padding: '0.75rem 2rem', 
                  background: 'transparent', 
                  border: '1px solid #4a5568', 
                  color: '#e2e8f0', 
                  borderRadius: '8px',
                  cursor: 'pointer',
                  fontFamily: '"Cinzel", serif',
                  textTransform: 'uppercase',
                  letterSpacing: '1px'
                }}
              >
                Return to Library
              </button>
            </div>
          )
        ) : (
          <>
            <section className="timeline-section">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '1.5rem', borderBottom: '1px solid rgba(148, 163, 184, 0.2)', paddingBottom: '0.5rem' }}>
                <h3 style={{ fontSize: '1.75rem', margin: 0, color: 'inherit', fontFamily: '"Cinzel", serif' }}>Temporal Distribution</h3>
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
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '1.5rem', borderBottom: '1px solid rgba(148, 163, 184, 0.2)', paddingBottom: '0.5rem' }}>
                  <h3 style={{ fontSize: '1.75rem', margin: 0, color: 'inherit', fontFamily: '"Cinzel", serif' }}>Linguistic Distribution</h3>
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
                      letterSpacing: '0.5px'
                    }}
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
                    gap: '1rem 2.5rem' 
                  }}
                >
                  {languageStats.map(({ lang, count }) => {
                    const isActive = selectedLanguage === lang;
                    const percentage = maxCount > 0 ? (count / maxCount) * 100 : 0;
                    
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
                      >
                        {/* Active Filled Bar with Clipped Gradient */}
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

                        {/* Single Unified Text Layer */}
                        <div style={{ 
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
                          pointerEvents: 'none'
                        }}>
                          <span>{lang}</span>
                          <span style={{ fontWeight: 600 }}>
                            {count} {count === 1 ? 'Work' : 'Works'}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </section>

            <section className="detail-section" style={{ marginTop: '4rem' }}>
              <BookDetail 
                books={displayedBooks} 
                period={selectedPeriod} 
                onSelectBook={handleSelectBook} 
              />
            </section>
          </>
        )}
      </main>

      <footer style={{ padding: '4rem 2rem', textAlign: 'center', color: '#718096', borderTop: '1px solid #e2e8f0', marginTop: '4rem' }}>
        <p>© 2026 MA Research Project - Computational Scientific Iconography</p>
      </footer>
    </div>
  )
}

export default App
