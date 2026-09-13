import React, { useState, useEffect } from 'react';
import { X, Eye, CheckCircle2 } from 'lucide-react';
import { Contact, Job } from '../../types';
import { api } from '../../lib/api';

interface VariablePreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  template: { name: string; subject: string; body: string; variables: string[] } | null;
}

export const VariablePreviewModal: React.FC<VariablePreviewModalProps> = ({
  isOpen,
  onClose,
  template,
}) => {
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [jobs, setJobs] = useState<Job[]>([]);
  const [selectedContactId, setSelectedContactId] = useState('');
  const [selectedJobId, setSelectedJobId] = useState('');

  useEffect(() => {
    if (isOpen) {
      api.get<{ success: boolean; contacts: Contact[] }>('/contacts').then((res) => {
        if (res.success && res.contacts?.length > 0) {
          setContacts(res.contacts);
          setSelectedContactId(res.contacts[0].id);
        }
      });
      api.get<{ success: boolean; jobs: Job[] }>('/jobs').then((res) => {
        if (res.success && res.jobs?.length > 0) {
          setJobs(res.jobs);
          setSelectedJobId(res.jobs[0].id);
        }
      });
    }
  }, [isOpen]);

  if (!isOpen || !template) return null;

  const selectedContact = contacts.find((c) => c.id === selectedContactId);
  const selectedJob = jobs.find((j) => j.id === selectedJobId);

  // Substitute variables
  const dataMap: Record<string, string> = {
    firstName: selectedContact?.name?.split(' ')[0] || '',
    candidateName: 'Alex Rivera',
    company: selectedContact?.company || selectedJob?.company?.name || '',
    roleTitle: selectedJob?.title || selectedContact?.job_title || '',
    topSkills: 'React, TypeScript, Node.js',
    university: 'Stanford University',
    degree: 'B.S. in Computer Science',
    graduationYear: '2026',
    specificTopic: 'high-concurrency event stream scaling',
    relevantProblem: 'distributed consensus caching',
    referrerName: 'Jordan Lee',
  };

  const interpolate = (text: string) => {
    return text.replace(/\{\{([a-zA-Z0-9_]+)\}\}/g, (_, varName) => {
      const val = dataMap[varName];
      if (val) return val;
      return `[[MISSING_${varName}]]`;
    });
  };

  const renderedSubject = interpolate(template.subject);
  const renderedBody = interpolate(template.body);

  return (
    <div className="fixed inset-0 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fadeIn">
      <div className="w-full max-w-4xl bg-[#161B22] border border-[#2D3A4A] rounded-[8px] shadow-2xl p-6 relative flex flex-col max-h-[90vh]">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 text-[#9CA3AF] hover:text-white hover:bg-[#1F2937] rounded-[6px] transition-colors"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="flex items-center gap-2 text-[#00C896] mb-1">
          <Eye className="w-4 h-4" />
          <span className="text-[12px] font-semibold tracking-wider uppercase font-mono">
            Variable Preview Mode
          </span>
        </div>
        <h2 className="text-[20px] font-bold text-white mb-4 font-sans">
          Preview Template with Real Pipeline Data
        </h2>

        {/* Data Selectors */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-5 p-3 bg-[#111827] border border-[#2D3A4A] rounded-[6px]">
          <div>
            <label className="block text-[11px] font-mono uppercase text-[#9CA3AF] mb-1">
              Sample Contact
            </label>
            <select
              value={selectedContactId}
              onChange={(e) => setSelectedContactId(e.target.value)}
              className="w-full px-3 py-1.5 bg-[#161B22] border border-[#2D3A4A] rounded text-[13px] text-white focus:border-[#00C896] outline-none"
            >
              {contacts.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name} ({c.company || 'No Company'})
                </option>
              ))}
              {contacts.length === 0 && <option value="">No contacts in database</option>}
            </select>
          </div>

          <div>
            <label className="block text-[11px] font-mono uppercase text-[#9CA3AF] mb-1">
              Sample Saved Job
            </label>
            <select
              value={selectedJobId}
              onChange={(e) => setSelectedJobId(e.target.value)}
              className="w-full px-3 py-1.5 bg-[#161B22] border border-[#2D3A4A] rounded text-[13px] text-white focus:border-[#00C896] outline-none"
            >
              {jobs.map((j) => (
                <option key={j.id} value={j.id}>
                  {j.title} ({j.company?.name || 'Company'})
                </option>
              ))}
              {jobs.length === 0 && <option value="">No jobs in database</option>}
            </select>
          </div>
        </div>

        {/* Two-Panel Comparison */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 flex-1 overflow-y-auto min-h-0">
          {/* Left Panel: Raw Template with Highlights */}
          <div className="p-4 bg-[#111827] border border-[#2D3A4A] rounded-[6px] flex flex-col">
            <span className="text-[12px] font-mono text-[#9CA3AF] uppercase mb-2">
              Template Variables
            </span>
            <div className="font-sans font-semibold text-white mb-2 text-[14px]">
              {template.subject}
            </div>
            <pre className="flex-1 whitespace-pre-wrap font-mono text-[12px] text-[#9CA3AF] leading-relaxed overflow-y-auto">
              {template.body}
            </pre>
          </div>

          {/* Right Panel: Rendered Real Data */}
          <div className="p-4 bg-[#111827] border border-[#00C896]/30 rounded-[6px] flex flex-col">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[12px] font-mono text-[#00C896] uppercase flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" /> Live Rendered Preview
              </span>
            </div>
            <div className="font-sans font-bold text-white mb-3 text-[14px]">
              {renderedSubject}
            </div>
            <div className="flex-1 whitespace-pre-wrap font-serif text-[14px] text-[#F0F0F0] leading-relaxed overflow-y-auto p-2 bg-[#161B22] rounded border border-[#2D3A4A]/50">
              {renderedBody.split(/(\[\[MISSING_[^\]]+\]\])/).map((part, idx) => {
                if (part.startsWith('[[MISSING_')) {
                  const varName = part.replace('[[MISSING_', '').replace(']]', '');
                  return (
                    <span
                      key={idx}
                      className="bg-red-500/20 text-red-400 px-1 py-0.5 rounded border border-red-500/40 text-[12px] font-mono"
                      title="No data found for this variable."
                    >
                      {`{{${varName}}}`}
                    </span>
                  );
                }
                return part;
              })}
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-3 pt-4 border-t border-[#2D3A4A] mt-4">
          <button
            onClick={onClose}
            className="px-5 py-2 bg-[#00C896] text-[#0D1117] font-semibold text-[13px] rounded-[6px] hover:bg-[#00b084]"
          >
            Close Preview
          </button>
        </div>
      </div>
    </div>
  );
};
