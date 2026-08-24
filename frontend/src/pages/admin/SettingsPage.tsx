import React, { useState } from 'react';
import { Settings, Bell, Sliders, MapPin, Database, Save, Check } from 'lucide-react';

const SettingsPage: React.FC = () => {
  const [saved, setSaved] = useState(false);
  const [settings, setSettings] = useState({
    lowThreshold: '10',
    highThreshold: '20',
    pressureMin: '1.5',
    tankMax: '95',
    alertEmails: true,
    alertSms: false,
    autoAssign: true,
    cityName: 'Pune Municipal Corporation',
    defaultCenterLat: '18.5204',
    defaultCenterLng: '73.8567',
  });

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">System Settings & Thresholds</h1>
        <p className="text-sm text-gray-500">Configure water audit rules, sensor telemetry thresholds, and notifications</p>
      </div>

      {saved && (
        <div className="p-4 bg-green-50 border border-green-200 text-green-800 rounded-xl flex items-center gap-2 text-sm">
          <Check size={18} className="text-green-600" />
          Settings successfully updated.
        </div>
      )}

      <form onSubmit={handleSave} className="space-y-6">
        {/* Water Loss Thresholds */}
        <div className="card">
          <div className="flex items-center gap-2 mb-4 pb-2 border-b border-gray-100">
            <Sliders size={20} className="text-blue-600" />
            <h3 className="font-semibold text-gray-900">Water Loss & Anomaly Thresholds</h3>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="label">Medium Loss Trigger (% of Supply)</label>
              <input
                type="number"
                className="input"
                value={settings.lowThreshold}
                onChange={e => setSettings({ ...settings, lowThreshold: e.target.value })}
              />
              <p className="text-xs text-gray-400 mt-1">Losses exceeding this amount show as Warning/Medium</p>
            </div>
            <div>
              <label className="label">High Loss Alert Trigger (% of Supply)</label>
              <input
                type="number"
                className="input"
                value={settings.highThreshold}
                onChange={e => setSettings({ ...settings, highThreshold: e.target.value })}
              />
              <p className="text-xs text-gray-400 mt-1">Losses exceeding this trigger Critical system alerts</p>
            </div>
            <div>
              <label className="label">Minimum Pipeline Pressure (bar)</label>
              <input
                type="number"
                step="0.1"
                className="input"
                value={settings.pressureMin}
                onChange={e => setSettings({ ...settings, pressureMin: e.target.value })}
              />
              <p className="text-xs text-gray-400 mt-1">Sensors below this value trigger low pressure alerts</p>
            </div>
            <div>
              <label className="label">Max Tank Overflow Level (%)</label>
              <input
                type="number"
                className="input"
                value={settings.tankMax}
                onChange={e => setSettings({ ...settings, tankMax: e.target.value })}
              />
              <p className="text-xs text-gray-400 mt-1">Sensors above this value trigger overflow risk</p>
            </div>
          </div>
        </div>

        {/* GIS & Municipality Settings */}
        <div className="card">
          <div className="flex items-center gap-2 mb-4 pb-2 border-b border-gray-100">
            <MapPin size={20} className="text-blue-600" />
            <h3 className="font-semibold text-gray-900">GIS & Municipality Parameters</h3>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="sm:col-span-3">
              <label className="label">Municipality / Agency Name</label>
              <input
                type="text"
                className="input"
                value={settings.cityName}
                onChange={e => setSettings({ ...settings, cityName: e.target.value })}
              />
            </div>
            <div>
              <label className="label">Map Default Latitude</label>
              <input
                type="text"
                className="input"
                value={settings.defaultCenterLat}
                onChange={e => setSettings({ ...settings, defaultCenterLat: e.target.value })}
              />
            </div>
            <div>
              <label className="label">Map Default Longitude</label>
              <input
                type="text"
                className="input"
                value={settings.defaultCenterLng}
                onChange={e => setSettings({ ...settings, defaultCenterLng: e.target.value })}
              />
            </div>
          </div>
        </div>

        {/* Notifications & Dispatch */}
        <div className="card">
          <div className="flex items-center gap-2 mb-4 pb-2 border-b border-gray-100">
            <Bell size={20} className="text-blue-600" />
            <h3 className="font-semibold text-gray-900">Notification & Task Dispatch</h3>
          </div>
          <div className="space-y-3">
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={settings.alertEmails}
                onChange={e => setSettings({ ...settings, alertEmails: e.target.checked })}
                className="rounded"
              />
              <span className="text-sm text-gray-700">Send instant dashboard notifications to admins on Critical Alerts</span>
            </label>
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={settings.autoAssign}
                onChange={e => setSettings({ ...settings, autoAssign: e.target.checked })}
                className="rounded"
              />
              <span className="text-sm text-gray-700">Notify assigned field workers automatically upon task creation</span>
            </label>
          </div>
        </div>

        <button type="submit" className="btn-primary flex items-center gap-2 py-2.5 px-6">
          <Save size={18} /> Save Settings
        </button>
      </form>
    </div>
  );
};

export default SettingsPage;
