import { useState } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { TrendingUp } from 'lucide-react';
import { CulteReport } from '../../../types/culteReport.types';

export interface ChartBreakdown {
  key: string;
  label: string;
  extractValue: (report: CulteReport) => number;
}

interface CulteBreakdownChartProps {
  title?: string;
  reports: CulteReport[];
  breakdowns: ChartBreakdown[];
}

interface WeeklyPoint {
  week: string;
  value: number;
}

function getWeekNumber(date: Date): number {
  const startOfYear = new Date(date.getFullYear(), 0, 1);
  const dayOfYear = Math.floor((date.getTime() - startOfYear.getTime()) / (24 * 60 * 60 * 1000));
  return Math.ceil((dayOfYear + startOfYear.getDay() + 1) / 7);
}

function buildWeeklyPoints(reports: CulteReport[], extractValue: (r: CulteReport) => number): WeeklyPoint[] {
  const byWeek = new Map<string, WeeklyPoint>();
  for (const report of reports) {
    const date = new Date(report.serviceDate);
    const key = `S${getWeekNumber(date)} ${date.getFullYear()}`;
    const existing = byWeek.get(key) || { week: key, value: 0 };
    existing.value += extractValue(report) || 0;
    byWeek.set(key, existing);
  }
  return Array.from(byWeek.values()).sort((a, b) => {
    const [, wa, ya] = a.week.match(/S(\d+) (\d+)/) || [];
    const [, wb, yb] = b.week.match(/S(\d+) (\d+)/) || [];
    return Number(ya) - Number(yb) || Number(wa) - Number(wb);
  });
}

export function CulteBreakdownChart({ title = 'Évolution', reports, breakdowns }: CulteBreakdownChartProps) {
  const [activeKey, setActiveKey] = useState(breakdowns[0]?.key);
  const active = breakdowns.find((b) => b.key === activeKey) || breakdowns[0];
  const points = active ? buildWeeklyPoints(reports, active.extractValue) : [];

  return (
    <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
      <div className="flex gap-1 mb-4 flex-wrap">
        {breakdowns.map((b) => (
          <button
            key={b.key}
            onClick={() => setActiveKey(b.key)}
            className={`px-3 py-1.5 text-xs font-medium rounded-md ${
              b.key === activeKey ? 'bg-[#00665C] text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            {b.label}
          </button>
        ))}
      </div>

      <h3 className="text-base font-semibold text-gray-900 mb-3">{active?.label || title}</h3>

      <div className="flex items-center gap-2 mb-3 text-sm text-[#00665C] font-medium">
        <TrendingUp className="w-4 h-4" />
        <span>{active?.label}</span>
      </div>

      {points.length === 0 ? (
        <p className="text-sm text-gray-400 py-8 text-center">Aucune donnée sur cette période.</p>
      ) : (
        <ResponsiveContainer width="100%" height={240}>
          <LineChart data={points} margin={{ top: 5, right: 30, left: 20, bottom: 20 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis dataKey="week" tick={{ fontSize: 10 }} stroke="#666" angle={-45} textAnchor="end" height={60} />
            <YAxis tick={{ fontSize: 12 }} stroke="#666" />
            <Tooltip
              contentStyle={{
                backgroundColor: 'white',
                border: '1px solid #e2e8f0',
                borderRadius: '6px',
                boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
              }}
              formatter={(value) => [value as number, active?.label]}
              labelFormatter={(label) => `Semaine : ${label}`}
            />
            <Line
              type="monotone"
              dataKey="value"
              stroke="#00665C"
              strokeWidth={3}
              dot={{ fill: '#00665C', strokeWidth: 2, r: 4 }}
              activeDot={{ r: 6, stroke: '#00665C', strokeWidth: 2, fill: 'white' }}
            />
          </LineChart>
        </ResponsiveContainer>
      )}
    </div>
  );
}
