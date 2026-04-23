import React from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const data: Record<string, any[]> = {
  'Concepción': [],
  'San Pedro': [],
  'Talcahuano': [],
  'Santiago': []
};

export const MarketTrends: React.FC = () => {
  const [selected, setSelected] = React.useState<string>('Concepción');

  return (
    <div className="bg-white p-4 md:p-6 rounded-lg shadow-sm border border-gray-100 h-[350px] md:h-[400px]">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <h2 className="text-lg md:text-xl font-medium text-slate-800">Tendencias (UF/m²)</h2>
        <div className="flex flex-wrap gap-2">
          {Object.keys(data).map(r => (
            <button
              key={r}
              onClick={() => setSelected(r)}
              className={`px-3 py-1 rounded-md text-[10px] font-semibold transition-colors ${
                selected === r 
                  ? 'bg-blue-600 text-white' 
                  : 'bg-gray-100 text-slate-500 hover:bg-gray-200'
              }`}
            >
              {r}
            </button>
          ))}
        </div>
      </div>
      <ResponsiveContainer width="100%" height="80%">
        <LineChart data={data[selected]}>
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
          <XAxis 
            dataKey="month" 
            axisLine={false} 
            tickLine={false} 
            tick={{ fill: '#9ca3af', fontSize: 12 }}
          />
          <YAxis 
            axisLine={false} 
            tickLine={false} 
            tick={{ fill: '#9ca3af', fontSize: 12 }}
            domain={['dataMin - 100', 'dataMax + 100']}
          />
          <Tooltip 
            contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
          />
          <Line 
            type="monotone" 
            dataKey="price" 
            stroke="#0A4F41" 
            strokeWidth={3} 
            dot={{ r: 4, fill: '#0A4F41', strokeWidth: 2, stroke: '#fff' }}
            activeDot={{ r: 6 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
};
