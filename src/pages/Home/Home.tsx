import { NavLink } from 'react-router-dom'
import './Home.css'

const entries = [
  {
    to: '/library',
    title: 'Library',
    side: 'High-resolution book images are retrieved via IIIF directly from museum and library servers, supporting decentralised access to digital cultural resources.',
    align: 'left',
  },
  {
    to: '/ai-hub',
    title: 'AI Hub',
    side: 'Transcription is handled by Kraken and Qwen-VL, a vision-language model reflecting the multimodal turn in Digital Humanities — analysing both textual and visual materials.',
    align: 'right',
  },
  {
    to: '/illustrations',
    title: 'Illustrations',
    side: 'A YOLO model fine-tuned on 1,200 annotated images detects plant illustrations across the collection, transforming machine outputs into a curated visual dataset.',
    align: 'left',
  },
  {
    to: '/geography',
    title: 'Geographical Distribution',
    side: 'Plant distributions are mapped using kepler.gl and globe.gl, situating the archive in space and engaging spatial humanities methods.',
    align: 'right',
  },
] as const

export function HomePage() {
  return (
    <section className="home">
      <div className="home-intro">
        <p>
          PhytoVision explores the history of botany through digitised historical books,
          investigating how computer-assisted techniques can enhance the analysis of botanical
          texts and images at large scale through AI models and IIIF.
        </p>
      </div>

      <div className="home-entries">
        {entries.map((entry) => (
          <div key={entry.to} className={`home-entry home-entry--${entry.align}`}>
            <NavLink 
              to={entry.to} 
              className={`home-card home-card--${entry.to.replace('/', '')}`}
            >
              <div className="home-card-title">{entry.title}</div>
              <div className="home-card-foot" aria-hidden="true">Open →</div>
            </NavLink>
            <p className="home-entry-text">{entry.side}</p>
          </div>
        ))}
      </div>
    </section>
  )
}
