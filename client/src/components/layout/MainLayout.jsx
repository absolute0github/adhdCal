import { useState } from 'react';
import Header from './Header';
import Sidebar from './Sidebar';
import BottomNav from './BottomNav';

export default function MainLayout({ children }) {
  const [activeTab, setActiveTab] = useState('tasks');

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col">
      <Header />

      {/* Desktop layout */}
      <div className="hidden md:flex flex-1 overflow-hidden">
        <Sidebar />
        <main className="flex-1 overflow-y-auto p-6">
          {children}
        </main>
      </div>

      {/* Mobile layout */}
      <div className="md:hidden flex-1 overflow-hidden pb-16">
        {activeTab === 'tasks' ? (
          <main className="h-full overflow-y-auto p-4">
            {children}
          </main>
        ) : (
          <Sidebar isMobile />
        )}
      </div>

      {/* Mobile bottom navigation */}
      <BottomNav activeTab={activeTab} onTabChange={setActiveTab} />
    </div>
  );
}
