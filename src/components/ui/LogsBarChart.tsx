'use client';

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from 'recharts';
import { cn } from '@/lib/utils';

interface ChartDataPoint {
  timestamp: string;
  [key: string]: string | number;
}

interface LogsBarChartProps {
  data: ChartDataPoint[];
  dataKey: string;
  className?: string;
  isFullHeight?: boolean;
}

export function LogsBarChart({
  data,
  dataKey,
  className,
  isFullHeight = false,
}: LogsBarChartProps) {
  return (
    <div className={cn('w-full', isFullHeight ? 'h-full' : 'h-[200px]', className)}>
      <ResponsiveContainer width="99%" height="99%">
        <BarChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
          <XAxis
            dataKey="timestamp"
            tick={{ fill: 'var(--muted-foreground)', fontSize: 11 }}
            axisLine={false}
            tickLine={false}
            tickMargin={10}
          />
          <YAxis
            tick={{ fill: 'var(--muted-foreground)', fontSize: 11 }}
            axisLine={false}
            tickLine={false}
            tickMargin={10}
          />
          <Tooltip
            contentStyle={{
              background: 'var(--card)',
              borderColor: 'var(--border)',
              borderRadius: '8px',
              color: 'var(--foreground)',
              boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
              fontSize: '12px',
              padding: '8px 12px',
            }}
            itemStyle={{ color: 'var(--foreground)', fontWeight: 600 }}
            cursor={{ fill: 'var(--muted)', opacity: 0.3 }}
          />
          <Bar dataKey={dataKey} radius={[4, 4, 0, 0]} animationDuration={1500}>
            {data.map((entry, index) => (
              <Cell
                key={`cell-${index}`}
                fill={index === data.length - 1 ? 'var(--primary)' : 'var(--muted-foreground)'}
                opacity={index === data.length - 1 ? 1 : 0.4}
              />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

export default LogsBarChart;