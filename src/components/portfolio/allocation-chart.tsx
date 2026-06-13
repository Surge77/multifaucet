'use client';

import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from 'recharts';

import type { AllocationSlice } from '@/lib/allocation';
import { formatUsd } from '@/lib/format';

const COLORS = ['#7c3aed', '#2563eb', '#0891b2', '#059669', '#d97706', '#db2777'];

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
            paddingAngle={2}
          >
            {data.map((slice, i) => (
              <Cell key={slice.name} fill={COLORS[i % COLORS.length]} />
            ))}
          </Pie>
          <Tooltip formatter={(value) => formatUsd(Number(value))} />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}

export default AllocationChart;
