import { useState, useEffect } from 'react';
import ChatPanel from '../components/ChatPanel';
import { DashboardLayout } from '../layouts/DashboardLayout';

export default function Dashboard() {
  return (
    <DashboardLayout> 
      <div className="relative flex h-screen w-full flex-row overflow-hidden justify-center">
        {/* RAG Chat Panel - 500px desktop, 95% mobile */}
        <div className="flex h-full w-[95%] md:w-[500px]">
          <ChatPanel />
        </div>
      </div>
    </DashboardLayout>
  );
}
