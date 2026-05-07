import { Sidebar } from '@/components/Sidebar';
import { AdminHeader } from '@/components/AdminHeader';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <div className="flex flex-1 flex-col">
        <AdminHeader tenantName="Pizzaria Dev" />
        <main className="flex-1 overflow-y-auto bg-[var(--color-bg)] p-6">{children}</main>
      </div>
    </div>
  );
}
