import { useState, useEffect } from 'react'

interface PaginatorProps {
  currentPage: number   // 1-indexed
  totalPages: number
  onPageChange: (page: number) => void
}

function buildPageRange(current: number, total: number): (number | 'el' | 'er')[] {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1)

  const pages: (number | 'el' | 'er')[] = [1]
  const left = Math.max(2, current - 2)
  const right = Math.min(total - 1, current + 2)

  if (left > 2) pages.push('el')
  for (let i = left; i <= right; i++) pages.push(i)
  if (right < total - 1) pages.push('er')
  pages.push(total)

  return pages
}

const btn: React.CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  minWidth: '34px',
  height: '34px',
  padding: '0 8px',
  borderRadius: '7px',
  border: '1px solid #334155',
  background: '#1e293b',
  color: '#94a3b8',
  fontSize: '0.82rem',
  fontWeight: 600,
  cursor: 'pointer',
  transition: 'all 0.15s',
  userSelect: 'none',
  lineHeight: 1,
}

const btnActive: React.CSSProperties = {
  ...btn,
  background: 'rgba(16, 185, 129, 0.15)',
  border: '1px solid #10b981',
  color: '#10b981',
}

const btnDisabled: React.CSSProperties = {
  ...btn,
  opacity: 0.35,
  cursor: 'not-allowed',
}

export function Paginator({ currentPage, totalPages, onPageChange }: PaginatorProps) {
  const [inputVal, setInputVal] = useState(String(currentPage))

  useEffect(() => setInputVal(String(currentPage)), [currentPage])

  if (totalPages <= 1) return null

  const goTo = (page: number) => onPageChange(Math.max(1, Math.min(totalPages, page)))

  const commitInput = () => {
    const n = parseInt(inputVal, 10)
    if (!isNaN(n)) goTo(n)
    else setInputVal(String(currentPage))
  }

  const pages = buildPageRange(currentPage, totalPages)

  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      flexWrap: 'wrap',
      gap: '6px',
      padding: '1.5rem 0',
    }}>
      {/* Prev */}
      <button
        style={currentPage === 1 ? btnDisabled : btn}
        disabled={currentPage === 1}
        onClick={() => goTo(currentPage - 1)}
        title="Previous page"
      >
        ‹
      </button>

      {/* Page numbers */}
      {pages.map((p, i) =>
        p === 'el' || p === 'er' ? (
          <span key={p + i} style={{ color: '#475569', fontSize: '0.85rem', padding: '0 2px' }}>…</span>
        ) : (
          <button
            key={p}
            style={p === currentPage ? btnActive : btn}
            onClick={() => goTo(p as number)}
            onMouseEnter={(e) => { if (p !== currentPage) { (e.currentTarget as HTMLButtonElement).style.borderColor = '#475569'; (e.currentTarget as HTMLButtonElement).style.color = '#e2e8f0' } }}
            onMouseLeave={(e) => { if (p !== currentPage) { (e.currentTarget as HTMLButtonElement).style.borderColor = '#334155'; (e.currentTarget as HTMLButtonElement).style.color = '#94a3b8' } }}
          >
            {p}
          </button>
        )
      )}

      {/* Next */}
      <button
        style={currentPage === totalPages ? btnDisabled : btn}
        disabled={currentPage === totalPages}
        onClick={() => goTo(currentPage + 1)}
        title="Next page"
      >
        ›
      </button>

      {/* Jump to page */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginLeft: '8px' }}>
        <span style={{ color: '#475569', fontSize: '0.78rem' }}>Go to</span>
        <input
          type="number"
          min={1}
          max={totalPages}
          value={inputVal}
          onChange={(e) => setInputVal(e.target.value)}
          onBlur={commitInput}
          onKeyDown={(e) => { if (e.key === 'Enter') commitInput() }}
          style={{
            width: '52px',
            height: '34px',
            padding: '0 8px',
            borderRadius: '7px',
            border: '1px solid #334155',
            background: '#1e293b',
            color: '#e2e8f0',
            fontSize: '0.82rem',
            textAlign: 'center',
            outline: 'none',
          }}
        />
        <span style={{ color: '#475569', fontSize: '0.78rem' }}>of {totalPages}</span>
      </div>
    </div>
  )
}
