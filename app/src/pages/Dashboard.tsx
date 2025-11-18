import { useState, useEffect } from 'react';
import ChatPanel from '../components/ChatPanel';
import { DashboardLayout } from '../layouts/DashboardLayout';

export default function Dashboard() {
  return (
    <DashboardLayout> 
      <div className="relative flex h-screen w-full flex-row overflow-hidden justify-center">
        {/* RAG Chat Panel - Centered with max width */}
        <div className="flex h-full w-full max-w-4xl">
          <ChatPanel />
        </div>
      </div>
    </DashboardLayout>
  );
}
