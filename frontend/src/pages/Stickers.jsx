import React, { useState, useEffect, useCallback } from 'react';
import { Flag, RefreshCw, Shield, CheckCircle, Layers } from 'lucide-react';
import axios from 'axios';
import API from '../lib/api';

export default function Stickers() {
  const [stickers, setStickers] = useState([]);
  const [groups, setGroups] = useState([]);
  const [selectedGroup, setSelectedGroup] = useState('all');
  const [loading, setLoading] = useState(true);
  const [flagging, setFlagging] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [stickersRes, statsRes] = await Promise.all([
        axios.get(`${API}/api/group-stickers`),
        axios.get(`${API}/api/stats`)
      ]);
      setStickers(stickersRes.data.stickers || []);
      setGroups(statsRes.data.groups || []);
    } catch {
      // silent — show empty state
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const filtered = selectedGroup === 'all'
    ? stickers
    : stickers.filter(s => s.groupJid === selectedGroup);

  const flaggedCount = stickers.filter(s => s.flagged).length;

  async function toggleFlag(sticker) {
    setFlagging(sticker.hash);
    try {
      if (sticker.flagged) {
        await axios.delete(`${API}/api/flag-sticker-hash/${sticker.hash}`);
      } else {
        await axios.post(`${API}/api/flag-sticker-hash`, {
          hash: sticker.hash,
          flaggedBy: 'app-gallery',
          groupJid: sticker.groupJid,
          description: `Flagged from gallery — group: ${sticker.groupName}`
        });
      }
      setStickers(prev =>
        prev.map(s => s.hash === sticker.hash ? { ...s, flagged: !s.flagged } : s)
      );
    } catch (e) {
      const msg = e.response?.data?.message;
      if (msg === 'Already flagged') {
        setStickers(prev =>
          prev.map(s => s.hash === sticker.hash ? { ...s, flagged: true } : s)
        );
      } else {
        alert('Failed to update. Please try again.');
      }
    } finally {
      setFlagging(null);
    }
  }

  return (
    <div className="flex flex-col min-h-screen">
      <div className="gradient-bg px-6 pt-14 pb-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Layers size={28} color="white" />
            <div>
              <h1 className="text-xl font-extrabold text-white">Sticker Gallery</h1>
              <p className="text-white text-opacity-80 text-sm">
                {stickers.length} collected · {flaggedCount} flagged
              </p>
            </div>
          </div>
          <button
            onClick={load}
            className="bg-white bg-opacity-20 rounded-full p-2"
            disabled={loading}
          >
            <RefreshCw size={18} color="white" className={loading ? 'animate-spin' : ''} />
          </button>
        </div>
      </div>

      {/* Group filter pills */}
      <div className="px-4 pt-4 pb-1">
        <div className="flex gap-2 overflow-x-auto pb-2" style={{ scrollbarWidth: 'none' }}>
          <button
            onClick={() => setSelectedGroup('all')}
            className={`flex-shrink-0 px-4 py-1.5 rounded-full text-xs font-semibold transition-all ${
              selectedGroup === 'all'
                ? 'gradient-bg text-white shadow-md'
                : 'card-bg text-gray-400'
            }`}
          >
            All Groups ({stickers.length})
          </button>
          {groups.map(g => {
            const groupCount = stickers.filter(s => s.groupJid === g.jid).length;
            return (
              <button
                key={g.jid}
                onClick={() => setSelectedGroup(g.jid)}
                className={`flex-shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold transition-all ${
                  selectedGroup === g.jid
                    ? 'gradient-bg text-white shadow-md'
                    : 'card-bg text-gray-400'
                }`}
              >
                {g.isBotAdmin && <Shield size={9} color="currentColor" />}
                {g.name} ({groupCount})
              </button>
            );
          })}
        </div>
      </div>

      {/* Bot admin notice for selected group */}
      {selectedGroup !== 'all' && (() => {
        const g = groups.find(x => x.jid === selectedGroup);
        if (!g) return null;
        return (
          <div className={`mx-4 mb-2 rounded-xl px-3 py-2 text-xs flex items-center gap-2 ${
            g.isBotAdmin
              ? 'bg-green-900 bg-opacity-30 border border-green-700 text-green-300'
              : 'bg-yellow-900 bg-opacity-30 border border-yellow-700 text-yellow-300'
          }`}>
            <Shield size={12} color="currentColor" />
            {g.isBotAdmin
              ? 'Bot is admin in this group — flagged stickers will be auto-removed and senders warned/kicked'
              : 'Bot is NOT admin in this group — make it admin to enable auto-enforcement'}
          </div>
        );
      })()}

      <div className="flex-1 px-4 pb-4 fade-in">
        {loading ? (
          <div className="flex justify-center py-16">
            <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="card-bg rounded-2xl p-10 text-center mt-2">
            <Layers size={40} color="#555" className="mx-auto mb-3" />
            <p className="text-white font-semibold">No stickers yet</p>
            <p className="text-gray-400 text-sm mt-2 leading-relaxed">
              {selectedGroup === 'all'
                ? 'The bot automatically collects stickers sent in your groups. Add it to groups and stickers will appear here.'
                : 'No stickers collected from this group yet. They will appear as people send stickers.'}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3 mt-2">
            {filtered.map(s => (
              <div
                key={`${s.id || s.hash}-${s.groupJid}`}
                className={`card-bg rounded-2xl overflow-hidden ${
                  s.flagged ? 'ring-1 ring-red-500 ring-opacity-60' : ''
                }`}
              >
                <div className="relative bg-black bg-opacity-40">
                  <img
                    src={`${API}${s.url}`}
                    alt="sticker"
                    className="w-full h-32 object-contain p-2"
                    onError={e => {
                      e.target.style.opacity = '0.2';
                    }}
                  />
                  {s.flagged && (
                    <div className="absolute top-1.5 left-1.5 bg-red-600 rounded-full px-2 py-0.5 flex items-center gap-1">
                      <Flag size={9} color="white" />
                      <span className="text-white text-xs font-bold">FLAGGED</span>
                    </div>
                  )}
                </div>
                <div className="px-2.5 pb-2.5 pt-2">
                  <p className="text-gray-400 text-xs truncate mb-1.5">{s.groupName}</p>
                  <button
                    onClick={() => toggleFlag(s)}
                    disabled={flagging === s.hash}
                    className={`w-full py-1.5 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-all ${
                      s.flagged
                        ? 'bg-red-900 bg-opacity-50 text-red-300 hover:bg-opacity-80'
                        : 'gradient-bg text-white hover:opacity-90'
                    }`}
                  >
                    {flagging === s.hash ? (
                      <div className="w-3 h-3 border border-current border-t-transparent rounded-full animate-spin" />
                    ) : s.flagged ? (
                      <><CheckCircle size={12} /> Unflag</>
                    ) : (
                      <><Flag size={12} /> Flag It</>
                    )}
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
