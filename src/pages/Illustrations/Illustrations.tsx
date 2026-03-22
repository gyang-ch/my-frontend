import { useState, useEffect, useRef } from 'react'
import OpenSeadragon from 'openseadragon'
import { MasonryPhotoAlbum } from 'react-photo-album'
import 'react-photo-album/masonry.css'
import type { Photo } from 'react-photo-album'
const illustrationsUrl = '/data/illustrations.public.jsonl'
import { Paginator } from '../../components/Paginator'
import { IllustrationNetworkSection } from '../IllustrationNetwork/IllustrationNetwork'
import './Illustrations.css'

export const AZURE_BASE = import.meta.env.VITE_AZURE_BLOB_BASE as string
export const AZURE_SAS = import.meta.env.VITE_AZURE_SAS_TOKEN as string

export interface IllustrationRecord {
  illustration_id: string
  book: {
    book_id: string
    title: string
    authors: string[]
    language: string[]
    year: number
    category: string
    institution: string
    shelfmark: string
    iiif_manifest: string
  }
  page: {
    page_number: number
    page_index: number
    iiif_url: string
    image_width: number
    image_height: number
  }
  illustration: {
    crop_image: string
    width: number
    height: number
    bbox_px: [number, number, number, number]
  }
  detection: {
    plant_type_by_YOLO: string | null
    confidence: number
    plant_type_from_text: string | null
  }
  text: {
    page_transcription: string
    illustration_caption: string
  }
  quality: {
    needs_review: boolean
    human_verified: boolean
    verification_notes: string
  }
  cluster: {
    algorithm: string
    cluster_id: number
  }
  neighbors: string[]
}

export interface IllustrationPhoto extends Photo {
  record: IllustrationRecord
}

// ── Helpers ───────────────────────────────────────────────

// ── Simple OSD viewer with illustration bbox highlight ────

/**
 * Convert a IIIF Image API URL (any endpoint) to its info.json URL so OSD
 * can use the tiled protocol instead of downloading the whole image at once.
 * e.g. https://server/iiif/image/ID/full/1000,/0/default.jpg
 *   →  https://server/iiif/image/ID/info.json
 */
function toIiifInfoUrl(url: string): string {
  const idx = url.lastIndexOf('/full/')
  if (idx !== -1) return url.slice(0, idx) + '/info.json'
  if (url.endsWith('/info.json')) return url
  return url
}

