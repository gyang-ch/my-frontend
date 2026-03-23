import { useState, useEffect } from 'react'
import './HeroMosaic.css'

const HERO_TILES_URL = '/data/hero-tiles.json'
const AZURE_BASE = import.meta.env.VITE_AZURE_BLOB_BASE as string
const AZURE_SAS = import.meta.env.VITE_AZURE_SAS_TOKEN as string

const ROWS = 5
// 13 per row × 130 px tile = 1690 px; covers 1440 px viewport + 65 px offset
const PER_ROW = 13

export function HeroMosaic() {
  const [rows, setRows] = useState<string[][]>([])

  useEffect(() => {
    fetch(HERO_TILES_URL)
      .then((r) => r.json() as Promise<string[][]>)
      .then((sets) => {
        const set = sets[Math.floor(Math.random() * sets.length)]
        const srcs = set.map((path) => `${AZURE_BASE}/${path}?${AZURE_SAS}`)
        setRows(
          Array.from({ length: ROWS }, (_, i) =>
            srcs.slice(i * PER_ROW, (i + 1) * PER_ROW),
          ).filter((row) => row.length > 0),
        )
      })
      .catch(() => {})
  }, [])

  return (
    <div className="hero-mosaic" aria-hidden="true">
      {rows.map((srcs, i) => (
        <div
          key={i}
          className={`hero-mosaic-row${i % 2 === 1 ? ' hero-mosaic-row--offset' : ''}`}
        >
          {srcs.map((src, j) => (
            <img
              key={j}
              src={src}
              alt=""
              className="hero-mosaic-img"
              loading="eager"
              draggable={false}
            />
          ))}
        </div>
      ))}
    </div>
  )
}
