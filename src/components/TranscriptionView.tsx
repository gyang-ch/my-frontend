import React, { useState } from 'react';
import type { OCRResult } from './IIIFViewer';

interface TranscriptionViewProps {
  imageUrl: string;
  ocrResults: OCRResult[];
  imageSize: { width: number; height: number };
  highlightIndex: number | null;
  onHoverLine: (index: number | null) => void;
}

export const TranscriptionView: React.FC<TranscriptionViewProps> = ({
  imageUrl,
  ocrResults,
  imageSize,
  highlightIndex,
  onHoverLine
}) => {
  const [isLoaded, setIsLoaded] = useState(false);

  // Debug coordinate availability
  if (ocrResults.length > 0 && ocrResults[0].boundary.length > 0) {
    console.log("Transcription boxes data verified:", ocrResults.length, "lines found.");
  } else if (ocrResults.length > 0) {
    console.warn("Transcription lines found, but boundary data is empty!");
  }

  // Safety check for required data
  if (!imageUrl || !ocrResults || !imageSize) {
    return <div className="error-placeholder">Missing data for spatial analysis.</div>;
  }

  const getSVGPath = (points: number[][]) => {
    if (!points || points.length < 2) return '';
    try {
      const pathData = points.map((p) => `${p[0]},${p[1]}`);
      return `M ${pathData.join(' L ')} Z`;
    } catch (e) {
      return '';
    }
  };

  return (
    <div className="transcription-viz-container">
      <div className="viz-header">
        <h4>Spatial Analysis</h4>
        <p className="viz-subtitle">Transcription mapping (Pixel Resolution: {imageSize.width}x{imageSize.height})</p>
      </div>
      
      <div className="image-overlay-wrapper">
        <img 
          src={imageUrl} 
          alt="Transcription source" 
          className="base-image"
          onLoad={() => setIsLoaded(true)}
          onError={() => console.error("Failed to load image for transcription view")}
        />
        
        {isLoaded && (
          <svg 
            viewBox={`0 0 ${imageSize.width} ${imageSize.height}`}
            className="viz-svg-overlay"
            preserveAspectRatio="xMidYMid meet"
          >
            {ocrResults.map((result, idx) => {
              const path = getSVGPath(result.boundary);
              if (!path) return null;
              
              return (
                <path
                  key={idx}
                  d={path}
                  className={`viz-path ${highlightIndex === idx ? 'highlighted' : ''}`}
                  onMouseEnter={() => onHoverLine(idx)}
                  onMouseLeave={() => onHoverLine(null)}
                />
              );
            })}
          </svg>
        )}
      </div>
    </div>
  );
};
