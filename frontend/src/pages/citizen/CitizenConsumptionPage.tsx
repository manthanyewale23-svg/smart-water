import React from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Droplet, Info, Award, Lightbulb } from 'lucide-react';
import { formatLiters } from '../../utils';

const sampleHouseholdData = [
  { day: 'Mon', usage: 145 },
  { day: 'Tue', usage: 160 },
  { day: 'Wed', usage: 138 },
  { day: 'Thu', usage: 152 },
  { day: 'Fri', usage: 170 },
  { day: 'Sat', usage: 195 },
  { day: 'Sun', usage: 180 },
];

const CitizenConsumptionPage: React.FC = () => {
  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">My Household Water Usage</h1>
        <p className="text-sm text-gray-500">Track your daily water allowance and smart conservation metrics</p>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="card bg-blue-50/60 border-blue-100">
          <p className="text-sm font-medium text-gray-500">Weekly Total Consumption</p>
          <p className="text-3xl font-bold text-blue-700 mt-1">1,140 <span className="text-base font-normal text-gray-500">Litres</span></p>
          <p className="text-xs text-green-600 mt-2 font-medium">↓ 6.4% lower than municipal average</p>
        </div>

        <div className="card bg-teal-50/60 border-teal-100">
          <p className="text-sm font-medium text-gray-500">Daily Average</p>
          <p className="text-3xl font-bold text-teal-700 mt-1">162 <span className="text-base font-normal text-gray-500">L/day</span></p>
          <p className="text-xs text-gray-400 mt-2">Recommended: 150-180 L/day</p>
        </div>

        <div className="card bg-purple-50/60 border-purple-100">
          <div className="flex items-center gap-2 mb-1">
            <Award size={18} className="text-purple-600" />
            <p className="text-sm font-medium text-gray-500">Conservation Grade</p>
          </div>
          <p className="text-3xl font-bold text-purple-700">Tier A</p>
          <p className="text-xs text-purple-600 mt-2 font-medium">Eco-friendly household</p>
        </div>
      </div>

      {/* Usage Chart */}
      <div className="card">
        <h3 className="font-semibold text-gray-900 mb-4">Daily Usage (Past 7 Days)</h3>
        <ResponsiveContainer width="100%" height={260}>
          <AreaChart data={sampleHouseholdData}>
            <defs>
              <linearGradient id="userUsageGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#0284c7" stopOpacity={0.4} />
                <stop offset="95%" stopColor="#0284c7" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis dataKey="day" />
            <YAxis tickFormatter={v => `${v} L`} />
            <Tooltip formatter={(v: any) => [`${v} Litres`, 'Usage']} />
            <Area type="monotone" dataKey="usage" stroke="#0284c7" fill="url(#userUsageGrad)" strokeWidth={3} />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* Tips */}
      <div className="card bg-amber-50/50 border-amber-200">
        <div className="flex items-center gap-2 mb-3">
          <Lightbulb size={20} className="text-amber-600" />
          <h3 className="font-semibold text-amber-900">Water Conservation & Leak Prevention Tips</h3>
        </div>
        <ul className="space-y-2 text-sm text-gray-700 list-disc list-inside">
          <li>Check for toilet flapper valve silent leaks by placing food coloring into your tank.</li>
          <li>Turn off taps while brushing or shaving to save up to 15 Litres each time.</li>
          <li>Promptly report pipeline dampness or road pooling in the SmartWater app to save municipal water.</li>
        </ul>
      </div>
    </div>
  );
};

export default CitizenConsumptionPage;
