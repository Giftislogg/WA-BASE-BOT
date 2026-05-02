import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ShieldCheck, Users, Flag, Zap } from 'lucide-react';

export default function Home() {
  const navigate = useNavigate();
  const sessionId = localStorage.getItem('sessionId');

  return (
    <div className="flex flex-col min-h-screen">
      <div className="gradient-bg px-6 pt-16 pb-12 text-center">
        <div className="flex justify-center mb-4">
          <div className="bg-white bg-opacity-20 rounded-full p-4">
            <ShieldCheck size={48} color="white" strokeWidth={2} />
          </div>
        </div>
        <h1 className="text-3xl font-extrabold text-white mb-2">Anti-WA</h1>
        <p className="text-white text-opacity-90 text-base font-medium">Stop Cyber Bullying on WhatsApp</p>
        <p className="text-white text-opacity-70 text-sm mt-2">
          Connect your group, report abusive stickers, and let our bot remove them automatically.
        </p>
      </div>

      <div className="flex-1 px-5 py-8 space-y-4 fade-in">
        <div className="grid grid-cols-2 gap-4">
          {[
            { icon: Flag, title: 'Report Stickers', desc: 'Flag abusive sticker images', color: '#e74c3c' },
            { icon: Zap, title: 'Auto Remove', desc: 'Bot removes flagged content', color: '#f39c12' },
            { icon: Users, title: 'Group Safety', desc: 'Protect your WA groups', color: '#3498db' },
            { icon: ShieldCheck, title: 'Stay Safe', desc: 'Zero tolerance for bullying', color: '#00b09b' },
          ].map(({ icon: Icon, title, desc, color }) => (
            <div key={title} className="card-bg rounded-2xl p-4">
              <div className="mb-2" style={{ color }}>
                <Icon size={26} strokeWidth={2} />
              </div>
              <p className="text-white font-semibold text-sm">{title}</p>
              <p className="text-gray-400 text-xs mt-1">{desc}</p>
            </div>
          ))}
        </div>

        <div className="card-bg rounded-2xl p-5">
          <h2 className="text-white font-bold text-base mb-3">How it works</h2>
          {[
            { step: '1', text: 'Get your unique 6-digit code from this app' },
            { step: '2', text: 'Send the code to our WhatsApp bot number' },
            { step: '3', text: 'Add the bot to your WhatsApp group' },
            { step: '4', text: 'Upload abusive stickers — the bot removes them' },
          ].map(({ step, text }) => (
            <div key={step} className="flex items-start gap-3 mb-3 last:mb-0">
              <div className="gradient-bg text-white text-xs font-bold rounded-full w-6 h-6 flex items-center justify-center flex-shrink-0 mt-0.5">
                {step}
              </div>
              <p className="text-gray-300 text-sm">{text}</p>
            </div>
          ))}
        </div>

        <button
          className="btn-primary"
          onClick={() => navigate(sessionId ? '/dashboard' : '/connect')}
        >
          {sessionId ? 'Go to Dashboard' : 'Get Started'}
        </button>
      </div>
    </div>
  );
}
