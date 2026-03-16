import { NavLink } from 'react-router-dom'

const cards = [
  {
    to: '/library',
    title: 'Library',
    body: 'Browse manuscripts and filter by time and language. Enter the Studio from any item.',
    meta: 'Catalogue + filters',
  },
  {
    to: '/studio',
    title: 'Analysis Studio',
    body: 'A close-reading space for a selected manuscript: zoom, inspect, and interpret.',
    meta: 'IIIF reader',
  },
  {
    to: '/storyline',
    title: 'Storyline',
    body: 'A thematic traversal across motifs and methods—read in fragments or as a flow.',
    meta: 'Scroll-driven',
  },
  {
    to: '/geography',
    title: 'Geographical Distribution',
    body: 'Situate the archive in space. Explore clusters, outliers, and institutional constellations.',
    meta: 'Spatial view',
  },
] as const

export function HomePage() {
  return (
    <section className="home">
      <div className="home-header">
        <p className="home-subtitle">Enter anywhere. No prescribed order—only adjacent readings.</p>
      </div>

      <div className="home-grid" role="list">
        {cards.map((card) => (
          <NavLink key={card.to} to={card.to} className="home-card" role="listitem">
            <div className="home-card-meta">{card.meta}</div>
            <div className="home-card-title">{card.title}</div>
            <div className="home-card-body">{card.body}</div>
            <div className="home-card-foot" aria-hidden="true">
              Open →
            </div>
          </NavLink>
        ))}
      </div>
    </section>
  )
}

