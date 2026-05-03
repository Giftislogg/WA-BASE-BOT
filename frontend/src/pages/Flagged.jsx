import React, { useEffect, useState } from 'react';
import { Flag, RefreshCw, Trash2, CheckCircle, AlertTriangle } from 'lucide-react';
import axios from 'axios';
import API from '../lib/api';

export default function Flagged() {
  const [stickers, setStickers] = useState([]);
  const [loading, setLoading] = useState(true);

  async function load() {
    setLoading(true);
    try {
      const res = await axios.get(`${API}/api/flagged-stickers`);
      setStickers((res.data.stickers || []).reverse());
    } catch {
      alert('Failed to load flagged stickers.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, []);

  async function remove(id) {
    if (!confirm('Remove this flagged sticker from the list?')) return;
    try {
      await axios.delete(`${API}/api/flagged-sticker/${id}`);
      setStickers(prev => prev.filter(s => s.id !== id));
    } catch {
      alert('Failed to remove.');
    }
  }

  return (
    <div className="flex flex-col min-h-screen">
      <div className="gradient-bg px-6 pt-14 pb-10">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Flag size={32} color="white" />
            <div>
              <h1 className="text-xl font-extrabold text-white">Flagged Stickers</h1>
              <p className="text-white text-opacity-80 text-sm">{stickers.length} reported</p>
            </div>
          </div>
          <button
            onClick={load}
            className="bg-white bg-opacity-20 rounded-full p-2"
          >
            <RefreshCw size={18} color="white" className={loading ? 'animate-spin' : ''} />
          </button>
        </div>
      </div>

      <div className="flex-1 px-5 py-5 fade-in">
        {loading ? (
          <div className="flex justify-center py-16">
            <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          </div>
        ) : stickers.length === 0 ? (
          <div className="card-bg rounded-2xl p-10 text-center">
            <Flag size={40} color="#555" className="mx-auto mb-3" />
            <p className="text-white font-semibold">No stickers flagged yet</p>
            <p className="text-gray-400 text-sm mt-1">Report an abusive sticker to see it here</p>
          </div>
        ) : (
          <div className="space-y-4">
            {stickers.map(s => (
              <div key={s.id} className="card-bg rounded-2xl overflow-hidden">
                <div className="relative">
                  <img
                    src={`${API}${s.url}`}
                    alt="flagged sticker"
                    className="w-full object-cover max-h-52"
                    onError={e => { e.target.style.display = 'none'; }}
                  />
                  <div className="absolute top-2 right-2">
                    <span className={`status-badge ${s.removed ? 'bg-green-900 bg-opacity-90 text-green-300' : 'bg-red-900 bg-opacity-90 text-red-300'}`}>
                      {s.removed ? (
                        <><CheckCircle size={11} /> Removed</>
                      ) : (
                        <><AlertTriangle size={11} /> Pending</>
                      )}
                    </span>
                  </div>
                </div>
                <div className="p-4">
                  <p className="text-white text-sm font-medium mb-1">
                    {s.description || 'No description provided'}
                  </p>
                  <p className="text-gray-500 text-xs mb-3">
                    Reported: {new Date(s.reportedAt).toLocaleString()}
                  </p>
                  <button
                    onClick={() => remove(s.id)}
                    className="flex items-center gap-2 text-red-400 text-sm font-medium hover:text-red-300 transition-colors"
                  >
                    <Trash2 size={15} /> Remove from list
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
