import { useMemo } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { bookData } from '../../data/books'
import { BookReader } from '../../components/BookReader'

const prefersReducedMotion = () =>
  typeof window !== 'undefined' &&
  window.matchMedia &&
  window.matchMedia('(prefers-reduced-motion: reduce)').matches

export function StudioPage() {
  const { bookId } = useParams()
  const navigate = useNavigate()

  const selectedBook = useMemo(() => {
    if (!bookId) return null
    return bookData.find((b) => b.id === bookId) ?? null
  }, [bookId])

  if (!bookId) {
    return (
      <section className="studio-empty">
        <h2 className="studio-title">Analysis Studio</h2>
        <p className="studio-body">
          The Studio opens from a selected manuscript. Choose an item in the Library to begin.
        </p>
        <div className="studio-actions">
          <Link className="studio-link" to="/library">
            Go to Library
          </Link>
        </div>
      </section>
    )
  }

  if (!selectedBook) {
    return (
      <section className="studio-empty">
        <h2 className="studio-title">Analysis Studio</h2>
        <p className="studio-body">
          This manuscript could not be found. It may have been renamed or removed.
        </p>
        <div className="studio-actions">
          <Link className="studio-link" to="/library">
            Browse Library
          </Link>
        </div>
      </section>
    )
  }

  return (
    <BookReader
      book={selectedBook}
      onBack={() => {
        navigate('/library')
        window.scrollTo({ top: 0, behavior: prefersReducedMotion() ? 'auto' : 'smooth' })
      }}
    />
  )
}
