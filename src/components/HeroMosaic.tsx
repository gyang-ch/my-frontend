import { useState, useEffect } from 'react'
import './HeroMosaic.css'

const ILLUSTRATIONS_URL = '/data/illustrations.public.jsonl'
const AZURE_BASE = import.meta.env.VITE_AZURE_BLOB_BASE as string
const AZURE_SAS = import.meta.env.VITE_AZURE_SAS_TOKEN as string

const ROWS = 5
// 13 per row × 130 px tile = 1690 px; covers 1440 px viewport + 65 px offset
const PER_ROW = 13

interface CropRecord {
  illustration: { crop_image: string }
}

function shuffleSample<T>(arr: T[], n: number): T[] {
  const copy = [...arr]
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[copy[i], copy[j]] = [copy[j], copy[i]]
  }
  return copy.slice(0, n)
}

export function HeroMosaic() {
  const [rows, setRows] = useState<string[][]>([])

  useEffect(() => {
    fetch(ILLUSTRATIONS_URL)
      .then((r) => r.text())
      .then((text) => {
        const lines = text.split('\n').filter(Boolean)
        const sampled = shuffleSample(lines, ROWS * PER_ROW)
        const srcs = sampled
          .map((l) => {
            try {
              const r = JSON.parse(l) as CropRecord
              return `${AZURE_BASE}/${r.illustration.crop_image}?${AZURE_SAS}`
            } catch {
              return null
            }
          })
          .filter((s): s is string => !!s)

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
