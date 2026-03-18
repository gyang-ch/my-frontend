import React, { useEffect, useState, useRef } from 'react';
import Globe from 'react-globe.gl';
import * as d3 from 'd3';
import 'tippy.js/dist/tippy.css';
import 'tippy.js/animations/scale.css';
import plantPoints from '../../data/plant_points.json';
import { KeplerMap } from './KeplerMap';

type PlantPoint = { lat: number; lng: number; count: number };
const plantPointData = plantPoints as PlantPoint[];

export const GeographicalDistribution: React.FC = () => {
  const [hexData, setHexData] = useState<any[]>([]);
  const globeRef = useRef<any>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [hoverData, setHoverData] = useState<{ x: number; y: number; count: number } | null>(null);
  const cursorRef = useRef({ x: 0, y: 0 });
  const [width, setWidth] = useState(Math.min(window.innerWidth - 64, 1200));

  useEffect(() => {
    const globePoints = plantPointData.map(point => ({
      lat: point.lat,
      lng: point.lng,
      weight: point.count
    }));

    setHexData(globePoints);
  }, []);

  useEffect(() => {
    const handleResize = () => setWidth(Math.min(window.innerWidth - 64, 1200));
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    if (globeRef.current) {
      globeRef.current.controls().autoRotate = true;
      globeRef.current.controls().autoRotateSpeed = 0.6;
    }
  }, [globeRef.current]);

  useEffect(() => {
    const handleMove = (event: MouseEvent) => {
      cursorRef.current = { x: event.clientX, y: event.clientY };
      if (hoverData) {
        setHoverData((prev) =>
          prev ? { ...prev, x: event.clientX, y: event.clientY } : prev
        );
      }
    };

    window.addEventListener('mousemove', handleMove, { passive: true });
    return () => window.removeEventListener('mousemove', handleMove);
  }, [hoverData]);

  const maxWeight = d3.max(plantPointData, d => d.count) ?? 1;
  const weightColor = d3.scaleSequential(d3.interpolateYlGn)
    .domain([0, maxWeight]);

  return (
    <div style={{ width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', background: '#FFFFFF', padding: '6rem 2rem 4rem', boxSizing: 'border-box' }}>
      <div style={{ width: '100%', maxWidth: '1200px', display: 'flex', flexDirection: 'column', gap: '4rem' }}>
        
        {/* Kepler.gl Map Section */}
        <div style={{ width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', background: '#0f172a', padding: '2rem 0', borderRadius: '16px', overflow: 'hidden', boxShadow: '0 10px 30px rgba(0,0,0,0.2)' }}>
          <h2 style={{ fontFamily: '"EB Garamond", Georgia, serif', color: '#e2e8f0', marginBottom: '1.5rem', letterSpacing: '0.02em', textAlign: 'center' }}>
            Detailed Plant Distribution
          </h2>
          <KeplerMap width={width} />
        </div>

        {/* 3D Globe Section */}
        <div
          ref={containerRef}
          style={{ width: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', position: 'relative', background: '#0f172a', padding: '2rem 0', borderRadius: '16px', overflow: 'hidden', boxShadow: '0 10px 30px rgba(0,0,0,0.2)' }}
        >
          <h2 style={{ fontFamily: '"EB Garamond", Georgia, serif', color: '#e2e8f0', marginBottom: '1.5rem', letterSpacing: '0.02em', textAlign: 'center' }}>
            Global 3D Overview
          </h2>
          {hoverData && (
            <div
              style={{
                position: 'fixed',
                left: hoverData.x + 12,
                top: hoverData.y - 12,
                background: 'rgba(12, 20, 14, 0.92)',
                color: '#e2e8f0',
                padding: '6px 10px',
                borderRadius: '8px',
                fontFamily: '"EB Garamond", Georgia, serif',
                fontSize: '0.75rem',
                letterSpacing: '0.04em',
                textTransform: 'uppercase',
                pointerEvents: 'none',
                zIndex: 20,
                boxShadow: '0 8px 20px rgba(0,0,0,0.3)',
                border: '1px solid rgba(226, 232, 240, 0.2)'
              }}
            >
              Observations: {hoverData.count.toLocaleString()}
            </div>
          )}
          <Globe
            ref={globeRef}
            width={width}
            height={800}
            backgroundColor="rgba(0,0,0,0)"
            globeImageUrl="//unpkg.com/three-globe/example/img/earth-blue-marble.jpg"
            bumpImageUrl="//unpkg.com/three-globe/example/img/earth-topology.png"
            hexBinPointsData={hexData}
            hexBinPointWeight="weight"
            hexAltitude={(d: any) => Math.log10(d.sumWeight + 1) * 0.12}
            hexBinResolution={4}
            hexTopColor={(d: any) => weightColor(d.sumWeight)}
            hexSideColor={(d: any) => weightColor(d.sumWeight)}
            hexBinMerge={true}
            enablePointerInteraction={true}
            onHexHover={(hex: any) => {
              if (!hex) {
                setHoverData(null);
                return;
              }
              const count = Math.round(hex.sumWeight ?? 0);
              const { x, y } = cursorRef.current;
              setHoverData({ x, y, count });
            }}
          />
        </div>

      </div>
    </div>
  );
};
