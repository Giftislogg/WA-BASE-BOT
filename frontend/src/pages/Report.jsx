import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Upload, Image, CheckCircle, X, AlertTriangle } from 'lucide-react';
import axios from 'axios';

export default function Report() {
  const navigate = useNavigate();
  const sessionId = localStorage.getItem('sessionId');
  const fileRef = useRef();
  const [preview, setPreview] = useState(null);
  const [file, setFile] = useState(null);
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [drag, setDrag] = useState(false);

  function handleFile(f) {
    if (!f || !f.type.startsWith('image/')) {
      alert('Please select a valid image file.');
      return;
    }
    setFile(f);
    const reader = new FileReader();
    reader.onload = e => setPreview(e.target.result);
    reader.readAsDataURL(f);
  }

  function onFileChange(e) {
    handleFile(e.target.files[0]);
  }

  function onDrop(e) {
    e.preventDefault();
    setDrag(false);
    handleFile(e.dataTransfer.files[0]);
  }

  function clearFile() {
    setFile(null);
    setPreview(null);
    if (fileRef.current) fileRef.current.value = '';
  }

  async function submit() {
    if (!file) return alert('Please select a sticker image first.');
    if (!description.trim()) return alert('Please add a short description.');
    setLoading(true);
    try {
      const formData = new FormData();
      formData.append('image', file);
      formData.append('sessionId', sessionId);
      formData.append('description', description.trim());
      await axios.post('/api/flag-sticker', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      setSuccess(true);
      setTimeout(() => navigate('/flagged'), 2000);
    } catch {
      alert('Failed to submit. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  if (success) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen px-5 fade-in">
        <CheckCircle size={64} color="#00b09b" className="mb-4" />
        <h2 className="text-white font-bold text-xl">Sticker Reported!</h2>
        <p className="text-gray-400 text-sm mt-2 text-center">
          The bot will now monitor groups and remove this sticker automatically.
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen">
      <div className="gradient-bg px-6 pt-14 pb-10">
        <div className="flex items-center gap-3">
          <AlertTriangle size={32} color="white" />
          <div>
            <h1 className="text-xl font-extrabold text-white">Report Sticker</h1>
            <p className="text-white text-opacity-80 text-sm">Flag abusive content for removal</p>
          </div>
        </div>
      </div>

      <div className="flex-1 px-5 py-6 space-y-5 fade-in">
        <div className="card-bg rounded-2xl p-4">
          <p className="text-white font-semibold text-sm mb-3">Upload Sticker Screenshot</p>
          {!preview ? (
            <div
              className={`upload-zone ${drag ? 'drag-over' : ''}`}
              onClick={() => fileRef.current.click()}
              onDragOver={e => { e.preventDefault(); setDrag(true); }}
              onDragLeave={() => setDrag(false)}
              onDrop={onDrop}
            >
              <Image size={40} color="#00b09b" className="mx-auto mb-3" />
              <p className="text-white font-medium text-sm">Tap to upload or drag & drop</p>
              <p className="text-gray-400 text-xs mt-1">PNG, JPG, WEBP up to 10MB</p>
              <input
                ref={fileRef}
                type="file"
                accept="image/*"
                onChange={onFileChange}
                className="hidden"
              />
            </div>
          ) : (
            <div className="relative">
              <img src={preview} alt="preview" className="w-full rounded-xl object-contain max-h-64" />
              <button
                onClick={clearFile}
                className="absolute top-2 right-2 bg-red-600 rounded-full p-1"
              >
                <X size={16} color="white" />
              </button>
            </div>
          )}
        </div>

        <div className="card-bg rounded-2xl p-4">
          <label className="text-white font-semibold text-sm block mb-2">Why is this abusive?</label>
          <textarea
            className="input-field resize-none"
            rows={4}
            placeholder="Describe why this sticker is bullying or abusive (e.g., mocks a student, contains hate speech...)"
            value={description}
            onChange={e => setDescription(e.target.value)}
            maxLength={300}
          />
          <p className="text-gray-500 text-xs mt-1 text-right">{description.length}/300</p>
        </div>

        <div className="bg-blue-900 bg-opacity-30 border border-blue-700 rounded-xl p-3 text-xs text-blue-300">
          Once submitted, the WhatsApp bot will scan group chats for this sticker and <strong>automatically delete</strong> any message containing it.
        </div>

        <button
          className="btn-primary"
          onClick={submit}
          disabled={loading || !file}
        >
          {loading ? (
            <span className="flex items-center justify-center gap-2">
              <Upload size={18} className="animate-bounce" /> Submitting...
            </span>
          ) : (
            <span className="flex items-center justify-center gap-2">
              <Upload size={18} /> Submit Report
            </span>
          )}
        </button>
      </div>
    </div>
  );
}
