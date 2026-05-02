import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ShieldCheck, Flag, Upload, AlertTriangle, TrendingDown } from 'lucide-react';
import axios from 'axios';

export default function Dashboard() {
  const navigate = useNavigate();
  const sessionId = localStorage.getItem('sessionId');
  const [stickers, setStickers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    axios.get('/api/flagged-stickers')
      .then(res => setStickers(res.data.stickers || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const total = stickers.length;
  const removed = stickers.filter(s => s.removed).length;
  const pending = total - removed;

  return (
    <div className="flex flex-col min-h-screen">
      <div className="gradient-bg px-6 pt-14 pb-10">
        <div className="flex items-center gap-3 mb-2">
          <div className="bg-white bg-opacity-20 rounded-full p-2">
            <ShieldCheck size={28} color="white" />
          </div>
          <div>
            <h1 className="text-xl font-extrabold text-white">Anti-WA</h1>
            <div className="flex items-center gap-1.5">
              <span className="pulse-dot" />
              <span className="text-white text-opacity-80 text-xs">Bot Active</span>
            </div>
          </div>
        </div>
        <p className="text-white text-opacity-70 text-sm mt-2">
          Protecting your WhatsApp groups from cyber bullying.
        </p>
      </div>

      <div className="px-5 -mt-4 fade-in">
        <div className="grid grid-cols-3 gap-3 mb-5">
          {[
            { label: 'Total Flagged', value: total, color: '#f39c12', icon: Flag },
            { label: 'Removed', value: removed, color: '#00b09b', icon: TrendingDown },
            { label: 'Pending', value: pending, color: '#e74c3c', icon: AlertTriangle },
          ].map(({ label, value, color, icon: Icon }) => (
            <div key={label} className="card-bg rounded-2xl p-3 text-center">
              <Icon size={18} style={{ color }} className="mx-auto mb-1" />
              <p className="text-white font-bold text-xl">{value}</p>
              <p className="text-gray-400 text-xs">{label}</p>
            </div>
          ))}
        </div>

        <div className="card-bg rounded-2xl p-5 mb-5">
          <h2 className="text-white font-bold text-base mb-1">About Anti-WA</h2>
          <p className="text-gray-400 text-sm leading-relaxed">
            Anti-WA is a platform designed to combat cyber bullying on WhatsApp. Students and users can report abusive sticker images, and the connected WhatsApp bot will automatically detect and remove them from your group.
          </p>
        </div>

        {loading ? (
          <div className="text-center py-8">
            <div className="inline-block w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          </div>
        ) : stickers.length === 0 ? (
          <div className="card-bg rounded-2xl p-8 text-center">
            <ShieldCheck size={40} color="#00b09b" className="mx-auto mb-3" />
            <p className="text-white font-semibold">No stickers flagged yet</p>
            <p className="text-gray-400 text-sm mt-1">Report an abusive sticker to get started</p>
            <button className="btn-primary mt-4" onClick={() => navigate('/report')}>
              Report a Sticker
            </button>
          </div>
        ) : (
          <div className="card-bg rounded-2xl p-4">
            <h2 className="text-white font-semibold text-sm mb-3">Recent Reports</h2>
            <div className="space-y-2">
              {stickers.slice(-5).reverse().map(s => (
                <div key={s.id} className="flex items-center gap-3 bg-dark rounded-xl p-3">
                  <img
                    src={s.url}
                    alt="flagged"
                    className="w-12 h-12 rounded-lg object-cover flex-shrink-0"
                    onError={e => e.target.style.display = 'none'}
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-white text-sm font-medium truncate">{s.description || 'No description'}</p>
                    <p className="text-gray-500 text-xs">{new Date(s.reportedAt).toLocaleDateString()}</p>
                  </div>
                  <span className={`status-badge ${s.removed ? 'bg-green-900 text-green-300' : 'bg-red-900 text-red-300'}`}>
                    {s.removed ? 'Removed' : 'Pending'}
                  </span>
                </div>
              ))}
            </div>
            <button className="w-full text-primary text-sm font-medium mt-3 py-2 hover:opacity-80 transition-opacity" onClick={() => navigate('/flagged')}>
              View All Flagged Stickers →
            </button>
          </div>
        )}

        <div className="mt-5 mb-2">
          <button className="btn-primary" onClick={() => navigate('/report')}>
            <span className="flex items-center justify-center gap-2">
              <Upload size={18} /> Report Abusive Sticker
            </span>
          </button>
        </div>
      </div>
    </div>
  );
}
