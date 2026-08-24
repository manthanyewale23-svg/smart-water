import React, { useEffect, useState, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline } from 'react-leaflet';
import L from 'leaflet';
import { mapApi } from '../api';
import { MapFeature } from '../types';
import { LoadingSpinner } from '../components/common/LoadingSpinner';
import { PROBLEM_TYPE_LABELS, STATUS_LABELS, formatRelativeTime } from '../utils';
import { RefreshCw, AlertTriangle, Layers, X } from 'lucide-react';

// Fix Leaflet default icons
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
});

// Custom colored div icons
function createIcon(color: string, symbol: string) {
  return L.divIcon({
    className: '',
    html: `<div style="background:${color};width:28px;height:28px;border-radius:50%;border:3px solid white;box-shadow:0 2px 6px rgba(0,0,0,0.3);display:flex;align-items:center;justify-content:center;font-size:13px;">${symbol}</div>`,
    iconSize: [28, 28],
    iconAnchor: [14, 14],
    popupAnchor: [0, -16],
  });
}

const ICONS: Record<string, L.DivIcon> = {
  tank: createIcon('#2563eb', '💧'),
  pump_station: createIcon('#7c3aed', '⚙️'),
  pipeline: createIcon('#f59e0b', '🔧'),
  valve: createIcon('#6b7280', '🔩'),
  sensor_flow: createIcon('#0891b2', '📊'),
  sensor_pressure: createIcon('#4f46e5', '📈'),
  sensor_tank_level: createIcon('#059669', '📉'),
  sensor_water_meter: createIcon('#0284c7', '💦'),
  complaint: createIcon('#dc2626', '⚠️'),
  maintenance: createIcon('#d97706', '🔧'),
};

interface LayerToggle {
  key: string;
  label: string;
  enabled: boolean;
}

