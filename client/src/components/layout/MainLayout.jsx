import Header from './Header';
import Sidebar from './Sidebar';

export default function MainLayout({ children }) {
  return (
    <div className="min-h-screen bg-gray-100 flex flex-col">
      <Header />
      <div className="flex flex-1 overflow-hidden">
        <Sidebar />
        <main className="flex-1 overflow-y-auto p-6">
          {children}
        </main>
      </div>
    </div>
  );
}