function IllustrationViewer({
  imageUrl,
  bbox,
  pageWidth,
}: {
  imageUrl: string
  bbox: [number, number, number, number]
  /** Width of the thumbnail image that bbox_px coordinates are relative to. */
  pageWidth: number
}) {
  const containerRef = useRef<HTMLDivElement>(null)
  const osdRef = useRef<OpenSeadragon.Viewer | null>(null)
  const [isReady, setIsReady] = useState(false)
  const [, setTick] = useState(0)

  // Init OSD once per mount (component is keyed by illustration_id)
  useEffect(() => {
    if (!containerRef.current) return
    const viewer = OpenSeadragon({
      element: containerRef.current,
      prefixUrl: 'https://openseadragon.github.io/openseadragon/images/',
      // Use IIIF tiled source so only the visible tiles are fetched.
      // This turns a full-page JPEG download into progressive tile loading.
      tileSources: toIiifInfoUrl(imageUrl),
      crossOriginPolicy: 'Anonymous',
      showNavigationControl: false,
      showNavigator: false,
      defaultZoomLevel: 0,
      minZoomLevel: 0,
      maxZoomLevel: 10,
      gestureSettingsMouse: { scrollToZoom: false },
      gestureSettingsTouch: { scrollToZoom: false },
      constrainDuringPan: true,
      visibilityRatio: 1.0,
      animationTime: 0.5,
    })
    viewer.addHandler('open', () => setIsReady(true))
    osdRef.current = viewer
    return () => {
      viewer.destroy()
      osdRef.current = null
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Rerender overlay on viewport change
  useEffect(() => {
    if (!isReady || !osdRef.current) return
    const update = () => setTick((t) => t + 1)
    const v = osdRef.current
    v.addHandler('animation', update)
    v.addHandler('canvas-drag', update)
    v.addHandler('resize', update)
    return () => {
      v.removeHandler('animation', update)
      v.removeHandler('canvas-drag', update)
      v.removeHandler('resize', update)
    }
  }, [isReady])

  const getBboxPath = (): string | null => {
    const v = osdRef.current
    if (!v?.viewport) return null
    const [x1, y1, x2, y2] = bbox
    try {
      // bbox_px coords are in the thumbnail's pixel space (width = pageWidth, e.g. 1000 px).
      // OSD's imageToViewportCoordinates() expects coords in the *full* native image space
      // (from info.json), which is much larger — causing the box to land near top-left.
      //
      // Fix: compute the OSD viewport point directly.
      // OSD viewport x = imageX / fullWidth, y = imageY / fullWidth (width is the unit for both).
      // Because thumbnail_x / thumbnailWidth = fullX / fullWidth, thumbnailWidth is the correct divisor.
      const corners: [number, number][] = [
        [x1, y1], [x2, y1], [x2, y2], [x1, y2],
      ]
      const pts = corners.map(([x, y]) => {
        const vp = new OpenSeadragon.Point(x / pageWidth, y / pageWidth)
        const cp = v.viewport.viewportToViewerElementCoordinates(vp)
        return `${cp.x},${cp.y}`
      })
      return `M ${pts.join(' L ')} Z`
    } catch {
      return null
    }
  }

  const bboxPath = isReady ? getBboxPath() : null

  return (
    <div className="illus-viewer-wrap">
      <div ref={containerRef} className="illus-viewer-canvas" />

      {/* Minimal controls: zoom in, zoom out, reset */}
      <div className="illus-viewer-controls">
        <button
          className="illus-viewer-btn"
          title="Zoom in"
          onClick={() => osdRef.current?.viewport?.zoomBy(1.5)}
        >
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.8" strokeLinecap="round">
            <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
          </svg>
        </button>
        <button
          className="illus-viewer-btn"
          title="Zoom out"
          onClick={() => osdRef.current?.viewport?.zoomBy(1 / 1.5)}
        >
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.8" strokeLinecap="round">
            <line x1="5" y1="12" x2="19" y2="12" />
          </svg>
        </button>
        <button
          className="illus-viewer-btn"
          title="Return to full view"
          onClick={() => osdRef.current?.viewport?.goHome()}
        >
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
            <path d="M3 3v5h5" />
          </svg>
        </button>
      </div>

      {/* Bbox highlight overlay */}
      {bboxPath && (
        <svg className="illus-viewer-overlay">
          <path
            d={bboxPath}
            fill="rgba(52, 211, 153, 0.15)"
            stroke="#34d399"
            strokeWidth="2"
            strokeDasharray="7 3"
            strokeLinejoin="round"
            vectorEffect="non-scaling-stroke"
          />
        </svg>
      )}
    </div>
  )
}

// ── Popup card ────────────────────────────────────────────

function MetaRow({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="illus-popup-meta-row">
      <span className="illus-popup-meta-label">{label}</span>
      <span className="illus-popup-meta-value">{value}</span>
    </div>
  )
}

export function IllustrationPopup({
  photo,
  onClose,
  popupRef,
  photoMap,
  onSelectNeighbor,
}: {
  photo: IllustrationPhoto
  onClose: () => void
  popupRef: React.RefObject<HTMLDivElement | null>
  photoMap: Map<string, IllustrationPhoto>
  onSelectNeighbor: (photo: IllustrationPhoto) => void
}) {
  const r = photo.record
  const imageUrl = r.page.iiif_url

  const [x1, y1, x2, y2] = r.illustration.bbox_px
  const cropSize = `${r.illustration.width} × ${r.illustration.height} px`
  const pageSize = `${r.page.image_width} × ${r.page.image_height} px`
  const bboxStr = `(${x1}, ${y1}) → (${x2}, ${y2})`

  const neighborPhotos = (r.neighbors ?? [])
    .map((id) => photoMap.get(id))
    .filter((p): p is IllustrationPhoto => p !== undefined)

  return (
    <div className="illus-popup" ref={popupRef}>
      <div className="illus-popup-main">
      {/* ── OSD viewer column ── */}
      {/* Keyed by illustration_id so OSD remounts for each new illustration */}
      <div className="illus-popup-viewer-col">
        <IllustrationViewer
          key={r.illustration_id}
          imageUrl={imageUrl}
          bbox={r.illustration.bbox_px}
          pageWidth={r.page.image_width}
        />
      </div>

      {/* ── Metadata column ── */}
      <div className="illus-popup-meta-col">
        {/* Close button */}
        <button className="illus-popup-close" onClick={onClose} title="Close (Esc)">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
            <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>

        {/* Header */}
        <div className="illus-popup-header">
          <div className="illus-popup-institution-row">
            <span className="illus-popup-institution">{r.book.institution}</span>
            {r.quality.human_verified && (
              <span className="illus-popup-tag illus-popup-tag--verified">✓ Verified</span>
            )}
            {r.quality.needs_review && (
              <span className="illus-popup-tag illus-popup-tag--review">⚠ Review</span>
            )}
          </div>
          <h3 className="illus-popup-title">{r.book.title}</h3>
          {r.book.authors.length > 0 && (
            <p className="illus-popup-authors">{r.book.authors.join('; ')}</p>
          )}
        </div>

        {/* Badges */}
        <div className="illus-popup-badges">
          {r.book.year && (
            <span className="illus-popup-badge illus-popup-badge--year">{r.book.year}</span>
          )}
          {r.book.language.filter((l) => l).map((l) => (
            <span key={l} className="illus-popup-badge">{l}</span>
          ))}
          {r.book.category && (
            <span className="illus-popup-badge illus-popup-badge--cat">{r.book.category}</span>
          )}
        </div>

        <div className="illus-popup-divider" />

        {/* Source */}
        <div className="illus-popup-section-label">Source</div>
        <MetaRow label="Shelfmark" value={r.book.shelfmark} />
        <MetaRow label="Page" value={`${r.page.page_number}`} />
        <MetaRow label="Page size" value={pageSize} />

        <div className="illus-popup-divider" />

        {/* Illustration */}
        <div className="illus-popup-section-label">Illustration</div>
        <MetaRow label="Crop size" value={cropSize} />
        <MetaRow label="Bbox (px)" value={bboxStr} />

        <div className="illus-popup-divider" />

        {/* Detection */}
        <div className="illus-popup-section-label">Detection</div>
        {r.detection.plant_type_by_YOLO ? (
          <MetaRow
            label="YOLO"
            value={`${r.detection.plant_type_by_YOLO.replace(/_/g, ' ')}  (${(r.detection.confidence * 100).toFixed(1)}%)`}
          />
        ) : (
          <MetaRow label="YOLO" value="—" />
        )}
        {r.detection.plant_type_from_text && (
          <MetaRow label="From text" value={r.detection.plant_type_from_text} />
        )}

        {/* Caption */}
        {r.text.illustration_caption && (
          <>
            <div className="illus-popup-divider" />
            <div className="illus-popup-section-label">Caption</div>
            <p className="illus-popup-caption">"{r.text.illustration_caption}"</p>
          </>
        )}

        {/* Verification notes */}
        {r.quality.verification_notes && (
          <p className="illus-popup-notes">{r.quality.verification_notes}</p>
        )}

        {/* Footer */}
        <div className="illus-popup-footer">
<a
            href={r.book.iiif_manifest}
            target="_blank"
            rel="noreferrer"
            className="illus-popup-manifest-link"
          >
            IIIF Manifest ↗
          </a>
        </div>
      </div>
      </div>{/* end .illus-popup-main */}

      {/* ── Neighbor illustrations strip ── */}
      {neighborPhotos.length > 0 && (
        <div className="illus-popup-neighbors">
          <div className="illus-popup-neighbors-label">Similar Illustrations</div>
          <div className="illus-popup-neighbors-strip">
            {neighborPhotos.map((np) => (
              <button
                key={np.record.illustration_id}
                className="illus-neighbor-thumb"
                onClick={() => onSelectNeighbor(np)}
                title={np.record.book.title}
              >
                <img src={np.src} alt="" loading="lazy" />
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

// ── Lazy network section (only mounts when scrolled into view) ──

function LazyNetworkSection() {
  const sentinelRef = useRef<HTMLDivElement>(null)
  const [shouldRender, setShouldRender] = useState(false)

  useEffect(() => {
    const el = sentinelRef.current
    if (!el) return
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setShouldRender(true)
          observer.disconnect()
        }
      },
      { rootMargin: '300px' }, // start loading 300 px before it enters the viewport
    )
    observer.observe(el)
    return () => observer.disconnect()
  }, [])

  return (
    <div ref={sentinelRef}>
      {shouldRender && <IllustrationNetworkSection />}
    </div>
  )
}

// ── Page ──────────────────────────────────────────────────

const ILLUS_PER_PAGE = 70

export function IllustrationsPage() {
  const [dataLoading, setDataLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [totalCount, setTotalCount] = useState(0)
  const [selectedPhoto, setSelectedPhoto] = useState<IllustrationPhoto | null>(null)
  const [currentPage, setCurrentPage] = useState(1)

  const allPhotosRef = useRef<IllustrationPhoto[]>([])
  const photoMapRef = useRef<Map<string, IllustrationPhoto>>(new Map())
  const popupRef = useRef<HTMLDivElement>(null)
  const gridTopRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    fetch(illustrationsUrl)
      .then((res) => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`)
        return res.text()
      })
      .then((text) => {
        allPhotosRef.current = text
          .split('\n')
          .filter(Boolean)
          .map((line): IllustrationPhoto => {
            const record = JSON.parse(line) as IllustrationRecord
            return {
              src: `${AZURE_BASE}/${record.illustration.crop_image}?${AZURE_SAS}`,
              width: record.illustration.width,
              height: record.illustration.height,
              key: record.illustration_id,
              record,
            }
          })
        // Build lookup map for neighbor resolution
        const map = new Map<string, IllustrationPhoto>()
        allPhotosRef.current.forEach((p) => map.set(p.record.illustration_id, p))
        photoMapRef.current = map
        // Shuffle in place (Fisher-Yates) so order is random on every page load
        const arr = allPhotosRef.current
        for (let i = arr.length - 1; i > 0; i--) {
          const j = Math.floor(Math.random() * (i + 1))
          ;[arr[i], arr[j]] = [arr[j], arr[i]]
        }
        setTotalCount(allPhotosRef.current.length)
        setDataLoading(false)
      })
      .catch((err: unknown) => {
        setError(err instanceof Error ? err.message : String(err))
        setDataLoading(false)
      })
  }, [])

  // Close popup on Escape or click outside the card / illustrations
  useEffect(() => {
    if (!selectedPhoto) return
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setSelectedPhoto(null) }
    const onPointerDown = (e: PointerEvent) => {
      const target = e.target as Node
      // Keep open if click is inside the popup card
      if (popupRef.current?.contains(target)) return
      // Keep open if click is on a photo (its own onClick will handle toggling)
      if ((target as Element).closest?.('.illus-photo-wrapper')) return
      // Keep open if click is inside the network graph (sigma handles its own events)
      if ((target as Element).closest?.('.illus-network-sigma')) return
      setSelectedPhoto(null)
    }
    window.addEventListener('keydown', onKey)
    document.addEventListener('pointerdown', onPointerDown)
    return () => {
      window.removeEventListener('keydown', onKey)
      document.removeEventListener('pointerdown', onPointerDown)
    }
  }, [selectedPhoto])

  const closePopup = () => setSelectedPhoto(null)

  const totalPages = Math.max(1, Math.ceil(totalCount / ILLUS_PER_PAGE))

  const handlePageChange = (page: number) => {
    setCurrentPage(page)
    setSelectedPhoto(null)
    gridTopRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  const pagePhotos = allPhotosRef.current.slice(
    (currentPage - 1) * ILLUS_PER_PAGE,
    currentPage * ILLUS_PER_PAGE,
  )

  if (dataLoading) {
    return (
      <div className="illus-loading">
        <div className="illus-spinner" />
        <p>Loading illustrations…</p>
      </div>
    )
  }

  if (error) {
    return <div className="illus-error">Failed to load illustrations: {error}</div>
  }

  return (
    <div className="illus-page">
      <div className="illus-header">
        <h2 className="illus-heading">Botanical Illustrations</h2>
        <p className="illus-subheading">
          {totalCount.toLocaleString()} illustrations extracted from the books.
          Click any image to inspect its source page.
        </p>
      </div>

      {/* Page info bar */}
      <div ref={gridTopRef} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
        <span style={{ color: '#475569', fontSize: '0.8rem' }}>
          Showing {((currentPage - 1) * ILLUS_PER_PAGE + 1).toLocaleString()}–{Math.min(currentPage * ILLUS_PER_PAGE, totalCount).toLocaleString()} of {totalCount.toLocaleString()}
        </span>
        <span style={{ color: '#475569', fontSize: '0.8rem' }}>
          Page {currentPage} of {totalPages}
        </span>
      </div>

      <MasonryPhotoAlbum<IllustrationPhoto>
        photos={pagePhotos}
        columns={(w) => (w < 500 ? 2 : w < 800 ? 3 : w < 1100 ? 4 : 5)}
        spacing={6}
        componentsProps={{
          wrapper: ({ photo }) => ({
            className: `illus-photo-wrapper${selectedPhoto?.key === photo.key ? ' illus-photo-selected' : ''}`,
            onClick: (e: React.MouseEvent<HTMLDivElement>) => {
              e.stopPropagation()
              setSelectedPhoto(photo)
            },
          }),
          image: {
            loading: 'lazy' as const,
            className: 'illus-photo-img',
          },
        }}
      />

      <Paginator currentPage={currentPage} totalPages={totalPages} onPageChange={handlePageChange} />

      <LazyNetworkSection />

      {selectedPhoto && (
        <IllustrationPopup
          photo={selectedPhoto}
          onClose={closePopup}
          popupRef={popupRef}
          photoMap={photoMapRef.current}
          onSelectNeighbor={setSelectedPhoto}
        />
      )}
    </div>
  )
}
