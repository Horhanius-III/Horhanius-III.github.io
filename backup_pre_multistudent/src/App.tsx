/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useEffect, useState } from 'react';
import { Header } from './components/shared/Header';
import { PublicSSLModal } from './components/shared/PublicSSLModal';
import { VolunteerPortal } from './components/volunteer/VolunteerPortal';
import { AdminPortal } from './components/admin/AdminPortal';
import { storageService } from './services/storage';

export default function App() {
  const [activeTab, setActiveTab] = useState<'volunteer' | 'admin'>('volunteer');
  const [viewingSSLToken, setViewingSSLToken] = useState<string | null>(null);
  const [pendingApprovalsCount, setPendingApprovalsCount] = useState(0);

  const updatePendingCount = () => {
    const sessions = storageService.getSessions();
    const count = sessions.filter(
      (s) => s.checkInStatus === 'pending' || s.checkOutStatus === 'pending'
    ).length;
    setPendingApprovalsCount(count);
  };

  useEffect(() => {
    // Check URL parameters for direct SSL link (e.g. ?ssl=swe-ssl-ez9941-oct26)
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const sslParam = params.get('ssl');
      if (sslParam) {
        setViewingSSLToken(sslParam);
      }
    }

    updatePendingCount();

    // Listen to real-time changes across windows and storage
    const unsubscribe = storageService.subscribe(() => {
      updatePendingCount();
    });

    return () => {
      unsubscribe();
    };
  }, []);

  return (
    <div className="min-h-screen bg-stone-100/80 text-stone-900 font-sans flex flex-col antialiased">
      {/* Top Header */}
      <Header
        activeTab={activeTab}
        onTabChange={(tab) => setActiveTab(tab)}
        pendingApprovalsCount={pendingApprovalsCount}
      />

      {/* Main Container - fully cell phone friendly with comfortable padding */}
      <main className="flex-1 max-w-6xl w-full mx-auto px-3 sm:px-6 py-4 sm:py-8">
        {activeTab === 'volunteer' && (
          <VolunteerPortal onViewSSLForm={(id) => setViewingSSLToken(id)} />
        )}

        {activeTab === 'admin' && (
          <AdminPortal onViewSSLForm={(id) => setViewingSSLToken(id)} />
        )}
      </main>

      {/* Public SSL Document Viewer (when opened via share link or personal profile) */}
      {viewingSSLToken && (
        <PublicSSLModal
          tokenOrId={viewingSSLToken}
          onClose={() => {
            setViewingSSLToken(null);
            if (typeof window !== 'undefined' && window.location.search.includes('ssl=')) {
              window.history.replaceState({}, '', window.location.pathname);
            }
          }}
        />
      )}

      {/* Footer */}
      <footer className="border-t border-stone-200 bg-white/90 py-6 text-center text-xs text-stone-500 mt-auto">
        <div className="max-w-4xl mx-auto px-4 space-y-3">
          <div className="flex items-center justify-center gap-2">
            <img
              src="/assets/aistudio/logo-img-300x300_a0363fa2.png"
              alt="So What Else"
              className="w-5 h-5 rounded-md object-contain bg-black"
            />
            <span className="font-bold text-stone-800 tracking-tight">
              So What Else, Inc. • Food Bank & Youth Empowerment
            </span>
          </div>
          <p className="text-stone-400">
            Rockville Warehouse (4924 Wyaconda Rd) • Montgomery Village Pantry • Baltimore Distribution • DC Ward 8 Mobile
          </p>
          <p className="text-[11px] text-stone-400">
            501(c)(3) Tax ID: 27-0899847 • Montgomery County Public Schools (MCPS) Approved SSL Organization
          </p>
        </div>
      </footer>
    </div>
  );
}
