import React, { useEffect, useState, useCallback } from 'react';
import { Activity, Wifi, WifiOff, AlertTriangle, RefreshCw, Thermometer, Gauge, Droplet, Clock } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { sensorsApi } from '../../api';
import { Sensor, SensorReading } from '../../types';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { Modal } from '../../components/common/Modal';
import { StatusBadge } from '../../components/common/Badges';
import { formatRelativeTime, getStatusColor } from '../../utils';
import { useDemo } from '../../context/DemoContext';

const TYPE_ICONS: Record<string, React.ReactNode> = {
  flow: <Activity size={20} className="text-blue-500" />,
  pressure: <Gauge size={20} className="text-purple-500" />,
  tank_level: <Droplet size={20} className="text-teal-500" />,
  water_meter: <Thermometer size={20} className="text-green-500" />,
};

const TYPE_LABELS: Record<string, string> = {
  flow: 'Flow Sensor', pressure: 'Pressure Sensor', tank_level: 'Tank Level', water_meter: 'Water Meter',
};

const SensorsPage: React.FC = () => {
  const [sensors, setSensors] = useState<Sensor[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterZone, setFilterZone] = useState('');
  const [filterType, setFilterType] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [selectedSensor, setSelectedSensor] = useState<Sensor | null>(null);
  const [readings, setReadings] = useState<SensorReading[]>([]);
  const [readingsLoading, setReadingsLoading] = useState(false);
  const { isRunning, updatedSensors } = useDemo();

  const fetchSensors = useCallback(async () => {
    try {
      const res = await sensorsApi.list();
      setSensors(res.data.sensors || []);
    } catch { }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchSensors(); }, [fetchSensors]);

  // Update sensors from demo mode
  useEffect(() => {
    if (isRunning && updatedSensors.length > 0) {
      setSensors(prev => prev.map(s => {
        const updated = updatedSensors.find(u => u.id === s.id);
        return updated ? { ...s, last_reading: updated.last_reading, status: updated.status, last_updated: updated.last_updated || new Date().toISOString() } : s;
      }));
    }
  }, [updatedSensors, isRunning]);

  const openSensorModal = async (sensor: Sensor) => {
    setSelectedSensor(sensor);
    setReadingsLoading(true);
    try {
      const res = await sensorsApi.readings(sensor.id);
      setReadings(res.data.readings || []);
    } catch { }
    finally { setReadingsLoading(false); }
  };

  const zones = [...new Set(sensors.map(s => s.zone_name).filter(Boolean))];
  const types = [...new Set(sensors.map(s => s.sensor_type))];

  const filtered = sensors.filter(s => {
    if (filterZone && s.zone_name !== filterZone) return false;
    if (filterType && s.sensor_type !== filterType) return false;
    if (filterStatus && s.status !== filterStatus) return false;
    return true;
  });

  const getReadingKey = (s: Sensor) => {
    if (s.sensor_type === 'flow') return 'flow';
    if (s.sensor_type === 'pressure') return 'pressure';
    if (s.sensor_type === 'tank_level') return 'tank_level';
    return 'consumption';
  };

  const chartData = readings.slice(-48).map(r => ({
    time: new Date(r.recorded_at).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }),
    value: r[getReadingKey(selectedSensor!) as keyof SensorReading] as number || 0,
  }));

  if (loading) return <LoadingSpinner className="py-12" text="Loading sensors..." />;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Sensor Monitoring</h1>
          <p className="text-sm text-gray-500">{sensors.length} sensors across all zones</p>
        </div>
        <button onClick={fetchSensors} className="btn-secondary flex items-center gap-2 py-2">
          <RefreshCw size={16} /> Refresh
        </button>
      </div>

      {/* Demo data banner */}
      <div className="bg-amber-50 border border-amber-300 rounded-xl p-3 flex items-center gap-3">
        <AlertTriangle size={18} className="text-amber-600 flex-shrink-0" />
        <div className="text-sm">
          <span className="font-semibold text-amber-800">⚠️ DEMO / SIMULATED DATA</span>
          <span className="text-amber-700 ml-2">– These readings are not from physical sensors. For demonstration purposes only.</span>
        </div>
        {isRunning && <span className="ml-auto text-xs bg-amber-200 text-amber-800 px-2 py-1 rounded-full font-medium animate-pulse">LIVE DEMO</span>}
      </div>

      {/* Filters */}
      <div className="card py-4">
        <div className="flex flex-wrap gap-3">
          <select className="input py-2 w-auto" value={filterZone} onChange={e => setFilterZone(e.target.value)}>
            <option value="">All Zones</option>
            {zones.map(z => <option key={z} value={z!}>{z}</option>)}
          </select>
          <select className="input py-2 w-auto" value={filterType} onChange={e => setFilterType(e.target.value)}>
            <option value="">All Types</option>
            {types.map(t => <option key={t} value={t}>{TYPE_LABELS[t] || t}</option>)}
          </select>
          <select className="input py-2 w-auto" value={filterStatus} onChange={e => setFilterStatus(e.target.value)}>
            <option value="">All Status</option>
            <option value="normal">Normal</option>
            <option value="warning">Warning</option>
            <option value="critical">Critical</option>
            <option value="offline">Offline</option>
          </select>
        </div>
      </div>

      {/* Status summary */}
      <div className="grid grid-cols-4 gap-3">
        {[
          { label: 'Normal', count: sensors.filter(s => s.status === 'normal').length, color: 'bg-green-100 text-green-700' },
          { label: 'Warning', count: sensors.filter(s => s.status === 'warning').length, color: 'bg-amber-100 text-amber-700' },
          { label: 'Critical', count: sensors.filter(s => s.status === 'critical').length, color: 'bg-red-100 text-red-700' },
          { label: 'Offline', count: sensors.filter(s => s.status === 'offline').length, color: 'bg-gray-100 text-gray-500' },
        ].map(item => (
          <div key={item.label} className="card py-3 text-center">
            <div className={`text-2xl font-bold ${item.color.split(' ')[1]}`}>{item.count}</div>
            <div className="text-xs text-gray-500 mt-1">{item.label}</div>
          </div>
        ))}
      </div>

      {/* Sensor grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {filtered.map(sensor => (
          <div
            key={sensor.id}
            onClick={() => openSensorModal(sensor)}
            className={`card cursor-pointer hover:shadow-md transition-all border-l-4 ${
              sensor.status === 'normal' ? 'border-green-400' :
              sensor.status === 'warning' ? 'border-amber-400' :
              sensor.status === 'critical' ? 'border-red-400' : 'border-gray-300'
            }`}
          >
            <div className="flex items-start justify-between mb-3">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  {TYPE_ICONS[sensor.sensor_type]}
                  <span className="font-mono text-sm font-bold text-gray-800">{sensor.sensor_id}</span>
                </div>
                <p className="text-xs text-gray-400">{TYPE_LABELS[sensor.sensor_type]}</p>
              </div>
              {sensor.status === 'offline' ? <WifiOff size={16} className="text-gray-400" /> : <Wifi size={16} className="text-green-500" />}
            </div>

            <div className="mb-3">
              <div className="text-3xl font-bold text-gray-900">
                {sensor.status === 'offline' ? '–' : sensor.last_reading?.toFixed(sensor.sensor_type === 'pressure' ? 1 : 0)}
                <span className="text-base font-medium text-gray-400 ml-1">{sensor.unit}</span>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <span className={`badge ${getStatusColor(sensor.status)}`}>{sensor.status?.toUpperCase()}</span>
              <div className="flex items-center gap-1 text-xs text-gray-400">
                <Clock size={11} />
                {sensor.last_updated ? formatRelativeTime(sensor.last_updated) : '–'}
              </div>
            </div>

            {sensor.zone_name && (
              <div className="mt-2 text-xs text-gray-400 border-t border-gray-50 pt-2 truncate">
                📍 {sensor.zone_name}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Sensor detail modal */}
      {selectedSensor && (
        <Modal isOpen={!!selectedSensor} onClose={() => setSelectedSensor(null)} title={`${TYPE_LABELS[selectedSensor.sensor_type]} – ${selectedSensor.sensor_id}`} size="lg">
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-gray-50 rounded-xl p-4">
                <p className="text-xs text-gray-500 mb-1">Current Reading</p>
                <p className="text-3xl font-bold text-gray-900">{selectedSensor.last_reading?.toFixed(1)} <span className="text-base text-gray-400">{selectedSensor.unit}</span></p>
              </div>
              <div className="bg-gray-50 rounded-xl p-4">
                <p className="text-xs text-gray-500 mb-1">Status</p>
                <StatusBadge status={selectedSensor.status} className="text-sm" />
                <p className="text-xs text-gray-400 mt-2">{selectedSensor.last_updated ? `Updated ${formatRelativeTime(selectedSensor.last_updated)}` : 'No recent update'}</p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div><span className="text-gray-500">Sensor ID:</span> <span className="font-medium">{selectedSensor.sensor_id}</span></div>
              <div><span className="text-gray-500">Type:</span> <span className="font-medium">{TYPE_LABELS[selectedSensor.sensor_type]}</span></div>
              <div><span className="text-gray-500">Zone:</span> <span className="font-medium">{selectedSensor.zone_name}</span></div>
              <div><span className="text-gray-500">Location:</span> <span className="font-medium">{selectedSensor.latitude?.toFixed(4)}, {selectedSensor.longitude?.toFixed(4)}</span></div>
            </div>
            <div>
              <h4 className="font-semibold text-gray-800 mb-3">Reading History (Last 7 Days)</h4>
              {readingsLoading ? <LoadingSpinner className="py-8" /> : (
                <ResponsiveContainer width="100%" height={200}>
                  <LineChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis dataKey="time" tick={{ fontSize: 10 }} />
                    <YAxis tick={{ fontSize: 10 }} />
                    <Tooltip formatter={(v: any) => [`${v} ${selectedSensor.unit}`, 'Reading']} />
                    <Line type="monotone" dataKey="value" stroke="#3b82f6" strokeWidth={2} dot={false} />
                  </LineChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};

export default SensorsPage;
