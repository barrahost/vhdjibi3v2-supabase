import { useState } from 'react';
import { ComposedChart, Bar, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { TrendingUp } from 'lucide-react';
import { CulteReport } from '../../../types/culteReport.types';

export interface ChartSeries {
  key: string;
  label: string;
  color: string;
  type: 'bar' | 'line';
  extractValue: (report: CulteReport) => number;
}

export interface ChartBreakdown {
  key: string;
  label: string;
  series: ChartSeries[];
}

interface CulteBreakdownChartProps {
  title?: string;
  reports: CulteReport[];
  breakdowns: ChartBreakdown[];
}

function getWeekNumber(date: Date): number {
  const startOfYear = new Date(date.getFullYear(), 0, 1);
  const dayOfYear = Math.floor((date.getTime() - startOfYear.getTime()) / (24 * 60 * 60 * 1000));
  return Math.ceil((dayOfYear + startOfYear.getDay() + 1) / 7);
}

function buildWeeklyPoints(reports: CulteReport[], series: ChartSeries[]): Record<string, any>[] {
  const byWeek = new Map<string, Record<string, any>>();
  for (const report of reports) {
    const date = new Date(report.serviceDate);
    const week = `S${getWeekNumber(date)} ${date.getFullYear()}`;
    const existing = byWeek.get(week) || { week };
    for (const s of series) {
      existing[s.key] = (existing[s.key] || 0) + (s.extractValue(report) || 0);
    }
    byWeek.set(week, existing);
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
  const points = active ? buildWeeklyPoints(reports, active.series) : [];

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
        <ResponsiveContainer width="100%" height={280}>
          <ComposedChart data={points} margin={{ top: 5, right: 30, left: 20, bottom: 20 }}>
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
              labelFormatter={(label) => `Semaine : ${label}`}
            />
            <Legend />
            {active?.series.map((s) =>
              s.type === 'bar' ? (
                <Bar key={s.key} dataKey={s.key} name={s.label} fill={s.color} radius={[3, 3, 0, 0]} />
              ) : (
                <Line
                  key={s.key}
                  type="monotone"
                  dataKey={s.key}
                  name={s.label}
                  stroke={s.color}
                  strokeWidth={3}
                  dot={{ fill: s.color, strokeWidth: 2, r: 4 }}
                  activeDot={{ r: 6, stroke: s.color, strokeWidth: 2, fill: 'white' }}
                />
              )
            )}
          </ComposedChart>
        </ResponsiveContainer>
      )}
    </div>
  );
}
