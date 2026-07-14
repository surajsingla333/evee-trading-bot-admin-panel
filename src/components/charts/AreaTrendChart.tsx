import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { useTheme } from '@/hooks/useTheme'
import type { ChartPoint } from '@/types'
import { formatCompact, formatCurrency } from '@/lib/format'

export function AreaTrendChart({
  data,
  color = '#2563EB',
  format = 'number',
  height = 240,
}: {
  data: ChartPoint[]
  color?: string
  format?: 'number' | 'currency'
  height?: number
}) {
  const { theme } = useTheme()
  const grid = theme === 'dark' ? '#1e293b' : '#f1f5f9'
  const tick = theme === 'dark' ? '#64748b' : '#94a3b8'
  const id = `gradient-${color.replace('#', '')}`

  return (
    <ResponsiveContainer width="100%" height={height}>
      <AreaChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
        <defs>
          <linearGradient id={id} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity={0.22} />
            <stop offset="100%" stopColor={color} stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid stroke={grid} strokeDasharray="3 3" vertical={false} />
        <XAxis
          dataKey="date"
          axisLine={false}
          tickLine={false}
          tick={{ fill: tick, fontSize: 11 }}
          interval="preserveStartEnd"
          minTickGap={40}
        />
        <YAxis
          axisLine={false}
          tickLine={false}
          tick={{ fill: tick, fontSize: 11 }}
          tickFormatter={(v: number) => (format === 'currency' ? formatCurrency(v) : formatCompact(v))}
          width={56}
        />
        <Tooltip
          contentStyle={{
            background: theme === 'dark' ? '#0f172a' : '#fff',
            border: `1px solid ${theme === 'dark' ? '#1e293b' : '#e5e7eb'}`,
            borderRadius: 12,
            boxShadow: '0 8px 24px rgba(15,23,42,0.08)',
            fontSize: 12,
          }}
          labelStyle={{ color: tick, marginBottom: 4 }}
          formatter={(value) => [
            format === 'currency'
              ? formatCurrency(Number(value ?? 0))
              : formatCompact(Number(value ?? 0)),
            'Value',
          ]}
        />
        <Area
          type="monotone"
          dataKey="value"
          stroke={color}
          strokeWidth={2}
          fill={`url(#${id})`}
          animationDuration={800}
        />
      </AreaChart>
    </ResponsiveContainer>
  )
}
