import { useMemo } from 'react';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid,
  ReferenceLine, Tooltip, ResponsiveContainer, Legend,
} from 'recharts';

const COLORS = [
  '#3b82f6', '#f59e0b', '#10b981', '#ef4444',
  '#8b5cf6', '#ec4899', '#06b6d4', '#f97316',
];

const GOAL_LINE = 16;

export default function DryingChart({ readings }) {
  const { chartData, locations } = useMemo(() => {
    // Only moisture-type readings
    const moistureReadings = readings.filter((r) => r.reading_type === 'moisture');
    if (moistureReadings.length === 0) return { chartData: [], locations: [] };

    // Collect unique locations and dates
    const locationSet = new Set();
    const dateMap = {};

    for (const r of moistureReadings) {
      const loc = `${r.room_name || 'Room'} — ${r.location_label}`;
      locationSet.add(loc);

      if (!dateMap[r.reading_date]) {
        dateMap[r.reading_date] = {};
      }
      // Keep latest reading per location per date
      dateMap[r.reading_date][loc] = r.reading_value;
    }

    const locations = [...locationSet];
    const sortedDates = Object.keys(dateMap).sort();

    const chartData = sortedDates.map((date) => {
      const entry = {
        date: new Date(date + 'T12:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      };
      for (const loc of locations) {
        if (dateMap[date][loc] !== undefined) {
          entry[loc] = dateMap[date][loc];
        }
      }
      return entry;
    });

    return { chartData, locations };
  }, [readings]);

  if (chartData.length < 2) {
    return (
      <div className="text-center py-8">
        <p className="text-slate-600 text-sm">
          {chartData.length === 0
            ? 'No moisture readings to chart'
            : 'Need at least 2 days of data to show trend'}
        </p>
      </div>
    );
  }

  return (
    <div className="bg-slate-800/40 rounded-lg border border-slate-700/50 p-3">
      <h4 className="text-sm font-medium text-slate-300 mb-3">Drying Progress</h4>
      <ResponsiveContainer width="100%" height={220}>
        <LineChart data={chartData} margin={{ top: 5, right: 5, bottom: 5, left: -10 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
          <XAxis
            dataKey="date"
            tick={{ fill: '#64748b', fontSize: 11 }}
            axisLine={{ stroke: '#334155' }}
            tickLine={false}
          />
          <YAxis
            tick={{ fill: '#64748b', fontSize: 11 }}
            axisLine={{ stroke: '#334155' }}
            tickLine={false}
            domain={[0, 'auto']}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: '#1e293b',
              border: '1px solid #334155',
              borderRadius: 8,
              fontSize: 12,
            }}
            labelStyle={{ color: '#94a3b8' }}
          />
          <ReferenceLine
            y={GOAL_LINE}
            stroke="#22c55e"
            strokeDasharray="6 3"
            label={{ value: 'Goal 16%', fill: '#22c55e', fontSize: 10, position: 'right' }}
          />
          {locations.map((loc, i) => (
            <Line
              key={loc}
              type="monotone"
              dataKey={loc}
              stroke={COLORS[i % COLORS.length]}
              strokeWidth={2}
              dot={{ r: 3, fill: COLORS[i % COLORS.length] }}
              connectNulls
            />
          ))}
          {locations.length > 1 && (
            <Legend
              wrapperStyle={{ fontSize: 10, color: '#94a3b8' }}
              iconSize={8}
            />
          )}
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
