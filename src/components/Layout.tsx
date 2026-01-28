import { Outlet } from 'react-router-dom';
import { Sidebar } from './Sidebar';

export function Layout() {
  return (
    <div className="min-h-screen bg-surface">
      <Sidebar />
      <main className="pl-64">
        <div className="min-h-screen">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
