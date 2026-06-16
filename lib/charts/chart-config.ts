// Civis intelligence chart palette — institutional, not consumer.
// See Mission 006 design language (deep-navy terminal aesthetic).
export const CHART_COLORS = {
  primary: '#C9A84C', // Gold — primary data
  secondary: '#2A3F62', // Navy — secondary data
  accent1: '#4A90D9', // Intelligence blue
  accent2: '#22C55E', // Growth green
  accent3: '#F59E0B', // Warning amber
  accent4: '#EF4444', // Alert red
  accent5: '#8B5CF6', // Analysis purple
  neutral: '#6B7280', // Inactive gray
};

// Ordered palette for multi-series / pie slices.
export const CHART_SERIES = [
  CHART_COLORS.primary,
  CHART_COLORS.accent1,
  CHART_COLORS.accent2,
  CHART_COLORS.accent5,
  CHART_COLORS.accent3,
  CHART_COLORS.accent4,
  CHART_COLORS.neutral,
  CHART_COLORS.secondary,
];

export const CHART_THEME = {
  background: 'transparent',
  gridColor: 'rgba(255,255,255,0.06)',
  textColor: 'rgba(255,255,255,0.6)',
  tooltipBackground: '#1A2C42',
  tooltipBorder: '#C9A84C',
};

export const INTEL_BG = '#0A1628';
