import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { CheckCircle2, AlertCircle, X, ShieldAlert, Send, Mail, Sparkles } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

interface OutreachChecklistModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirmSend: (includeSignature: boolean, manualRecipient?: string) => Promise<void>;
  recipientEmail?: string;
  subject?: string;
  body?: string;
  hasJobLinked: boolean;
  isSending: boolean;
}

export const OutreachChecklistModal: React.FC<OutreachChecklistModalProps> = ({
  isOpen,
  onClose,
  onConfirmSend,
  recipientEmail = '',
  subject,
  body,
  hasJobLinked,
  isSending,
}) => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [manualConfirmed, setManualConfirmed] = useState(false);
  const [includeSignature, setIncludeSignature] = useState(true);
  const [targetEmail, setTargetEmail] = useState(recipientEmail);

  useEffect(() => {
    if (recipientEmail) {
      setTargetEmail(recipientEmail);
    }
  }, [recipientEmail]);

  if (!isOpen) return null;

  const wordCount = (body || '').trim().split(/\s+/).filter(Boolean).length;
  const isGmailConnected = Boolean(user?.gmailConnected);
  const hasSubject = Boolean(subject && subject.trim().length > 0);
  const hasValidBody = wordCount >= 15; // works for Ultra-Short, Short, and Standard
  const hasValidRecipient = Boolean(targetEmail && targetEmail.includes('@') && targetEmail.includes('.'));

  const mandatoryChecks = [
    { label: 'Profile verified (sender credentials)', pass: Boolean(user?.name || user?.email) },
    { label: 'Subject line is set', pass: hasSubject },
    { label: `Email body substantive (${wordCount} words)`, pass: hasValidBody },
    { label: `Valid recipient address (${targetEmail || 'Required'})`, pass: hasValidRecipient },
    { label: 'Inbox verified (Gmail account connected)', pass: isGmailConnected },
  ];

  const allMandatoryPassed = mandatoryChecks.every((c) => c.pass);
  const canSend = allMandatoryPassed && manualConfirmed && !isSending;

  return (
    <div className="fixed inset-0 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fadeIn">
      <div className="w-full max-w-lg bg-[#161B22] border border-[#2D3A4A] rounded-[8px] shadow-2xl p-6 relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 text-[#9CA3AF] hover:text-white hover:bg-[#1F2937] rounded-[6px] transition-colors"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="flex items-center gap-2 text-[#00C896] mb-1">
          <ShieldAlert className="w-4 h-4" />
          <span className="text-[12px] font-semibold tracking-wider uppercase font-mono">
            Anti-Spam Pre-Flight Checklist
          </span>
        </div>
        <h2 className="text-[20px] font-bold text-white mb-2 font-sans">
          Review & Approve Send
        </h2>
        <p className="text-[13px] text-[#9CA3AF] mb-4">
          MailMint strictly enforces human-in-the-loop review. Verify each checkpoint before delivering directly from your inbox.
        </p>

        {/* Recipient Address Field */}
        <div className="mb-4">
          <label className="block text-[11px] font-mono uppercase text-[#9CA3AF] mb-1">
            Recipient Email Address *
          </label>
          <div className="relative">
            <input
              type="email"
              value={targetEmail}
              onChange={(e) => setTargetEmail(e.target.value.trim())}
              placeholder="recruiter@company.com"
              className="w-full pl-9 pr-3 py-2 bg-[#111827] border border-[#2D3A4A] focus:border-[#00C896] rounded-[6px] text-[13px] text-white outline-none font-mono"
            />
            <Mail className="w-4 h-4 text-[#6B7280] absolute left-3 top-2.5" />
          </div>
        </div>

        {/* Automatic Checks */}
        <div className="space-y-2 mb-4 p-3.5 rounded-[6px] bg-[#111827] border border-[#2D3A4A]">
          {mandatoryChecks.map((check, idx) => (
            <div key={idx} className="flex items-center justify-between text-[13px]">
              <span className={check.pass ? 'text-[#F0F0F0]' : 'text-[#EF4444]'}>
                {check.label}
              </span>
              {check.pass ? (
                <CheckCircle2 className="w-4 h-4 text-[#00C896] flex-shrink-0" />
              ) : (
                <AlertCircle className="w-4 h-4 text-[#EF4444] flex-shrink-0" />
              )}
            </div>
          ))}

          {/* Optional context info */}
          <div className="flex items-center justify-between text-[12px] pt-1.5 border-t border-[#2D3A4A]/60 text-[#9CA3AF]">
            <span>Target job context: {hasJobLinked ? 'Linked ✓' : 'General outreach / No role attached'}</span>
            <span className="font-mono text-[10px] text-[#6B7280]">OPTIONAL</span>
          </div>
        </div>

        {/* Include signature toggle */}
        <div className="flex items-center justify-between py-2 border-b border-[#2D3A4A] mb-4 text-[13px]">
          <span className="text-[#9CA3AF]">Append your professional email signature</span>
          <input
            type="checkbox"
            checked={includeSignature}
            onChange={(e) => setIncludeSignature(e.target.checked)}
            className="w-4 h-4 rounded accent-[#00C896]"
          />
        </div>

        {/* Manual Checkbox */}
        <label className="flex items-start gap-3 p-3 rounded-[6px] bg-[#1F2937]/50 border border-[#2D3A4A] cursor-pointer mb-5 hover:bg-[#1F2937] transition-colors">
          <input
            type="checkbox"
            checked={manualConfirmed}
            onChange={(e) => setManualConfirmed(e.target.checked)}
            className="w-4 h-4 mt-0.5 rounded accent-[#00C896] cursor-pointer"
          />
          <span className="text-[13px] text-[#F0F0F0] font-medium leading-relaxed">
            I have personally reviewed this email, confirmed its personalization, and approve sending it from my inbox.
          </span>
        </label>

        {/* Actions */}
        <div className="flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-[13px] text-[#9CA3AF] hover:text-white transition-colors"
          >
            Back to Editor
          </button>

          {!isGmailConnected ? (
            <button
              onClick={() => {
                onClose();
                navigate('/settings');
              }}
              className="px-4 py-2 bg-indigo-600 text-white font-medium text-[13px] rounded-[6px] hover:bg-indigo-500 transition-colors"
            >
              Connect Gmail in Settings
            </button>
          ) : (
            <button
              disabled={!canSend}
              onClick={() => onConfirmSend(includeSignature, targetEmail)}
              className="flex items-center gap-2 px-5 py-2 bg-[#00C896] text-[#0D1117] font-semibold text-[13px] rounded-[6px] hover:bg-[#00b084] disabled:opacity-40 disabled:cursor-not-allowed transition-all shadow-[0_0_12px_rgba(0,200,150,0.2)]"
            >
              <Send className="w-4 h-4" />
              <span>{isSending ? 'Sending from Inbox...' : 'Approve & Send Now'}</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
