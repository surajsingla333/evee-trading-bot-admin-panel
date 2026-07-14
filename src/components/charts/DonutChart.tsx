import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from 'recharts'
import { useTheme } from '@/hooks/useTheme'

const COLORS = ['#2563EB', '#3B82F6', '#60A5FA', '#93C5FD', '#BFDBFE']

export function DonutChart({
  data,
  height = 220,
}: {
  data: { name: string; value: number }[]
  height?: number
}) {
  const { theme } = useTheme()

  return (
    <ResponsiveContainer width="100%" height={height}>
      <PieChart>
        <Pie
          data={data}
          dataKey="value"
          nameKey="name"
          innerRadius="62%"
          outerRadius="86%"
          paddingAngle={3}
          strokeWidth={0}
          animationDuration={700}
        >
          {data.map((_, i) => (
            <Cell key={i} fill={COLORS[i % COLORS.length]} />
          ))}
        </Pie>
        <Tooltip
          contentStyle={{
            background: theme === 'dark' ? '#0f172a' : '#fff',
            border: `1px solid ${theme === 'dark' ? '#1e293b' : '#e5e7eb'}`,
            borderRadius: 12,
            fontSize: 12,
          }}
          formatter={(value) => [`${Number(value ?? 0)}%`, 'Allocation']}
        />
      </PieChart>
    </ResponsiveContainer>
  )
}
