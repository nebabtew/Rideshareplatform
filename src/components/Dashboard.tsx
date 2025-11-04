import { useState } from 'react';
import { BrowseRides } from './BrowseRides';
import { PostRide } from './PostRide';
import { History } from './History';
import { Button } from './ui/button';
import { GraduationCap, Plus, List, History as HistoryIcon, LogOut } from 'lucide-react';

interface DashboardProps {
  user: any;
  onLogout: () => void;
}

export function Dashboard({ user, onLogout }: DashboardProps) {
  const [activeTab, setActiveTab] = useState<'browse' | 'post' | 'history'>('browse');

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <nav className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-3">
              <div className="bg-indigo-600 w-10 h-10 rounded-full flex items-center justify-center">
                <GraduationCap className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl">Campus Rideshare</h1>
                <p className="text-sm text-gray-500">Welcome, {user.name}</p>
              </div>
            </div>
            <Button variant="outline" onClick={onLogout}>
              <LogOut className="w-4 h-4 mr-2" />
              Logout
            </Button>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex gap-4 mb-6 flex-wrap">
          <Button
            variant={activeTab === 'browse' ? 'default' : 'outline'}
            onClick={() => setActiveTab('browse')}
          >
            <List className="w-4 h-4 mr-2" />
            Browse Rides
          </Button>
          <Button
            variant={activeTab === 'post' ? 'default' : 'outline'}
            onClick={() => setActiveTab('post')}
          >
            <Plus className="w-4 h-4 mr-2" />
            Request a Ride
          </Button>
          <Button
            variant={activeTab === 'history' ? 'default' : 'outline'}
            onClick={() => setActiveTab('history')}
          >
            <HistoryIcon className="w-4 h-4 mr-2" />
            History
          </Button>
        </div>

        {activeTab === 'browse' && <BrowseRides user={user} />}
        {activeTab === 'post' && <PostRide user={user} />}
        {activeTab === 'history' && <History user={user} />}
      </div>
    </div>
  );
}
