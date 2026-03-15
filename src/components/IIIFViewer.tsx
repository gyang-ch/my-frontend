import React, { useEffect, useRef, useState } from 'react';
import OpenSeadragon from 'openseadragon';
import Tippy from '@tippyjs/react';
import 'tippy.js/dist/tippy.css';
import 'tippy.js/animations/scale.css';
import { getPlantColor } from '../utils/colors';

export interface OCRResult {
  text?: string;
  label?: string;
  baseline?: number[][];
  boundary: number[][];
  confidence?: number;
}

export interface CharacterBox {
  text?: string;
  label?: string;
  boundary: number[][];
  confidence?: number;
  line_index?: number;
  estimated?: boolean;
}

interface IIIFViewerProps {
  tileSources: any;
  initialPage?: number;
  onPageChange?: (page: number) => void;
  ocrResults?: OCRResult[];
  characterBoxes?: CharacterBox[];
  highlightIndex?: number | null;
  onHoverLine?: (index: number | null) => void;
  imageSize?: { width: number; height: number } | null;
}

export const IIIFViewer: React.FC<IIIFViewerProps> = ({ 
  tileSources, 
  initialPage = 0, 
  onPageChange,
  ocrResults = [],
  characterBoxes = [],
  highlightIndex = null,
  onHoverLine,
}) => {
  const viewerRef = useRef<HTMLDivElement>(null);
  const osdRef = useRef<OpenSeadragon.Viewer | null>(null);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    if (viewerRef.current && !osdRef.current) {
      const viewer = OpenSeadragon({
        element: viewerRef.current,
        prefixUrl: 'https://openseadragon.github.io/openseadragon/images/',
        tileSources: tileSources,
        initialPage: initialPage,
        crossOriginPolicy: 'Anonymous',
        showNavigationControl: false,
        showSequenceControl: false,
        showNavigator: true,
        navigatorPosition: 'BOTTOM_RIGHT',
        navigatorSizeRatio: 0.2,
        navigatorMaintainSizeRatio: true,
        navigatorAutoFade: true,
        navigatorDisplayRegionColor: '#38bdf8', // Blue-ish color instead of red
        sequenceMode: true,
        showReferenceStrip: false,
        preserveViewport: true,
        visibilityRatio: 1.0,
        constrainDuringPan: true,
        defaultZoomLevel: 0,
        minZoomLevel: 0,
        maxZoomLevel: 10,
        autoResize: true,
      });

      viewer.addHandler('page', (event: any) => {
        if (onPageChange) onPageChange(event.page);
      });

      viewer.addHandler('open', () => {
        setIsReady(true);
      });

      osdRef.current = viewer;
    }

    return () => {
      if (osdRef.current) {
        osdRef.current.destroy();
        osdRef.current = null;
      }
    };
  }, []); // Only init once

  // Sync page when initialPage prop changes (from dropdown)
  useEffect(() => {
    if (osdRef.current) {
      const currentPage = osdRef.current.currentPage();
      if (currentPage !== initialPage) {
        osdRef.current.goToPage(initialPage);
      }
    }
  }, [initialPage]);

  const handleDownload = async () => {
    if (!osdRef.current) return;
    const viewer = osdRef.current;
    const pageIndex = viewer.currentPage();
    
    // Attempt to get the source URL
    const currentSource = Array.isArray(tileSources) ? tileSources[pageIndex] : tileSources;
    
    let iiifBaseUrl = '';
    if (typeof currentSource === 'string') {
      iiifBaseUrl = currentSource.replace('/info.json', '');
    } else if (currentSource && (currentSource['@id'] || currentSource.id)) {
      iiifBaseUrl = (currentSource['@id'] || currentSource.id).replace('/info.json', '');
    }

    if (iiifBaseUrl) {
      // Use 'max' or 'full' for the full size image
      const downloadUrl = `${iiifBaseUrl}/full/max/0/default.jpg`;
      
      try {
        const response = await fetch(downloadUrl);
        const blob = await response.blob();
        const blobUrl = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = blobUrl;
        link.download = `folio-${pageIndex + 1}.jpg`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(blobUrl);
      } catch (error) {
        console.error('Download failed, falling back to new tab:', error);
        window.open(downloadUrl, '_blank');
      }
    } else {
      // Fallback: save current canvas view
      try {
        const canvas = viewer.drawer.canvas;
        const dataUrl = (canvas as HTMLCanvasElement).toDataURL('image/jpeg', 0.95);
        const link = document.createElement('a');
        link.href = dataUrl;
        link.download = `view-page-${pageIndex + 1}.jpg`;
        link.click();
      } catch (e) {
        console.error('Canvas download failed:', e);
      }
    }
  };

  return (
    <div className="iiif-viewer-container" style={{ 
      position: 'relative', 
      width: '100%', 
      height: '650px', 
      backgroundColor: '#1e293b', 
      borderRadius: '12px', 
      overflow: 'hidden',
      boxShadow: 'inset 0 0 20px rgba(0,0,0,0.5)'
    }}>
      <style>{`
        /* Navigator Custom Styles */
        .navigator {
          background-color: #0f172a !important;
          border-radius: 8px !important;
          overflow: hidden !important;
          box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.5) !important;
          transition: border-color 0.3s ease, box-shadow 0.3s ease !important;
          border: 1px solid #334155 !important;
          box-sizing: border-box !important;
        }
        .navigator:hover {
          border-color: #38bdf8 !important;
          box-shadow: 0 0 12px rgba(56, 189, 248, 0.4) !important;
        }
        .displayregion {
          border-radius: 2px !important;
          border: 2px solid #38bdf8 !important;
          transition: border-color 0.2s ease !important;
        }
        .displayregion:hover {
          border-color: #7dd3fc !important;
        }

        /* Toolbar Styles */
        .custom-osd-toolbar {
          position: absolute;
          top: 16px;
          right: 16px;
          z-index: 20;
          display: flex;
          flex-direction: column;
          gap: 12px;
          transition: all 0.3s;
        }
        .osd-btn-wrapper {
          position: relative;
          width: 40px;
          height: 40px;
        }
        .osd-btn-glow {
          position: absolute;
          top: -4px; right: -4px; bottom: -4px; left: -4px;
          border-radius: 8px;
          background: linear-gradient(to right, #2dd4bf, #06b6d4);
          opacity: 0;
          filter: blur(4px);
          transition: opacity 0.2s;
          pointer-events: none;
        }
        .osd-btn-wrapper:hover .osd-btn-glow {
          opacity: 1;
        }
        .osd-btn {
          position: relative;
          display: flex;
          width: 100%;
          height: 100%;
          align-items: center;
          justify-content: center;
          border-radius: 8px;
          border: 1px solid #e2e8f0;
          background-color: rgba(255, 255, 255, 0.95);
          color: #334155;
          box-shadow: 0 1px 2px 0 rgba(0, 0, 0, 0.05);
          transition: all 0.2s;
          cursor: pointer;
          padding: 0;
        }
        .osd-btn:hover {
          background-color: #0d9488;
          color: #ffffff;
          border-color: #14b8a6;
          transform: scale(1.05);
        }
        .osd-btn:active {
          transform: scale(0.95);
        }
      `}</style>

      {/* Custom Floating Toolbar */}
      <div className="custom-osd-toolbar">
        <div className="osd-btn-wrapper" title="Previous Page">
          <div className="osd-btn-glow"></div>
          <button className="osd-btn" onClick={() => {
            if (osdRef.current && osdRef.current.currentPage() > 0) {
              osdRef.current.goToPage(osdRef.current.currentPage() - 1);
            }
          }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6"></polyline></svg>
          </button>
        </div>

        <div className="osd-btn-wrapper" title="Next Page">
          <div className="osd-btn-glow"></div>
          <button className="osd-btn" onClick={() => {
            if (osdRef.current && tileSources && osdRef.current.currentPage() < tileSources.length - 1) {
              osdRef.current.goToPage(osdRef.current.currentPage() + 1);
            }
          }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6"></polyline></svg>
          </button>
        </div>

        <div className="osd-btn-wrapper" title="Zoom In">
          <div className="osd-btn-glow"></div>
          <button className="osd-btn" onClick={() => osdRef.current?.viewport?.zoomBy(1.2)}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
          </button>
        </div>

        <div className="osd-btn-wrapper" title="Zoom Out">
          <div className="osd-btn-glow"></div>
          <button className="osd-btn" onClick={() => osdRef.current?.viewport?.zoomBy(0.8)}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="5" y1="12" x2="19" y2="12"></line></svg>
          </button>
        </div>

        <div className="osd-btn-wrapper" title="Reset View">
          <div className="osd-btn-glow"></div>
          <button className="osd-btn" onClick={() => osdRef.current?.viewport?.goHome()}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"></path><path d="M3 3v5h5"></path></svg>
          </button>
        </div>

        <div className="osd-btn-wrapper" title="Full Screen">
          <div className="osd-btn-glow"></div>
          <button className="osd-btn" onClick={() => osdRef.current?.setFullScreen(!osdRef.current?.isFullPage())}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M8 3H5a2 2 0 0 0-2 2v3m18 0V5a2 2 0 0 0-2-2h-3m0 18h3a2 2 0 0 0 2-2v-3M3 16v3a2 2 0 0 0 2 2h3"></path></svg>
          </button>
        </div>

        <div className="osd-btn-wrapper" title="Download Full Page">
          <div className="osd-btn-glow"></div>
          <button className="osd-btn" onClick={handleDownload}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line></svg>
          </button>
        </div>
      </div>

      <div ref={viewerRef} style={{ width: '100%', height: '100%' }} />
      {isReady && osdRef.current && ((ocrResults && ocrResults.length > 0) || (characterBoxes && characterBoxes.length > 0)) && (
        <OverlayLayer 
          viewer={osdRef.current} 
          ocrResults={ocrResults} 
          characterBoxes={characterBoxes}
          highlightIndex={highlightIndex}
          onHoverLine={onHoverLine}
        />
      )}
    </div>
  );
};

interface OverlayLayerProps {
  viewer: OpenSeadragon.Viewer;
  ocrResults: OCRResult[];
  characterBoxes: CharacterBox[];
  highlightIndex: number | null;
  onHoverLine?: (index: number | null) => void;
}

const OverlayLayer: React.FC<OverlayLayerProps> = ({ viewer, ocrResults, characterBoxes, highlightIndex, onHoverLine }) => {
  const [, setTick] = useState(0);

  useEffect(() => {
    const update = () => setTick(t => t + 1);
    // 'animation' triggers on every frame of a smooth zoom/pan
    viewer.addHandler('animation', update);
    viewer.addHandler('canvas-drag', update);
    viewer.addHandler('canvas-scroll', update);
    viewer.addHandler('resize', update);
    return () => {
      viewer.removeHandler('animation', update);
      viewer.removeHandler('canvas-drag', update);
      viewer.removeHandler('canvas-scroll', update);
      viewer.removeHandler('resize', update);
    };
  }, [viewer]);

  const getSVGPath = (points: number[][]) => {
    if (!points || points.length < 2 || !viewer.viewport) return '';
    try {
      const pathData = points.map((p) => {
        const viewportPt = viewer.viewport.imageToViewportCoordinates(p[0], p[1]);
        const containerPt = viewer.viewport.viewportToViewerElementCoordinates(viewportPt);
        return `${containerPt.x},${containerPt.y}`;
      });
      return `M ${pathData.join(' L ')} Z`;
    } catch (e) {
      return '';
    }
  };

  return (
    <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', pointerEvents: 'none', zIndex: 10 }}>
      <svg style={{ width: '100%', height: '100%', pointerEvents: 'none' }}>
        {characterBoxes.map((char, idx) => {
          const path = getSVGPath(char.boundary);
          if (!path) return null;
          const content = char?.label && char?.confidence ? `Plant (${(char.confidence * 100).toFixed(1)}%)` : (char?.text || '');
          
          return (
            <Tippy key={`char-${idx}`} content={content} theme="seadragon" placement="top" animation="scale" arrow={true}>
              <path
                d={path}
                className="char-box-path"
                fill={char.estimated ? 'rgba(249, 115, 22, 0.10)' : 'rgba(16, 185, 129, 0.16)'}
                stroke={char.estimated ? 'rgba(249, 115, 22, 0.25)' : 'rgba(16, 185, 129, 0.35)'}
                strokeWidth={0.8}
                style={{ pointerEvents: 'auto', cursor: 'pointer' }}
              />
            </Tippy>
          );
        })}
        {ocrResults.map((result, idx) => {
          const path = getSVGPath(result.boundary);
          if (!path) return null;
          const isPlant = !!result.label;
          const content = isPlant ? `${result.label} (${(result.confidence! * 100).toFixed(1)}%)` : (result?.text || '');
          const plantColor = isPlant ? getPlantColor(result.label!) : '';
          
          const pathEl = (
            <path
              d={path}
              className={isPlant ? "plant-box-path" : "ocr-result-path"}
              fill={isPlant 
                ? (highlightIndex === idx ? `rgba(${plantColor}, 0.25)` : `rgba(${plantColor}, 0.12)`)
                : (highlightIndex === idx ? 'rgba(66, 153, 225, 0.4)' : 'rgba(66, 153, 225, 0.1)')
              }
              stroke={isPlant
                ? (highlightIndex === idx ? `rgba(${plantColor}, 0.8)` : `rgba(${plantColor}, 0.5)`)
                : (highlightIndex === idx ? '#3182ce' : 'rgba(66, 153, 225, 0.5)')
              }
              strokeWidth={isPlant ? 2.0 : 2.8}
              strokeLinejoin="round"
              strokeLinecap="round"
              style={{ 
                transition: 'fill 0.15s, stroke 0.15s', 
                pointerEvents: 'auto', 
                cursor: 'pointer',
                vectorEffect: 'non-scaling-stroke' 
              }}
              onMouseEnter={() => {
                onHoverLine?.(idx);
              }}
              onMouseLeave={() => {
                onHoverLine?.(null);
              }}
            />
          );

          return (
            <Tippy key={`ocr-${idx}`} content={content} theme="seadragon" placement="top" animation="scale" arrow={true}>
              {pathEl}
            </Tippy>
          );
        })}
      </svg>
    </div>
  );
};
