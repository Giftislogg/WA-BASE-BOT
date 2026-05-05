import React, { useEffect, useState } from 'react';
import { ShieldCheck, Flag, Layers, Users, AlertTriangle, UserX, Shield } from 'lucide-react';
import axios from 'axios';
import API from '../lib/api';

export default function Dashboard() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    axios.get(`${API}/api/stats`)
      .then(res => setStats(res.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const statCards = stats ? [
    { label: 'Groups', value: stats.totalGroups, icon: Users, color: '#3498db' },
    { label: 'Users Kicked', value: stats.totalKicks, icon: UserX, color: '#e74c3c' },
    { label: 'Warnings', value: stats.totalWarnings, icon: AlertTriangle, color: '#f39c12' },
    { label: 'Flagged', value: stats.totalFlagged, icon: Flag, color: '#9b59b6' },
  ] : [];

  return (
    <div className="flex flex-col min-h-screen">
      <div className="gradient-bg px-5 pt-12 pb-8">
        <div className="flex items-center gap-3 mb-1">
          <ShieldCheck size={28} color="white" />
          <div>
            <h1 className="text-xl font-bold text-white">Anti-WA</h1>
            <div className="flex items-center gap-1.5">
              <span className="pulse-dot" />
              <span className="text-white text-opacity-80 text-xs">Bot Active</span>
            </div>
          </div>
        </div>
        <p className="text-white text-opacity-70 text-xs mt-2">
          Stop cyber bullying on WhatsApp groups.
        </p>
      </div>

      <div className="px-4 py-4 space-y-4 fade-in">
        {loading ? (
          <div className="flex justify-center py-10">
            <div className="w-7 h-7 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          </div>
        ) : stats ? (
          <>
            <div className="grid grid-cols-2 gap-3">
              {statCards.map(({ label, value, icon: Icon, color }) => (
                <div key={label} className="card-bg rounded-xl p-4">
                  <Icon size={20} style={{ color }} className="mb-2" />
                  <p className="text-white text-2xl font-bold">{value}</p>
                  <p className="text-gray-400 text-xs">{label}</p>
                </div>
              ))}
            </div>

            {stats.totalStickers > 0 && (
              <div className="card-bg rounded-xl p-4 flex items-center gap-3">
                <Layers size={20} color="#00b09b" />
                <div>
                  <p className="text-white font-semibold text-sm">{stats.totalStickers} stickers collected</p>
                  <p className="text-gray-400 text-xs">Auto-collected from your groups</p>
                </div>
              </div>
            )}

            {stats.botNumber && (
              <div className="card-bg rounded-xl p-4">
                <p className="text-gray-400 text-xs mb-1">Bot Number</p>
                <p className="text-white font-semibold text-sm">+{stats.botNumber}</p>
                <p className="text-gray-500 text-xs mt-1">Send your 6-digit code to this number to link your account</p>
              </div>
            )}

            {stats.groups && stats.groups.length > 0 && (
              <div className="card-bg rounded-xl p-4">
                <p className="text-gray-400 text-xs mb-3">Active Groups ({stats.totalGroups})</p>
                <div className="space-y-2.5">
                  {stats.groups.map(g => (
                    <div key={g.jid} className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2 min-w-0">
                        <div className="w-7 h-7 rounded-full gradient-bg flex items-center justify-center flex-shrink-0">
                          <Users size={13} color="white" />
                        </div>
                        <p className="text-white text-sm truncate">{g.name}</p>
                      </div>
                      <div className={`flex-shrink-0 flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold ${
                        g.isBotAdmin
                          ? 'bg-green-900 bg-opacity-50 text-green-400'
                          : 'bg-gray-800 text-gray-500'
                      }`}>
                        <Shield size={9} color="currentColor" />
                        {g.isBotAdmin ? 'Admin' : 'Member'}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {stats.recentKicks && stats.recentKicks.length > 0 && (
              <div className="card-bg rounded-xl p-4">
                <p className="text-gray-400 text-xs mb-3">Recent Kicks</p>
                <div className="space-y-2">
                  {stats.recentKicks.map((k, i) => (
                    <div key={i} className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <UserX size={14} color="#e74c3c" />
                        <span className="text-white text-sm">+{k.kickedNumber}</span>
                      </div>
                      <span className="text-gray-500 text-xs">{new Date(k.at).toLocaleDateString()}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {(!stats.groups || stats.groups.length === 0) && (
              <div className="card-bg rounded-xl p-6 text-center">
                <ShieldCheck size={36} color="#00b09b" className="mx-auto mb-3" />
                <p className="text-white font-semibold">Add bot to groups</p>
                <p className="text-gray-400 text-sm mt-1">Add Anti-WA to WhatsApp groups and make it admin to start protecting them</p>
              </div>
            )}
          </>
        ) : (
          <div className="card-bg rounded-xl p-6 text-center">
            <ShieldCheck size={36} color="#00b09b" className="mx-auto mb-3" />
            <p className="text-white font-semibold">No data yet</p>
            <p className="text-gray-400 text-sm mt-1">Add the bot to a WhatsApp group to start protecting it</p>
          </div>
        )}
      </div>
    </div>
  );
}
