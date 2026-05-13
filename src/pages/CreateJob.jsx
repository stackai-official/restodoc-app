import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { createJob } from '../lib/api';

const LOSS_TYPES = ['water', 'fire', 'mold', 'other'];

const LOSS_COLORS = {
  water: 'bg-blue-500/20 text-blue-400 border-blue-500/40',
  fire:  'bg-orange-500/20 text-orange-400 border-orange-500/40',
  mold:  'bg-green-500/20 text-green-400 border-green-500/40',
  other: 'bg-slate-500/20 text-slate-400 border-slate-500/40',
};

const inputClass =
  'w-full px-3 py-2.5 rounded-lg bg-slate-800 border border-slate-700 text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500';

export default function CreateJob({ userId }) {
  const navigate = useNavigate();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const [title, setTitle] = useState('');
  const [address, setAddress] = useState('');
  const [lossType, setLossType] = useState('water');
  const [claimNumber, setClaimNumber] = useState('');
  const [insuranceCompany, setInsuranceCompany] = useState('');
  const [adjusterName, setAdjusterName] = useState('');
  const [adjusterPhone, setAdjusterPhone] = useState('');
  const [notes, setNotes] = useState('');

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setSaving(true);

    try {
      await createJob({
        user_id: userId,
        title,
        address,
        loss_type: lossType,
        claim_number: claimNumber || null,
        insurance_company: insuranceCompany || null,
        adjuster_name: adjusterName || null,
        adjuster_phone: adjusterPhone || null,
        notes: notes || null,
      });
      navigate('/', { replace: true });
    } catch (err) {
      setError(err.message);
      setSaving(false);
    }
  }

  return (
    <div className="min-h-screen bg-[#0f172a] flex flex-col">
      {/* Header */}
      <header className="sticky top-0 z-10 bg-[#0f172a]/95 backdrop-blur-sm border-b border-slate-800 px-4 py-3 flex items-center justify-between">
        <button
          onClick={() => navigate(-1)}
          className="text-slate-400 hover:text-white transition-colors text-sm"
        >
          Cancel
        </button>
        <h1 className="text-lg font-semibold text-white">New Job</h1>
        <button
          type="submit"
          form="create-job-form"
          disabled={saving}
          className="text-sm font-medium text-blue-400 hover:text-blue-300 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {saving ? 'Saving...' : 'Save'}
        </button>
      </header>

      <form id="create-job-form" onSubmit={handleSubmit} className="flex-1 p-4 space-y-5 pb-12">
        {/* Title */}
        <div>
          <label className="block text-sm text-slate-300 mb-1">Job title *</label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
            className={inputClass}
            placeholder="e.g. Smith Residence Water Loss"
          />
        </div>

        {/* Address */}
        <div>
          <label className="block text-sm text-slate-300 mb-1">Address *</label>
          <input
            type="text"
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            required
            className={inputClass}
            placeholder="123 Main St, City, ST 12345"
          />
        </div>

        {/* Loss type */}
        <div>
          <label className="block text-sm text-slate-300 mb-2">Loss type</label>
          <div className="flex gap-2">
            {LOSS_TYPES.map((type) => (
              <button
                key={type}
                type="button"
                onClick={() => setLossType(type)}
                className={`flex-1 py-2 rounded-lg text-sm capitalize border transition-colors ${
                  lossType === type
                    ? LOSS_COLORS[type]
                    : 'border-slate-700 text-slate-500 hover:text-slate-300'
                }`}
              >
                {type}
              </button>
            ))}
          </div>
        </div>

        {/* Claim number */}
        <div>
          <label className="block text-sm text-slate-300 mb-1">Claim number</label>
          <input
            type="text"
            value={claimNumber}
            onChange={(e) => setClaimNumber(e.target.value)}
            className={inputClass}
            placeholder="Optional"
          />
        </div>

        {/* Insurance company */}
        <div>
          <label className="block text-sm text-slate-300 mb-1">Insurance company</label>
          <input
            type="text"
            value={insuranceCompany}
            onChange={(e) => setInsuranceCompany(e.target.value)}
            className={inputClass}
            placeholder="Optional"
          />
        </div>

        {/* Adjuster name + phone */}
        <div className="flex gap-3">
          <div className="flex-1">
            <label className="block text-sm text-slate-300 mb-1">Adjuster name</label>
            <input
              type="text"
              value={adjusterName}
              onChange={(e) => setAdjusterName(e.target.value)}
              className={inputClass}
              placeholder="Optional"
            />
          </div>
          <div className="flex-1">
            <label className="block text-sm text-slate-300 mb-1">Adjuster phone</label>
            <input
              type="tel"
              value={adjusterPhone}
              onChange={(e) => setAdjusterPhone(e.target.value)}
              className={inputClass}
              placeholder="Optional"
            />
          </div>
        </div>

        {/* Notes */}
        <div>
          <label className="block text-sm text-slate-300 mb-1">Notes</label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={3}
            className={`${inputClass} resize-none`}
            placeholder="Additional details..."
          />
        </div>

        {/* Error */}
        {error && (
          <p className="text-red-400 text-sm bg-red-400/10 border border-red-400/20 rounded-lg px-3 py-2">
            {error}
          </p>
        )}
      </form>
    </div>
  );
}
