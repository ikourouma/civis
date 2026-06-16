'use client';

import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  Cell,
  Legend,
  Line,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';

import { CHART_COLORS, CHART_SERIES, CHART_THEME } from '@/lib/charts/chart-config';

const tooltipStyle = {
  backgroundColor: CHART_THEME.tooltipBackground,
  border: `1px solid ${CHART_THEME.tooltipBorder}`,
  borderRadius: 6,
  fontSize: 12,
  color: '#fff',
};
const axisProps = {
  stroke: CHART_THEME.textColor,
  tick: { fill: CHART_THEME.textColor, fontSize: 11 },
} as const;

// Registration trend — area (monthly count) + cumulative line.
export function TrendAreaChart({ data }: { data: { date: string; count: number; cumulativeCount: number }[] }) {
  return (
    <ResponsiveContainer width="100%" height={260}>
      <AreaChart data={data} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
        <defs>
          <linearGradient id="goldFill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={CHART_COLORS.primary} stopOpacity={0.4} />
            <stop offset="100%" stopColor={CHART_COLORS.primary} stopOpacity={0} />
          </linearGradient>
        </defs>
        <XAxis dataKey="date" {...axisProps} />
        <YAxis {...axisProps} />
        <Tooltip contentStyle={tooltipStyle} cursor={{ stroke: CHART_THEME.gridColor }} />
        <Area type="monotone" dataKey="count" stroke={CHART_COLORS.primary} strokeWidth={2} fill="url(#goldFill)" name="New" />
        <Line type="monotone" dataKey="cumulativeCount" stroke={CHART_COLORS.accent1} strokeWidth={1.5} dot={false} name="Cumulative" />
      </AreaChart>
    </ResponsiveContainer>
  );
}

export function DonutChart({ data, height = 220 }: { data: { label: string; count: number }[]; height?: number }) {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <PieChart>
        <Pie data={data} dataKey="count" nameKey="label" cx="50%" cy="50%" innerRadius="55%" outerRadius="80%" paddingAngle={2} stroke="none">
          {data.map((_, i) => (
            <Cell key={i} fill={CHART_SERIES[i % CHART_SERIES.length]} />
          ))}
        </Pie>
        <Tooltip contentStyle={tooltipStyle} />
        <Legend wrapperStyle={{ fontSize: 11, color: CHART_THEME.textColor }} iconType="circle" />
      </PieChart>
    </ResponsiveContainer>
  );
}

export function HorizontalBarChart({
  data,
  height = 320,
  color = CHART_COLORS.primary,
}: {
  data: { label: string; count: number }[];
  height?: number;
  color?: string;
}) {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <BarChart data={data} layout="vertical" margin={{ top: 0, right: 16, left: 10, bottom: 0 }}>
        <XAxis type="number" {...axisProps} />
        <YAxis type="category" dataKey="label" width={130} {...axisProps} />
        <Tooltip contentStyle={tooltipStyle} cursor={{ fill: 'rgba(255,255,255,0.03)' }} />
        <Bar dataKey="count" fill={color} radius={[0, 3, 3, 0]} barSize={14} />
      </BarChart>
    </ResponsiveContainer>
  );
}

export function VerticalBarChart({
  data,
  height = 260,
  color = CHART_COLORS.accent1,
}: {
  data: { label: string; count: number }[];
  height?: number;
  color?: string;
}) {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <BarChart data={data} margin={{ top: 10, right: 10, left: -10, bottom: 40 }}>
        <XAxis dataKey="label" {...axisProps} angle={-35} textAnchor="end" interval={0} height={60} />
        <YAxis {...axisProps} />
        <Tooltip contentStyle={tooltipStyle} cursor={{ fill: 'rgba(255,255,255,0.03)' }} />
        <Bar dataKey="count" fill={color} radius={[3, 3, 0, 0]} barSize={22} />
      </BarChart>
    </ResponsiveContainer>
  );
}

// Mini sparkline for executive momentum card.
export function Sparkline({ data, height = 48 }: { data: { date: string; count: number }[]; height?: number }) {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <AreaChart data={data} margin={{ top: 4, right: 0, left: 0, bottom: 0 }}>
        <defs>
          <linearGradient id="sparkFill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={CHART_COLORS.primary} stopOpacity={0.5} />
            <stop offset="100%" stopColor={CHART_COLORS.primary} stopOpacity={0} />
          </linearGradient>
        </defs>
        <Area type="monotone" dataKey="count" stroke={CHART_COLORS.primary} strokeWidth={1.5} fill="url(#sparkFill)" />
      </AreaChart>
    </ResponsiveContainer>
  );
}
