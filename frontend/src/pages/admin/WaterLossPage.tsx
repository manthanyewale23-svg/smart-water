import React, { useEffect, useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { AlertTriangle, Info } from 'lucide-react';
import { waterLossApi } from '../../api';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { formatLiters, getLossStatus, getLossColor, getLossBgColor, getLossBorderColor } from '../../utils';

const WaterLossPage: React.FC = () => {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState('7d');

  useEffect(() => {
    setLoading(true);
    waterLossApi.list({ period }).then(res => {
      setData(res.data.data || []);
    }).finally(() => setLoading(false));
  }, [period]);

  const barColors = data.map(z => z.loss_status === 'HIGH' ? '#ef4444' : z.loss_status === 'MEDIUM' ? '#f59e0b' : '#10b981');

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Water Loss Analysis</h1>
          <p className="text-sm text-gray-500">Rule-based calculation: Loss = Supplied − Consumed</p>
        </div>
        <select className="input py-2 w-auto" value={period} onChange={e => setPeriod(e.target.value)}>
          <option value="today">Today</option>
          <option value="7d">Last 7 Days</option>
          <option value="30d">Last 30 Days</option>
        </select>
      </div>

      {/* Legend */}
      <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 flex flex-wrap gap-4 text-sm">
        <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-green-500" /><span className="text-gray-700"><strong>LOW</strong> – Loss &lt; 10% (Acceptable)</span></div>
        <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-amber-500" /><span className="text-gray-700"><strong>MEDIUM</strong> – 10–20% (Needs monitoring)</span></div>
        <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-red-500" /><span className="text-gray-700"><strong>HIGH</strong> – &gt;20% (Immediate action required)</span></div>
      </div>

      {loading ? <LoadingSpinner className="py-12" text="Calculating water loss..." /> : (
        <>
          {/* Zone cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {data.map(zone => {
              const status = getLossStatus(zone.loss_percentage);
              return (
                <div key={zone.zone_id} className={`card border-l-4 ${getLossBorderColor(status)}`}>
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <h3 className="font-semibold text-gray-900">{zone.zone_name}</h3>
                      <p className="text-xs text-gray-400 mt-0.5">Zone ID: {zone.zone_id}</p>
                    </div>
                    <span className={`badge ${getLossBgColor(status)} ${getLossColor(status)} font-bold`}>{status}</span>
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm"><span className="text-gray-500">Supplied</span><span className="font-medium">{formatLiters(zone.total_supplied)}</span></div>
                    <div className="flex justify-between text-sm"><span className="text-gray-500">Consumed</span><span className="font-medium">{formatLiters(zone.total_consumed)}</span></div>
                    <div className="flex justify-between text-sm border-t border-gray-100 pt-2">
                      <span className="text-gray-700 font-medium">Loss</span>
                      <span className={`font-bold ${getLossColor(status)}`}>{formatLiters(zone.total_loss)}</span>
                    </div>
                  </div>
                  {/* Loss percentage bar */}
                  <div className="mt-3">
                    <div className="flex justify-between text-xs text-gray-500 mb-1">
                      <span>Loss percentage</span>
                      <span className={`font-bold ${getLossColor(status)}`}>{zone.loss_percentage}%</span>
                    </div>
                    <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all ${status === 'LOW' ? 'bg-green-500' : status === 'MEDIUM' ? 'bg-amber-500' : 'bg-red-500'}`}
                        style={{ width: `${Math.min(zone.loss_percentage, 100)}%` }}
                      />
                    </div>
                  </div>
                  {status === 'HIGH' && (
                    <div className="mt-3 flex items-center gap-2 text-xs text-red-600 bg-red-50 rounded-lg p-2">
                      <AlertTriangle size={12} />
                      Possible pipeline leakage. Inspection required.
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Bar chart */}
          <div className="card">
            <h3 className="font-semibold text-gray-900 mb-4">Zone-wise Loss Percentage</h3>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={data} layout="vertical" margin={{ left: 20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis type="number" domain={[0, 35]} tickFormatter={v => `${v}%`} tick={{ fontSize: 11 }} />
                <YAxis type="category" dataKey="zone_name" tick={{ fontSize: 11 }} width={160} tickFormatter={n => n?.split(' – ')?.[1] || n?.split(' - ')?.[1] || n} />
                <Tooltip formatter={(v: any) => [`${v}%`, 'Loss']} />
                <Bar dataKey="loss_percentage" name="Loss %" radius={[0, 4, 4, 0]}>
                  {data.map((_, i) => <Cell key={i} fill={barColors[i]} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </>
      )}
    </div>
  );
};

export default WaterLossPage;
