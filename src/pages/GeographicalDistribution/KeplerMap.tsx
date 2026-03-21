import React, { useEffect } from 'react';
import { createStore, combineReducers, applyMiddleware } from 'redux';
import { Provider, useDispatch } from 'react-redux';
import keplerReducers from '@kepler.gl/reducers';
import keplerComponents from '@kepler.gl/components';
import keplerActions from '@kepler.gl/actions';
import { taskMiddleware } from 'react-palm/tasks';
import 'mapbox-gl/dist/mapbox-gl.css';
const keplerGlReducer = (keplerReducers as any).keplerGlReducer || keplerReducers;
const KeplerGl = (keplerComponents as any).KeplerGl || keplerComponents;
const addDataToMap = (keplerActions as any).addDataToMap || keplerActions;

const reducers = combineReducers({
  keplerGl: keplerGlReducer
});

const store = createStore(reducers, {}, applyMiddleware(taskMiddleware));

const Map = ({ width }: { width: number }) => {
  const dispatch = useDispatch();
  // Vite exposes env vars to browser code only when prefixed with `VITE_`.
  const mapboxToken = (import.meta.env.VITE_MAPBOX_TOKEN as string | undefined) || '';

  useEffect(() => {
    fetch('/data/plant_points.json')
      .then(res => res.json())
      .then((plantPoints: { lat: number; lng: number; count: number }[]) => {
    const data = {
      fields: [
        { name: 'lat', format: '', type: 'real' },
        { name: 'lng', format: '', type: 'real' },
        { name: 'count', format: '', type: 'integer' }
      ],
      rows: plantPoints.map(p => [p.lat, p.lng, p.count])
    };

    dispatch(
      addDataToMap({
        datasets: {
          info: {
            label: 'Plant Distribution',
            id: 'plant_data'
          },
          data
        },
        option: {
          centerMap: true,
          readOnly: false,
          keepExistingConfig: false
        },
        config: {
          visState: {
            filters: [],
            layers: [
              {
                id: 'heatmap',
                type: 'heatmap',
                config: {
                  dataId: 'plant_data',
                  label: 'Density Heatmap',
                  isVisible: true,
                  visConfig: {
                    opacity: 0.85,
                    colorRange: {
                      name: 'Magenta',
                      type: 'sequential',
                      category: 'Uber',
                      colors: ['#310230', '#790971', '#B010A5', '#D440D0', '#E987E8', '#FFCFFF']
                    },
                    radius: 25
                  }
                },
                visualChannels: {
                  weightField: { name: 'count', type: 'integer' },
                  weightScale: 'linear'
                }
              },
              {
                id: 'hexagon-bars',
                type: 'hexagon',
                config: {
                  dataId: 'plant_data',
                  label: 'Distribution Bars',
                  isVisible: true,
                  visConfig: {
                    opacity: 0.8,
                    worldUnitSize: 50,
                    resolution: 8,
                    colorRange: {
                      name: 'Magenta',
                      type: 'sequential',
                      category: 'Uber',
                      colors: ['#310230', '#790971', '#B010A5', '#D440D0', '#E987E8', '#FFCFFF']
                    },
                    coverage: 1,
                    sizeRange: [0, 500],
                    percentile: [0, 100],
                    elevationPercentile: [0, 100],
                    elevationScale: 100,
                    enable3d: true,
                    fixedRadius: false
                  }
                },
                visualChannels: {
                  colorField: { name: 'count', type: 'integer' },
                  colorScale: 'quantile',
                  sizeField: { name: 'count', type: 'integer' },
                  sizeScale: 'linear'
                }
              }
            ],
            interactionConfig: {
              tooltip: {
                fieldsToShow: {
                  plant_data: [{ name: 'count', format: null }]
                },
                enabled: true
              },
              brush: {
                size: 0.5,
                enabled: false
              },
              geocoder: {
                enabled: false
              },
              coordinate: {
                enabled: false
              }
            },
            mapControls: {
              mapLocale: { show: false, active: false },
              toggle3d: { show: true, active: false },
              splitMap: { show: false, active: false },
              mapLegend: { show: true, active: false },
              mapDraw: { show: false, active: false },
              mapStyle: { show: true, active: false }
            }
          },
          mapState: {
            bearing: 0,
            dragRotate: true,
            latitude: 20,
            longitude: 0,
            pitch: 40,
            zoom: 1.5,
            isSplit: false
          },
          mapStyle: {
            styleType: 'dark',
            topLayerGroups: {},
            visibleLayerGroups: {
              label: true,
              road: false,
              border: true,
              building: false,
              water: true,
              land: true,
              '3d building': false
            }
          }
        }
      })
    );
      });
  }, [dispatch]);

  return (
    <div style={{ width: `${width}px`, height: '800px', position: 'relative' }} className="kepler-map-container">
      <style>{`
        /* Seadragon-style Kepler.gl Customization */
        
        /* Side Panel Beautification */
        .kepler-map-container .side-panel__container {
          background-color: rgba(15, 23, 42, 0.85) !important;
          backdrop-filter: blur(12px) !important;
          border-right: 1px solid rgba(255, 255, 255, 0.1) !important;
        }

        .kepler-map-container .side-panel__header {
          background-color: transparent !important;
        }

        /* Beautify the Fold/Expand Toggle Button */
        .kepler-map-container .side-panel__panel-toggle {
          position: absolute !important;
          right: -16px !important;
          top: 24px !important;
          z-index: 100 !important;
        }

        .kepler-map-container .side-panel__panel-toggle button {
          width: 32px !important;
          height: 32px !important;
          border-radius: 50% !important;
          background-color: #ffffff !important;
          color: #334155 !important;
          border: 1px solid #e2e8f0 !important;
          display: flex !important;
          align-items: center !important;
          justify-content: center !important;
          box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06) !important;
          transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1) !important;
          cursor: pointer !important;
          margin: 0 !important;
        }

        .kepler-map-container .side-panel__panel-toggle button:hover {
          background-color: #0d9488 !important;
          color: #ffffff !important;
          border-color: #14b8a6 !important;
          transform: scale(1.1) !important;
          box-shadow: 0 0 15px rgba(13, 148, 136, 0.5) !important;
        }

        .kepler-map-container .side-panel__panel-toggle button svg {
          width: 16px !important;
          height: 16px !important;
          fill: currentColor !important;
        }

        .kepler-map-container .map-control {
          top: 16px !important;
          right: 16px !important;
          display: flex !important;
          flex-direction: column !important;
          gap: 12px !important;
        }

        /* Specifically hide the language/locale button */
        .kepler-map-container .locale-panel,
        .kepler-map-container .map-control-button.locale-control,
        .kepler-map-container [class*="locale"] {
          display: none !important;
        }

        .kepler-map-container .map-control-button {
          position: relative !important;
          width: 40px !important;
          height: 40px !important;
          display: flex !important;
          align-items: center !important;
          justify-content: center !important;
          border-radius: 8px !important;
          border: 1px solid #e2e8f0 !important;
          background-color: rgba(255, 255, 255, 0.95) !important;
          color: #334155 !important;
          box-shadow: 0 1px 2px 0 rgba(0, 0, 0, 0.05) !important;
          transition: all 0.2s !important;
          cursor: pointer !important;
          padding: 0 !important;
          margin-bottom: 0 !important;
        }

        .kepler-map-container .map-control-button:hover {
          background-color: #0d9488 !important;
          color: #ffffff !important;
          border-color: #14b8a6 !important;
          transform: scale(1.05) !important;
          box-shadow: 0 0 12px rgba(13, 148, 136, 0.4) !important;
        }

        .kepler-map-container .map-control-button:active {
          transform: scale(0.95) !important;
        }

        .kepler-map-container .map-control-button svg {
          width: 20px !important;
          height: 20px !important;
          fill: currentColor !important;
        }

        /* Hide the default tooltip in buttons if any */
        .kepler-map-container .map-control-button::before {
          display: none !important;
        }

        /* Hide Kepler.gl notification popups */
        .kepler-map-container .notification-panel,
        .kepler-map-container .notification-item,
        .kepler-map-container [class*="notification-panel"],
        .kepler-map-container [class*="NotificationPanel"] {
          display: none !important;
        }

        /* Customize legend to match */
        .kepler-map-container .map-control .map-legend {
          background-color: rgba(255, 255, 255, 0.95) !important;
          color: #334155 !important;
          border: 1px solid #e2e8f0 !important;
          border-radius: 12px !important;
          padding: 16px !important;
          box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1) !important;
        }
      `}</style>
      {!mapboxToken && (
        <div
          style={{
            position: 'absolute',
            inset: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '24px',
            textAlign: 'center',
            color: '#e2e8f0',
            background: 'rgba(0,0,0,0.6)',
            zIndex: 10
          }}
        >
          Map is unavailable because VITE_MAPBOX_TOKEN is not set.
        </div>
      )}
      <KeplerGl
        id="plant-distribution-map"
        mapboxApiAccessToken={mapboxToken}
        width={width}
        height={800}
        appName="Plant Distribution"
        version="v1.0"
        sidePanelWidth={280}
      />
    </div>
  );
};

export const KeplerMap: React.FC<{ width: number }> = ({ width }) => {
  return (
    <Provider store={store}>
      <Map width={width} />
    </Provider>
  );
};
