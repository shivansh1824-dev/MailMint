import React, { useState } from 'react';
import { Clock, Calendar, X } from 'lucide-react';
import { api } from '../../lib/api';

interface SnoozeModalProps {
  isOpen: boolean;
  contactId: string | null;
  contactName?: string;
  onClose: () => void;
  onSnoozed: () => void;
}

export const SnoozeModal: React.FC<SnoozeModalProps> = ({
  isOpen,
  contactId,
  contactName,
  onClose,
  onSnoozed,
}) => {
  const [selectedDuration, setSelectedDuration] = useState<'3days' | '1week' | '2weeks' | 'custom'>('1week');
  const [customDate, setCustomDate] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen || !contactId) return null;

  const handleConfirm = async () => {
    setIsSubmitting(true);
    try {
      await api.post(`/contacts/${contactId}/snooze`, {
        duration: selectedDuration,
        customDate: selectedDuration === 'custom' ? customDate : undefined,
      });
      onSnoozed();
      onClose();
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fadeIn">
      <div className="w-full max-w-md bg-[#161B22] border border-[#2D3A4A] rounded-[8px] shadow-2xl p-6 relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 text-[#9CA3AF] hover:text-white hover:bg-[#1F2937] rounded-[6px] transition-colors"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="flex items-center gap-2 text-amber-400 mb-1">
          <Clock className="w-4 h-4" />
          <span className="text-[12px] font-semibold tracking-wider uppercase font-mono">
            Snooze Contact
          </span>
        </div>
        <h2 className="text-[18px] font-bold text-white mb-2 font-sans">
          Snooze {contactName || 'Contact'}
        </h2>
        <p className="text-[13px] text-[#9CA3AF] mb-5">
          Temporarily pauses follow-up alerts and hides this contact from your default active list. The daily morning digest will automatically resurface them.
        </p>

        <div className="space-y-2 mb-5">
          {[
            { id: '3days', label: '3 Days', desc: 'Resurface this Thursday' },
            { id: '1week', label: '1 Week', desc: 'Resurface next Monday' },
            { id: '2weeks', label: '2 Weeks', desc: 'Resurface in 14 days' },
            { id: 'custom', label: 'Custom Date', desc: 'Select exact calendar date' },
          ].map((opt) => (
            <label
              key={opt.id}
              className={`flex items-center justify-between p-3 rounded-[6px] border cursor-pointer transition-colors ${
                selectedDuration === opt.id
                  ? 'bg-[#1F2937] border-[#00C896]/50 text-white'
                  : 'bg-[#111827] border-[#2D3A4A] text-[#9CA3AF] hover:text-white'
              }`}
            >
              <div className="flex items-center gap-3">
                <input
                  type="radio"
                  name="snooze-duration"
                  checked={selectedDuration === opt.id}
                  onChange={() => setSelectedDuration(opt.id as any)}
                  className="w-4 h-4 accent-[#00C896]"
                />
                <span className="text-[13px] font-medium">{opt.label}</span>
              </div>
              <span className="text-[11px] text-[#6B7280]">{opt.desc}</span>
            </label>
          ))}
        </div>

        {selectedDuration === 'custom' && (
          <div className="mb-5">
            <label className="block text-[12px] font-medium text-[#9CA3AF] mb-1.5">
              Select Resurface Date
            </label>
            <div className="relative">
              <Calendar className="w-4 h-4 text-[#6B7280] absolute left-3 top-3" />
              <input
                type="date"
                value={customDate}
                onChange={(e) => setCustomDate(e.target.value)}
                min={new Date().toISOString().split('T')[0]}
                className="w-full pl-9 pr-3 py-2 bg-[#111827] border border-[#2D3A4A] rounded-[6px] text-[13px] text-white focus:outline-none focus:border-[#00C896]"
              />
            </div>
          </div>
        )}

        <div className="flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-[13px] text-[#9CA3AF] hover:text-white transition-colors"
          >
            Cancel
          </button>
          <button
            disabled={isSubmitting || (selectedDuration === 'custom' && !customDate)}
            onClick={handleConfirm}
            className="px-4 py-2 bg-amber-500 text-black font-semibold text-[13px] rounded-[6px] hover:bg-amber-400 disabled:opacity-50 transition-colors"
          >
            {isSubmitting ? 'Snoozing...' : 'Confirm Snooze'}
          </button>
        </div>
      </div>
    </div>
  );
};
