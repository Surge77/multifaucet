'use client';

import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from 'recharts';

import type { AllocationSlice } from '@/lib/allocation';
import { formatUsd } from '@/lib/format';

// Print-inspired ink palette — readable on both paper and night themes.
const COLORS = ['#bf3f1c', '#175e54', '#8f6a10', '#3d5a80', '#7a4e7e', '#5b7553'];

export function AllocationChart({ data }: { data: AllocationSlice[] }) {
  if (data.length === 0) return null;

  return (
    <div className="h-56 w-full" role="img" aria-label="Asset allocation by USD value">
      <ResponsiveContainer>
        <PieChart>
          <Pie
            data={data}
            dataKey="value"
            nameKey="name"
            innerRadius={55}
            outerRadius={85}
            paddingAngle={3}
            stroke="var(--surface)"
          >
            {data.map((slice, i) => (
              <Cell key={slice.name} fill={COLORS[i % COLORS.length]} />
            ))}
          </Pie>
          <Tooltip
            formatter={(value) => formatUsd(Number(value))}
            contentStyle={{
              background: 'var(--surface)',
              border: '1px solid var(--line-strong)',
              borderRadius: 0,
              fontFamily: 'var(--font-plex-mono)',
              fontSize: 12,
              color: 'var(--ink)',
            }}
            itemStyle={{ color: 'var(--ink)' }}
          />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}

export default AllocationChart;
