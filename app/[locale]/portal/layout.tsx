// Pass-through layout. The public registration flow (/portal/register/*) renders
// standalone, while authenticated portal pages wrap their own content in
// <WorkspaceShell> (Mission 005-B two-phase registration).
export default function PortalLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
