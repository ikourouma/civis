import { CivisLoader } from '@/components/ui/CivisLoader';

// Full-page loading state — used in route-level loading.tsx files.
export function PageLoader({ label }: { label?: string }) {
  return (
    <div className="flex min-h-[400px] flex-1 items-center justify-center">
      <CivisLoader size="lg" label={label} />
    </div>
  );
}
