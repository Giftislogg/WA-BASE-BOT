import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { ShieldCheck, RefreshCw, Copy, CheckCircle, Loader, WifiOff, ServerCrash } from 'lucide-react';
import axios from 'axios';
import API from '../lib/api';

async function pingServer(timeoutMs = 15000) {
  await axios.get(`${API}/api/health`, { timeout: timeoutMs });
}

export default function Connect() {
  const navigate = useNavigate();
  const [code, setCode] = useState(null);
  const [sessionId, setSessionId] = useState(null);
  const [loading, setLoading] = useState(false);
  const [checking, setChecking] = useState(true);
  const [copied, setCopied] = useState(false);
  const [step, setStep] = useState('generate');
  const [botNumber, setBotNumber] = useState(null);
  const [serverState, setServerState] = useState('idle');
  const [wakeAttempt, setWakeAttempt] = useState(0);
  const [errorMsg, setErrorMsg] = useState(null);
  const wakeRef = useRef(false);

  useEffect(() => {
    async function init() {
      const existingSession = localStorage.getItem('sessionId');
      if (existingSession) {
        try {
          const res = await axios.get(`${API}/api/session/${existingSession}`, { timeout: 10000 });
          if (res.data.success) {
            navigate('/dashboard', { replace: true });
            return;
          }
          localStorage.removeItem('sessionId');
        } catch (err) {
          if (err.response?.status === 404) {
            localStorage.removeItem('sessionId');
          } else {
            navigate('/dashboard', { replace: true });
            return;
          }
        }
      }

      const pendingCode = localStorage.getItem('pendingCode');
      const pendingSession = localStorage.getItem('pendingSessionId');
      if (pendingCode && pendingSession) {
        setCode(pendingCode);
        setSessionId(pendingSession);
        setStep('waiting');
      }

      try {
        const res = await axios.get(`${API}/api/stats`, { timeout: 8000 });
        if (res.data.botNumber) setBotNumber(res.data.botNumber);
      } catch {}

      setChecking(false);
    }
    init();
  }, []);

  async function wakeUpServer() {
    if (!navigator.onLine) {
      setServerState('offline');
      setErrorMsg(null);
      return false;
    }

    setServerState('waking');
    setErrorMsg(null);
    wakeRef.current = true;

    for (let attempt = 1; attempt <= 6; attempt++) {
      if (!wakeRef.current) return false;
      setWakeAttempt(attempt);
      try {
        await pingServer(15000);
        setServerState('idle');
        return true;
      } catch {
        if (attempt < 6) {
          await new Promise(r => setTimeout(r, 4000));
        }
      }
    }

    wakeRef.current = false;
    setServerState('error');
    setErrorMsg('The server is not responding. Please try again in a moment.');
    return false;
  }

  async function generateCode() {
    setLoading(true);
    setErrorMsg(null);

    const isUp = await wakeUpServer();
    if (!isUp) {
      setLoading(false);
      return;
    }

    try {
      const res = await axios.post(`${API}/api/generate-code`, {}, { timeout: 15000 });
      if (!res.data.code) throw new Error('No code returned');
      const newCode = res.data.code;
      const newSession = res.data.sessionId;
      setCode(newCode);
      setSessionId(newSession);
      localStorage.setItem('pendingCode', newCode);
      localStorage.setItem('pendingSessionId', newSession);
      setStep('waiting');
    } catch {
      if (!navigator.onLine) {
        setServerState('offline');
      } else {
        setServerState('error');
        setErrorMsg('Code generation failed. Please tap "Try Again".');
      }
    } finally {
      setLoading(false);
    }
  }

  function copyCode() {
    navigator.clipboard?.writeText(code).catch(() => {});
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  async function checkLinked() {
    setLoading(true);
    try {
      const res = await axios.get(`${API}/api/session/${sessionId}`, { timeout: 12000 });
      if (res.data.success) {
        localStorage.setItem('sessionId', sessionId);
        localStorage.removeItem('pendingCode');
        localStorage.removeItem('pendingSessionId');
        setStep('done');
        setTimeout(() => navigate('/dashboard', { replace: true }), 1500);
      } else {
        setErrorMsg('Not linked yet — send your code to the bot first, then tap here.');
      }
    } catch {
      setErrorMsg('Could not check status. Make sure you sent the code to the bot, then try again.');
    } finally {
      setLoading(false);
    }
  }

  function resetCode() {
    localStorage.removeItem('pendingCode');
    localStorage.removeItem('pendingSessionId');
    setCode(null);
    setSessionId(null);
    setStep('generate');
    setServerState('idle');
    setErrorMsg(null);
    wakeRef.current = false;
  }

  if (checking) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen">
        <Loader size={32} color="#00b09b" className="animate-spin mb-3" />
        <p className="text-gray-400 text-sm">Checking account status...</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen">
      <div className="gradient-bg px-5 pt-12 pb-8 text-center">
        <ShieldCheck size={40} color="white" className="mx-auto mb-2" />
        <h1 className="text-xl font-bold text-white">Connect to Bot</h1>
        <p className="text-white text-opacity-75 text-sm mt-1">Link your WhatsApp to Anti-WA</p>
      </div>

      <div className="flex-1 px-4 py-5 space-y-4 fade-in">

        {serverState === 'offline' && (
          <div className="card-bg rounded-xl p-5 text-center space-y-3">
            <WifiOff size={40} color="#64748b" className="mx-auto" />
            <p className="text-white font-semibold">No Internet Connection</p>
            <p className="text-gray-400 text-sm">Please check your Wi-Fi or mobile data, then try again.</p>
            <button className="btn-primary mt-2" onClick={() => { setServerState('idle'); setErrorMsg(null); }}>
              Try Again
            </button>
          </div>
        )}

        {serverState === 'waking' && (
          <div className="card-bg rounded-xl p-5 text-center space-y-3">
            <Loader size={36} color="#00b09b" className="animate-spin mx-auto" />
            <p className="text-white font-semibold">Connecting to Server...</p>
            <p className="text-gray-400 text-sm">
              The server is starting up. This can take up to 30 seconds.
            </p>
            <div className="flex justify-center gap-1.5 mt-1">
              {[1,2,3,4,5,6].map(n => (
                <div
                  key={n}
                  className={`w-2 h-2 rounded-full transition-all ${n <= wakeAttempt ? 'bg-teal-400' : 'bg-gray-600'}`}
                />
              ))}
            </div>
            <p className="text-gray-500 text-xs">Attempt {wakeAttempt} of 6</p>
          </div>
        )}

        {serverState === 'error' && (
          <div className="card-bg rounded-xl p-5 text-center space-y-3">
            <ServerCrash size={40} color="#ef4444" className="mx-auto" />
            <p className="text-white font-semibold">Server Unavailable</p>
            <p className="text-gray-400 text-sm">{errorMsg || 'Could not reach the server. Please try again.'}</p>
            <button className="btn-primary mt-2" onClick={() => { setServerState('idle'); setErrorMsg(null); }}>
              Try Again
            </button>
          </div>
        )}

        {serverState === 'idle' && (
          <>
            {botNumber && (
              <div className="card-bg rounded-xl p-4 text-center">
                <p className="text-gray-400 text-xs mb-1">Send your code to this WhatsApp number</p>
                <p className="text-white font-bold text-lg">+{botNumber}</p>
              </div>
            )}

            {errorMsg && (
              <div className="bg-red-900 bg-opacity-30 border border-red-700 rounded-xl p-3 text-xs text-red-300">
                {errorMsg}
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
                    ? <span className="flex items-center justify-center gap-2"><RefreshCw size={16} className="animate-spin" /> Please wait...</span>
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
                  Code expires in <strong>15 minutes</strong>. If it expired, generate a new one below.
                </div>

                <button className="btn-primary" onClick={checkLinked} disabled={loading}>
                  {loading
                    ? <span className="flex items-center justify-center gap-2"><Loader size={16} className="animate-spin" /> Checking...</span>
                    : 'I Linked It — Continue'}
                </button>
                <button className="w-full text-gray-400 text-sm py-2" onClick={resetCode}>
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
          </>
        )}
      </div>
    </div>
  );
}
