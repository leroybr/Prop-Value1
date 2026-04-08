import React from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const data: Record<string, any[]> = {
  'Concepción': [
    { month: 'Oct', price: 62 },
    { month: 'Nov', price: 63.5 },
    { month: 'Dic', price: 63 },
    { month: 'Ene', price: 64.5 },
    { month: 'Feb', price: 66 },
    { month: 'Mar', price: 65.5 },
  ],
  'San Pedro': [
    { month: 'Oct', price: 54 },
    { month: 'Nov', price: 55.5 },
    { month: 'Dic', price: 55 },
    { month: 'Ene', price: 56.5 },
    { month: 'Feb', price: 58 },
    { month: 'Mar', price: 57.5 },
  ],
  'Talcahuano': [
    { month: 'Oct', price: 44 },
    { month: 'Nov', price: 45.5 },
    { month: 'Dic', price: 45 },
    { month: 'Ene', price: 46.5 },
    { month: 'Feb', price: 48 },
    { month: 'Mar', price: 47.5 },
  ],
  'Metropolitana': [
    { month: 'Oct', price: 82 },
    { month: 'Nov', price: 83.5 },
    { month: 'Dic', price: 83 },
    { month: 'Ene', price: 84.5 },
    { month: 'Feb', price: 86 },
    { month: 'Mar', price: 85.5 },
  ]
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
