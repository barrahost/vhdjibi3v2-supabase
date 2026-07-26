import { useState } from 'react';
import { ComposedChart, Bar, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { CulteReport } from '../../../types/culteReport.types';

export interface ChartSeries {
  key: string;
  label: string;
  color: string;
  type: 'bar' | 'line';
  stackId?: string;
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
  legendPosition?: 'top' | 'bottom';
  showTabTitle?: boolean;
  /** 'day' (default) shows "22 juil." per report. 'month' shows "juillet 2026" — used when reports are pre-aggregated by month (Finance, matches old app). */
  dateFormat?: 'day' | 'month';
}

function buildPoints(reports: CulteReport[], series: ChartSeries[], dateFormat: 'day' | 'month'): Record<string, any>[] {
  const sorted = [...reports].sort((a, b) => a.serviceDate.localeCompare(b.serviceDate));
  return sorted.map((report) => {
    const date = new Date(report.serviceDate);
    const point: Record<string, any> = {
      date: dateFormat === 'month'
        ? date.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })
        : date.toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' }),
    };
    for (const s of series) {
      point[s.key] = s.extractValue(report) || 0;
    }
    return point;
  });
}

export function CulteBreakdownChart({ reports, breakdowns, legendPosition = 'bottom', showTabTitle = true, dateFormat = 'day' }: CulteBreakdownChartProps) {
  const [activeKey, setActiveKey] = useState(breakdowns[0]?.key);
  const active = breakdowns.find((b) => b.key === activeKey) || breakdowns[0];
  const points = active ? buildPoints(reports, active.series, dateFormat) : [];

  return (
    <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
      <div className="flex gap-1 mb-4 flex-wrap">
        {breakdowns.map((b) => (
          <button
            key={b.key}
            onClick={() => setActiveKey(b.key)}
            className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all ${
              b.key === activeKey ? 'bg-[#00665C] text-white shadow-md scale-105' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            {b.label}
          </button>
        ))}
      </div>

      {showTabTitle && <h3 className="text-base font-semibold text-gray-900 mb-3">{active?.label}</h3>}

      {points.length === 0 ? (
        <p className="text-sm text-gray-400 py-8 text-center">Aucune donnée sur cette période.</p>
      ) : (
        <ResponsiveContainer width="100%" height={300}>
          <ComposedChart data={points} margin={{ top: 5, right: 20, left: 0, bottom: 25 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis dataKey="date" tick={{ fontSize: 11 }} angle={-45} textAnchor="end" height={60} />
            <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
            <Tooltip
              contentStyle={{
                backgroundColor: 'white',
                border: '1px solid #e2e8f0',
                borderRadius: '6px',
                boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
              }}
            />
            <Legend verticalAlign={legendPosition} height={36} />
            {active?.series.map((s) =>
              s.type === 'bar' ? (
                <Bar key={s.key} dataKey={s.key} name={s.label} fill={s.color} stackId={s.stackId} radius={s.stackId ? undefined : [4, 4, 0, 0]} />
              ) : (
                <Line
                  key={s.key}
                  type="monotone"
                  dataKey={s.key}
                  name={s.label}
                  stroke={s.color}
                  strokeWidth={2}
                  dot={{ fill: s.color, r: 4 }}
                  activeDot={{ r: 6 }}
                />
              )
            )}
          </ComposedChart>
        </ResponsiveContainer>
      )}
    </div>
  );
}
