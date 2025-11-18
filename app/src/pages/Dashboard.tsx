import { useState, useEffect } from 'react';
import ChatPanel from '../components/ChatPanel';
import { DashboardLayout } from '../layouts/DashboardLayout';

export default function Dashboard() {
  return (
    <DashboardLayout> 
      <div className="relative flex h-screen w-full flex-row overflow-hidden">
        {/* RAG Chat Panel - Full width */}
        <div className="flex h-full w-full">
          <ChatPanel />
        </div>
      </div>
    </DashboardLayout>
  );
}
