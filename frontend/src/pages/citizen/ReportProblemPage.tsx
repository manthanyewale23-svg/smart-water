import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Camera, MapPin, AlertCircle, CheckCircle } from 'lucide-react';
import { complaintsApi, zonesApi } from '../../api';
import { Zone } from '../../types';

const ReportProblemPage: React.FC = () => {
  const navigate = useNavigate();
  const [zones, setZones] = useState<Zone[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  const [problemType, setProblemType] = useState('pipeline_leakage');
  const [description, setDescription] = useState('');
  const [zoneId, setZoneId] = useState('');
  const [priority, setPriority] = useState('medium');
  const [latitude, setLatitude] = useState('');
  const [longitude, setLongitude] = useState('');
  const [photo, setPhoto] = useState<File | null>(null);

  useEffect(() => {
    zonesApi.list().then(res => setZones(res.data.zones || [])).catch(() => {});
  }, []);

  const handleGetLocation = () => {
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setLatitude(pos.coords.latitude.toFixed(5));
          setLongitude(pos.coords.longitude.toFixed(5));
        },
        () => {
          // Fallback to Pune coordinates
          setLatitude('18.5204');
          setLongitude('73.8567');
        }
      );
    } else {
      setLatitude('18.5204');
      setLongitude('73.8567');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');

    try {
      const formData = new FormData();
      formData.append('problem_type', problemType);
      formData.append('description', description);
      formData.append('priority', priority);
      if (zoneId) formData.append('zone_id', zoneId);
      if (latitude) formData.append('latitude', latitude);
      if (longitude) formData.append('longitude', longitude);
      if (photo) formData.append('photo', photo);

      await complaintsApi.create(formData);
      setSuccess(true);
      setTimeout(() => navigate('/citizen/complaints'), 2000);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to submit report. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Report Water Issue</h1>
        <p className="text-sm text-gray-500">
          Notify municipal engineers of burst pipes, contaminated supply, or valve leakages
        </p>
      </div>

      {success && (
        <div className="p-4 bg-green-50 border border-green-200 text-green-800 rounded-xl flex items-center gap-3 text-sm">
          <CheckCircle size={20} className="text-green-600 flex-shrink-0" />
          <div>
            <p className="font-semibold">Issue successfully submitted!</p>
            <p className="text-xs text-green-700">Redirecting to your complaints dashboard...</p>
          </div>
        </div>
      )}

      {error && (
        <div className="p-4 bg-red-50 border border-red-200 text-red-700 rounded-xl text-sm flex items-center gap-2">
          <AlertCircle size={18} />
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="card space-y-4">
        <div>
          <label className="label">Type of Problem *</label>
          <select
            className="input py-2"
            value={problemType}
            onChange={e => setProblemType(e.target.value)}
            required
          >
            <option value="pipeline_leakage">Pipeline Burst / Leakage</option>
            <option value="road_leakage">Road Surface Water Overflow</option>
            <option value="tank_overflow">Water Tank Overflowing</option>
            <option value="low_pressure">Low Water Supply Pressure</option>
            <option value="no_water">No Water Supply / Outage</option>
            <option value="broken_valve">Damaged Valve / Infrastructure</option>
            <option value="other">Other Water Issue</option>
          </select>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="label">Municipal Zone</label>
            <select
              className="input py-2"
              value={zoneId}
              onChange={e => setZoneId(e.target.value)}
            >
              <option value="">Select Zone...</option>
              {zones.map(z => <option key={z.id} value={z.id}>{z.name}</option>)}
            </select>
          </div>

          <div>
            <label className="label">Perceived Severity / Priority</label>
            <select
              className="input py-2"
              value={priority}
              onChange={e => setPriority(e.target.value)}
            >
              <option value="low">Low (Minor dripping)</option>
              <option value="medium">Medium (Steady leak / low flow)</option>
              <option value="high">High (Flooding / Outage)</option>
              <option value="critical">Critical (Major mainline rupture)</option>
            </select>
          </div>
        </div>

        <div>
          <label className="label">Detailed Description *</label>
          <textarea
            className="input"
            rows={4}
            required
            value={description}
            onChange={e => setDescription(e.target.value)}
            placeholder="Please specify landmark, building name, approximate volume of leak, and when it started..."
          />
        </div>

        {/* Location coordinates */}
        <div>
          <div className="flex items-center justify-between mb-1">
            <label className="label mb-0">GPS Coordinates</label>
            <button
              type="button"
              onClick={handleGetLocation}
              className="text-xs text-blue-600 hover:text-blue-700 font-medium flex items-center gap-1"
            >
              <MapPin size={14} /> Detect My Location
            </button>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <input
              className="input"
              placeholder="Latitude (e.g. 18.5308)"
              value={latitude}
              onChange={e => setLatitude(e.target.value)}
            />
            <input
              className="input"
              placeholder="Longitude (e.g. 73.8475)"
              value={longitude}
              onChange={e => setLongitude(e.target.value)}
            />
          </div>
        </div>

        {/* Photo Upload */}
        <div>
          <label className="label">Attach Photo Evidence (Optional)</label>
          <div className="border-2 border-dashed border-gray-200 rounded-xl p-4 text-center hover:border-blue-400 transition-colors">
            <Camera className="mx-auto text-gray-400 mb-1" size={24} />
            <input
              type="file"
              accept="image/*"
              className="text-xs text-gray-500 file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
              onChange={e => setPhoto(e.target.files?.[0] || null)}
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={submitting || !description}
          className="btn-primary w-full py-3 text-base flex items-center justify-center gap-2 mt-4"
        >
          {submitting ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
              Submitting Report...
            </>
          ) : (
            'Submit Issue to Municipality'
          )}
        </button>
      </form>
    </div>
  );
};

export default ReportProblemPage;
