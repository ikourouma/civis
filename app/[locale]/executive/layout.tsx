// Executive view is a standalone command screen — no workspace sidebar/chrome.
// Auth is enforced by middleware and by the page's own getCurrentUser guard.
export default function ExecutiveLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
