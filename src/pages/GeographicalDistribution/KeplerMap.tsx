import React, { useEffect } from 'react';
import { createStore, combineReducers, applyMiddleware } from 'redux';
import { Provider, useDispatch } from 'react-redux';
import keplerReducers from '@kepler.gl/reducers';
import keplerComponents from '@kepler.gl/components';
import keplerActions from '@kepler.gl/actions';
import { taskMiddleware } from 'react-palm/tasks';
import 'mapbox-gl/dist/mapbox-gl.css';
import plantPoints from '../../data/plant_points.json';

const keplerGlReducer = (keplerReducers as any).keplerGlReducer || keplerReducers;
const KeplerGl = (keplerComponents as any).KeplerGl || keplerComponents;
const addDataToMap = (keplerActions as any).addDataToMap || keplerActions;

const reducers = combineReducers({
  keplerGl: keplerGlReducer
});

const store = createStore(reducers, {}, applyMiddleware(taskMiddleware));

const Map = () => {
  const dispatch = useDispatch();
  // Vite exposes env vars to browser code only when prefixed with `VITE_`.
  const mapboxToken = (import.meta.env.VITE_MAPBOX_TOKEN as string | undefined) || '';

  useEffect(() => {
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
          readOnly: false
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
                  color: [255, 204, 0],
                  columns: {
                    lat: 'lat',
                    lng: 'lng'
                  },
                  isVisible: true,
                  visConfig: {
                    opacity: 0.8,
                    colorRange: {
                      name: 'Global Warming',
                      type: 'sequential',
                      category: 'Uber',
                      colors: ['#5A1846', '#900C3F', '#C70039', '#E3611C', '#F1920E', '#FFC300']
                    },
                    radius: 20
                  }
                },
                visualChannels: {
                  weightField: { name: 'count', type: 'integer' },
                  weightScale: 'linear'
                }
              },
              {
                id: 'point',
                type: 'point',
                config: {
                  dataId: 'plant_data',
                  label: 'Observations',
                  color: [24, 144, 255],
                  columns: {
                    lat: 'lat',
                    lng: 'lng'
                  },
                  isVisible: false,
                  visConfig: {
                    radius: 10,
                    fixedRadius: false,
                    opacity: 0.8,
                    outline: false,
                    thickness: 2,
                    strokeColor: null,
                    colorRange: {
                      name: 'Global Warming',
                      type: 'sequential',
                      category: 'Uber',
                      colors: ['#5A1846', '#900C3F', '#C70039', '#E3611C', '#F1920E', '#FFC300']
                    },
                    radiusRange: [0, 50]
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
              }
            }
          },
          mapState: {
            bearing: 0,
            dragRotate: false,
            latitude: 45,
            longitude: 10,
            pitch: 0,
            zoom: 3,
            isSplit: false
          },
          mapStyle: {
            styleType: 'dark',
            topLayerGroups: {},
            visibleLayerGroups: {
              label: true,
              road: true,
              border: false,
              building: true,
              water: true,
              land: true,
              '3d building': false
            }
          }
        }
      })
    );
  }, [dispatch]);

  return (
    <div style={{ width: '100%', height: '800px', position: 'relative' }}>
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
            zIndex: 2
          }}
        >
          Map is unavailable because VITE_MAPBOX_TOKEN is not set.
        </div>
      )}
      <KeplerGl
        id="plant-distribution-map"
        mapboxApiAccessToken={mapboxToken}
        width={window.innerWidth}
        height={800}
      />
    </div>
  );
};

export const KeplerMap: React.FC = () => {
  return (
    <Provider store={store}>
      <Map />
    </Provider>
  );
};
