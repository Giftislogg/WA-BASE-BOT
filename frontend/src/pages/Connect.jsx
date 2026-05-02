import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ShieldCheck, RefreshCw, Copy, CheckCircle } from 'lucide-react';
import axios from 'axios';

export default function Connect() {
  const navigate = useNavigate();
  const [code, setCode] = useState(null);
  const [sessionId, setSessionId] = useState(null);
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [step, setStep] = useState('generate');

  async function generateCode() {
    setLoading(true);
    try {
      const res = await axios.post('/api/generate-code');
      setCode(res.data.code);
      setSessionId(res.data.sessionId);
      setStep('waiting');
    } catch {
      alert('Failed to generate code. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  function copyCode() {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  async function checkLinked() {
    try {
      const res = await axios.get(`/api/session/${sessionId}`);
      if (res.data.success) {
        localStorage.setItem('sessionId', sessionId);
        setStep('done');
        setTimeout(() => navigate('/dashboard'), 1500);
      } else {
        alert('Not linked yet. Please send the code to the bot first.');
      }
    } catch {
      alert('Not linked yet. Please send your code to the WhatsApp bot first.');
    }
  }

  return (
    <div className="flex flex-col min-h-screen">
      <div className="gradient-bg px-6 pt-14 pb-10 text-center">
        <ShieldCheck size={44} color="white" className="mx-auto mb-3" />
        <h1 className="text-2xl font-extrabold text-white">Connect to Bot</h1>
        <p className="text-white text-opacity-80 text-sm mt-1">Link your WhatsApp to Anti-WA</p>
      </div>

      <div className="flex-1 px-5 py-8 space-y-5 fade-in">
        {step === 'generate' && (
          <>
            <div className="card-bg rounded-2xl p-5 text-center">
              <p className="text-gray-300 text-sm mb-6">
                Generate a unique 6-digit code. Then send it to the Anti-WA bot on WhatsApp to link your account.
              </p>
              <div className="bg-dark rounded-xl p-8 mb-2">
                <p className="text-gray-500 text-4xl font-bold tracking-widest">••••••</p>
              </div>
              <p className="text-gray-500 text-xs mt-2">Tap below to generate your code</p>
            </div>
            <button className="btn-primary" onClick={generateCode} disabled={loading}>
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <RefreshCw size={18} className="animate-spin" /> Generating...
                </span>
              ) : 'Generate My Code'}
            </button>
          </>
        )}

        {step === 'waiting' && (
          <>
            <div className="card-bg rounded-2xl p-6 text-center">
              <p className="text-gray-400 text-xs uppercase tracking-widest mb-3">Your Code</p>
              <p className="code-box mb-4">{code}</p>
              <button
                onClick={copyCode}
                className="flex items-center justify-center gap-2 mx-auto text-sm font-medium px-4 py-2 rounded-lg bg-white bg-opacity-10 hover:bg-opacity-20 transition-all text-white"
              >
                {copied ? <CheckCircle size={16} color="#00b09b" /> : <Copy size={16} />}
                {copied ? 'Copied!' : 'Copy Code'}
              </button>
            </div>

            <div className="card-bg rounded-2xl p-5 space-y-3">
              <p className="text-white font-semibold text-sm">Next Steps:</p>
              {[
                'Open WhatsApp',
                `Send this message to the bot: your code (e.g. ${code})`,
                'The bot will confirm your account is linked',
                'Come back here and tap "I Linked It"',
              ].map((s, i) => (
                <div key={i} className="flex items-start gap-3">
                  <div className="gradient-bg text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center flex-shrink-0 mt-0.5">
                    {i + 1}
                  </div>
                  <p className="text-gray-300 text-sm">{s}</p>
                </div>
              ))}
            </div>

            <div className="bg-yellow-900 bg-opacity-30 border border-yellow-700 rounded-xl p-3 text-xs text-yellow-300">
              Code expires in <strong>15 minutes</strong>. Generate a new one if it expires.
            </div>

            <button className="btn-primary" onClick={checkLinked}>
              I Linked It — Continue
            </button>
            <button
              className="w-full text-gray-400 text-sm py-2 hover:text-white transition-colors"
              onClick={() => setStep('generate')}
            >
              Generate New Code
            </button>
          </>
        )}

        {step === 'done' && (
          <div className="card-bg rounded-2xl p-8 text-center fade-in">
            <CheckCircle size={56} color="#00b09b" className="mx-auto mb-4" />
            <p className="text-white font-bold text-lg">Account Linked!</p>
            <p className="text-gray-400 text-sm mt-2">Redirecting to dashboard...</p>
          </div>
        )}
      </div>
    </div>
  );
}