const WaterMapPage: React.FC = () => {
  const [features, setFeatures] = useState<MapFeature[]>([]);
  const [loading, setLoading] = useState(true);
  const [tileError, setTileError] = useState(false);
  const [tileLoaded, setTileLoaded] = useState(false);
  const [mapError, setMapError] = useState('');
  const [showLayers, setShowLayers] = useState(false);
  const [layers, setLayers] = useState<LayerToggle[]>([
    { key: 'tank', label: '💧 Water Tanks', enabled: true },
    { key: 'pump_station', label: '⚙️ Pump Stations', enabled: true },
    { key: 'pipeline', label: '🔧 Pipelines', enabled: true },
    { key: 'valve', label: '🔩 Valves', enabled: true },
    { key: 'sensor', label: '📊 Sensors', enabled: true },
    { key: 'complaint', label: '⚠️ Complaints', enabled: true },
  ]);

  const fetchAssets = async () => {
    setLoading(true);
    setMapError('');
    try {
      const res = await mapApi.assets();
      setFeatures(res.data.features || []);
    } catch (err: any) {
      setMapError('Failed to load map data. Please retry.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchAssets(); }, []);

  const isLayerEnabled = (featureType: string) => {
    if (featureType === 'complaint') return layers.find(l => l.key === 'complaint')?.enabled;
    if (featureType === 'sensor') return layers.find(l => l.key === 'sensor')?.enabled;
    return layers.find(l => l.key === featureType)?.enabled;
  };

  const getFeatureIcon = (f: MapFeature): L.DivIcon => {
    const ft = f.properties.feature_type;
    if (ft === 'complaint') return ICONS.complaint;
    if (ft === 'sensor') return ICONS[`sensor_${f.properties.sensor_type}`] || ICONS.sensor_flow;
    return ICONS[ft] || createIcon('#6b7280', '📍');
  };

  // Pipelines to draw as polylines
  const pipelines = features.filter(f => f.properties.feature_type === 'pipeline' && f.properties.metadata);
  const pointFeatures = features.filter(f => f.properties.feature_type !== 'pipeline');

  const toggleLayer = (key: string) => {
    setLayers(prev => prev.map(l => l.key === key ? { ...l, enabled: !l.enabled } : l));
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Water Network Map</h1>
          <p className="text-sm text-gray-500">Interactive GIS map – Pune Municipal Water Network</p>
        </div>
        <div className="flex items-center gap-2">
          <span className="badge bg-amber-100 text-amber-700 text-xs">⚠️ DEMO DATA</span>
          <button onClick={() => setShowLayers(!showLayers)} className="btn-secondary flex items-center gap-2 py-2">
            <Layers size={16} /> Layers
          </button>
          <button onClick={fetchAssets} className="btn-secondary flex items-center gap-2 py-2">
            <RefreshCw size={16} /> Reload
          </button>
        </div>
      </div>

      {/* Layer toggles */}
      {showLayers && (
        <div className="card py-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold text-gray-800">Map Layers</h3>
            <button onClick={() => setShowLayers(false)}><X size={16} /></button>
          </div>
          <div className="flex flex-wrap gap-3">
            {layers.map(layer => (
              <label key={layer.key} className="flex items-center gap-2 cursor-pointer select-none">
                <input type="checkbox" checked={layer.enabled} onChange={() => toggleLayer(layer.key)} className="rounded" />
                <span className="text-sm text-gray-700">{layer.label}</span>
              </label>
            ))}
          </div>
        </div>
      )}

      {/* Legend */}
      <div className="card py-3">
        <div className="flex flex-wrap gap-4 text-xs">
          {[
            { color: '#2563eb', label: 'Water Tank' },
            { color: '#7c3aed', label: 'Pump Station' },
            { color: '#f59e0b', label: 'Pipeline/Valve' },
            { color: '#0891b2', label: 'Flow Sensor' },
            { color: '#4f46e5', label: 'Pressure Sensor' },
            { color: '#059669', label: 'Tank Level' },
            { color: '#dc2626', label: 'Complaint' },
          ].map(item => (
            <div key={item.label} className="flex items-center gap-1.5">
              <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }} />
              <span className="text-gray-600">{item.label}</span>
            </div>
          ))}
        </div>
      </div>

      {mapError && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-center gap-3">
          <AlertTriangle className="text-red-500" size={20} />
          <p className="text-red-700 flex-1">{mapError}</p>
          <button onClick={fetchAssets} className="btn-primary text-sm">Retry Map</button>
        </div>
      )}

      {/* The map */}
      <div className="card p-0 overflow-hidden" style={{ height: '60vh', minHeight: 400 }}>
        {loading && (
          <div className="absolute inset-0 z-10 flex items-center justify-center bg-gray-100">
            <LoadingSpinner size="lg" text="Loading map data..." />
          </div>
        )}

        {tileError && !tileLoaded && (
          <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-gray-100">
            <AlertTriangle className="text-amber-500 mb-3" size={40} />
            <p className="text-gray-700 font-medium mb-1">Map tiles are loading slowly</p>
            <p className="text-gray-500 text-sm mb-4">Dashboard data remains available. Check your internet connection.</p>
            <button onClick={fetchAssets} className="btn-primary">Retry Map</button>
          </div>
        )}

        <MapContainer
          center={[18.5204, 73.8567]}
          zoom={12}
          style={{ height: '100%', width: '100%' }}
          zoomControl={true}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            eventHandlers={{
              load: () => { setTileLoaded(true); setTileError(false); },
              error: () => setTileError(true),
            }}
          />

          {/* Pipeline polylines */}
          {layers.find(l => l.key === 'pipeline')?.enabled && pipelines.map(f => {
            const meta = f.properties.metadata || {};
            if (!meta.start_lat || !meta.end_lat) return null;
            const statusColor = f.properties.status === 'active' ? '#3b82f6' : f.properties.status === 'inspection_required' ? '#f59e0b' : '#ef4444';
            return (
              <Polyline
                key={f.properties.id}
                positions={[[meta.start_lat, meta.start_lng], [meta.end_lat, meta.end_lng]]}
                color={statusColor}
                weight={3}
                opacity={0.7}
                dashArray={f.properties.status === 'inspection_required' ? '8 5' : undefined}
              >
                <Popup>
                  <div className="min-w-[200px]">
                    <h4 className="font-bold text-gray-900 mb-1">{f.properties.name}</h4>
                    <p className="text-xs text-gray-500 mb-2">{f.properties.description}</p>
                    <div className="space-y-1 text-xs">
                      <div className="flex justify-between"><span className="text-gray-500">Diameter</span><span>{meta.diameter}mm</span></div>
                      <div className="flex justify-between"><span className="text-gray-500">Material</span><span>{meta.material}</span></div>
                      <div className="flex justify-between"><span className="text-gray-500">Length</span><span>{(meta.length_m / 1000).toFixed(1)} km</span></div>
                      <div className="flex justify-between"><span className="text-gray-500">Installed</span><span>{meta.installation_year}</span></div>
                      <div className="flex justify-between font-medium"><span className="text-gray-700">Status</span><span className={f.properties.status === 'active' ? 'text-green-600' : 'text-amber-600'}>{f.properties.status}</span></div>
                    </div>
                  </div>
                </Popup>
              </Polyline>
            );
          })}

          {/* Point markers */}
          {pointFeatures.filter(f => isLayerEnabled(f.properties.feature_type)).map(feature => (
            <Marker
              key={feature.properties.id}
              position={[feature.geometry.coordinates[1], feature.geometry.coordinates[0]]}
              icon={getFeatureIcon(feature)}
            >
              <Popup>
                <div className="min-w-[220px] max-w-xs">
                  <div className="font-bold text-gray-900 mb-1">{feature.properties.name}</div>
                  {feature.properties.zone_name && <div className="text-xs text-blue-600 mb-2">📍 {feature.properties.zone_name}</div>}

                  {feature.properties.feature_type === 'sensor' && (
                    <div className="space-y-1 text-sm">
                      <div className="flex justify-between"><span className="text-gray-500">Reading</span><span className="font-bold">{feature.properties.last_reading} {feature.properties.unit}</span></div>
                      <div className="flex justify-between"><span className="text-gray-500">Status</span><span className={`font-medium ${feature.properties.status === 'normal' ? 'text-green-600' : feature.properties.status === 'warning' ? 'text-amber-600' : 'text-red-600'}`}>{feature.properties.status?.toUpperCase()}</span></div>
                      {feature.properties.last_updated && <div className="text-xs text-gray-400">Updated {formatRelativeTime(feature.properties.last_updated)}</div>}
                    </div>
                  )}

                  {feature.properties.feature_type === 'tank' && feature.properties.metadata && (
                    <div className="space-y-1 text-sm">
                      <div className="flex justify-between"><span className="text-gray-500">Capacity</span><span>{(feature.properties.metadata.capacity / 1000).toFixed(0)}K L</span></div>
                      <div className="flex justify-between"><span className="text-gray-500">Level</span><span className="font-bold">{feature.properties.metadata.current_level}%</span></div>
                      <div className="w-full bg-gray-100 rounded-full h-2 mt-1">
                        <div className="bg-blue-500 rounded-full h-2" style={{ width: `${feature.properties.metadata.current_level}%` }} />
                      </div>
                    </div>
                  )}

                  {feature.properties.feature_type === 'complaint' && (
                    <div className="space-y-1 text-sm">
                      <div><span className="text-gray-500">Type: </span><span className="font-medium">{PROBLEM_TYPE_LABELS[feature.properties.problem_type] || feature.properties.problem_type}</span></div>
                      <div><span className="text-gray-500">Priority: </span><span className="font-medium capitalize">{feature.properties.priority}</span></div>
                      <div><span className="text-gray-500">Status: </span><span>{STATUS_LABELS[feature.properties.status] || feature.properties.status}</span></div>
                      {feature.properties.description && <p className="text-xs text-gray-400 mt-1 line-clamp-2">{feature.properties.description}</p>}
                    </div>
                  )}

                  {feature.properties.feature_type === 'pump_station' && feature.properties.metadata && (
                    <div className="space-y-1 text-sm">
                      <div className="flex justify-between"><span className="text-gray-500">Capacity</span><span>{feature.properties.metadata.capacity}</span></div>
                      <div className="flex justify-between"><span className="text-gray-500">Power</span><span>{feature.properties.metadata.power}</span></div>
                    </div>
                  )}

                  {feature.properties.description && !['complaint', 'sensor'].includes(feature.properties.feature_type) && (
                    <p className="text-xs text-gray-400 mt-2">{feature.properties.description}</p>
                  )}

                  <div className="mt-2 pt-2 border-t border-gray-100">
                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                      feature.properties.status === 'active' || feature.properties.status === 'normal' ? 'bg-green-100 text-green-700' :
                      feature.properties.status === 'warning' ? 'bg-amber-100 text-amber-700' :
                      feature.properties.status === 'maintenance' ? 'bg-blue-100 text-blue-700' :
                      'bg-red-100 text-red-700'
                    }`}>
                      {feature.properties.status?.toUpperCase()}
                    </span>
                  </div>
                </div>
              </Popup>
            </Marker>
          ))}
        </MapContainer>
      </div>

      <p className="text-xs text-gray-400 text-center">
        Map data: OpenStreetMap contributors · Water network data: Simulated demo data for Pune, India
      </p>
    </div>
  );
};

export default WaterMapPage;
