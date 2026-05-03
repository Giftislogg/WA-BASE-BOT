import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ShieldCheck, RefreshCw, Copy, CheckCircle } from 'lucide-react';
import axios from 'axios';
import API from '../lib/api';

export default function Connect() {
  const navigate = useNavigate();
  const [code, setCode] = useState(null);
  const [sessionId, setSessionId] = useState(null);
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [step, setStep] = useState('generate');
  const [botNumber, setBotNumber] = useState(null);

  useEffect(() => {
    axios.get(`${API}/api/stats`).then(res => {
      if (res.data.botNumber) setBotNumber(res.data.botNumber);
    }).catch(() => {});
  }, []);

  async function generateCode() {
    setLoading(true);
    try {
      const res = await axios.post(`${API}/api/generate-code`);
      if (!res.data.code) throw new Error('No code returned');
      setCode(res.data.code);
      setSessionId(res.data.sessionId);
      setStep('waiting');
    } catch {
      alert('Failed to generate code. Make sure you are connected to the internet and try again.');
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
      const res = await axios.get(`${API}/api/session/${sessionId}`);
      if (res.data.success) {
        localStorage.setItem('sessionId', sessionId);
        setStep('done');
        setTimeout(() => navigate('/dashboard'), 1500);
      }
    } catch {
      alert('Not linked yet. Send your 6-digit code to the bot on WhatsApp first.');
    }
  }

  return (
    <div className="flex flex-col min-h-screen">
      <div className="gradient-bg px-5 pt-12 pb-8 text-center">
        <ShieldCheck size={40} color="white" className="mx-auto mb-2" />
        <h1 className="text-xl font-bold text-white">Connect to Bot</h1>
        <p className="text-white text-opacity-75 text-sm mt-1">Link your WhatsApp to Anti-WA</p>
      </div>

      <div className="flex-1 px-4 py-5 space-y-4 fade-in">

        {botNumber && (
          <div className="card-bg rounded-xl p-4 text-center">
            <p className="text-gray-400 text-xs mb-1">Send your code to this WhatsApp number</p>
            <p className="text-white font-bold text-lg">+{botNumber}</p>
          </div>
        )}

        {step === 'generate' && (
          <>
            <div className="card-bg rounded-xl p-5 text-center">
              <p className="text-gray-400 text-sm mb-4">
                Generate a unique 6-digit code, then send it to the bot number above on WhatsApp.
              </p>
              <div className="bg-dark rounded-xl py-6">
                <p className="text-gray-600 text-3xl font-bold tracking-widest">••••••</p>
              </div>
            </div>
            <button className="btn-primary" onClick={generateCode} disabled={loading}>
              {loading
                ? <span className="flex items-center justify-center gap-2"><RefreshCw size={16} className="animate-spin" /> Generating...</span>
                : 'Generate My Code'}
            </button>
          </>
        )}

        {step === 'waiting' && (
          <>
            <div className="card-bg rounded-xl p-5 text-center">
              <p className="text-gray-400 text-xs uppercase tracking-widest mb-3">Your Code</p>
              <p className="code-box mb-3">{code}</p>
              <button
                onClick={copyCode}
                className="flex items-center justify-center gap-2 mx-auto text-sm font-medium px-4 py-2 rounded-lg bg-white bg-opacity-10 text-white"
              >
                {copied ? <CheckCircle size={15} color="#00b09b" /> : <Copy size={15} />}
                {copied ? 'Copied!' : 'Copy Code'}
              </button>
            </div>

            <div className="card-bg rounded-xl p-4 space-y-3">
              {[
                'Open WhatsApp',
                `Message the bot: just send ${code}`,
                'Wait for confirmation from the bot',
                'Come back and tap "I Linked It"',
              ].map((s, i) => (
                <div key={i} className="flex items-start gap-3">
                  <div className="gradient-bg text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center flex-shrink-0 mt-0.5">{i + 1}</div>
                  <p className="text-gray-300 text-sm">{s}</p>
                </div>
              ))}
            </div>

            <div className="bg-yellow-900 bg-opacity-30 border border-yellow-700 rounded-xl p-3 text-xs text-yellow-300">
              Code expires in <strong>15 minutes</strong>.
            </div>

            <button className="btn-primary" onClick={checkLinked}>I Linked It — Continue</button>
            <button className="w-full text-gray-400 text-sm py-2" onClick={() => setStep('generate')}>
              Generate New Code
            </button>
          </>
        )}

        {step === 'done' && (
          <div className="card-bg rounded-xl p-8 text-center fade-in">
            <CheckCircle size={52} color="#00b09b" className="mx-auto mb-3" />
            <p className="text-white font-bold">Account Linked!</p>
            <p className="text-gray-400 text-sm mt-1">Redirecting...</p>
          </div>
        )}
      </div>
    </div>
  );
}
