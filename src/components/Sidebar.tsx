import Link from 'next/link';
import { getAllPosts, getPublishedPosts, groupPostsBySeries } from '@/lib/posts';
import { mergeMiscGroups } from '@/lib/sidebarGroups';
import { SidebarNav } from './SidebarNav';

// Server component: reads published posts/series from the filesystem at
// build time (static export) and renders the persistent left nav shown on
// every page. Active-link highlighting is delegated to `SidebarNav`, the
// one small client piece that needs the current pathname.
export function Sidebar() {
  const posts = getPublishedPosts(getAllPosts());
  const groups = mergeMiscGroups(groupPostsBySeries(posts));

  return (
    <div>
      <Link href="/" className="block text-h3 mb-s-6 hover:text-blue-600 transition-colors">
        기술 블로그
      </Link>
      <SidebarNav groups={groups} />
    </div>
  );
}
