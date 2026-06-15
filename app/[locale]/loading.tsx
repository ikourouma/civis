import { GlobalLoadingIndicator } from '@/components/ui/GlobalLoadingIndicator';

// Next.js App Router automatically mounts this during route transitions under
// the [locale] segment — covers every page in the app via segment inheritance.
export default function Loading() {
  return <GlobalLoadingIndicator />;
}
