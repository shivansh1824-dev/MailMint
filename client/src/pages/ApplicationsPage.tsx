import React, { useState, useEffect } from 'react';
import {
  Layers,
  Plus,
  Building2,
  Briefcase,
  User,
  Calendar,
  ExternalLink,
  X,
  ChevronRight,
  Sparkles,
} from 'lucide-react';
import { api } from '../lib/api';
import { Application, Job, Contact } from '../types';
import { StatusBadge } from '../components/common/Badge';

export const ApplicationsPage: React.FC = () => {
  const [applications, setApplications] = useState<Application[]>([]);
  const [jobs, setJobs] = useState<Job[]>([]);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Modals & Drawer
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [selectedApp, setSelectedApp] = useState<Application | null>(null);

  // New Application Form
  const [newApp, setNewApp] = useState({
    job_id: '',
    contact_id: '',
    applied_via: 'portal',
    applied_date: new Date().toISOString().split('T')[0],
    status: 'applied' as const,
    notes: '',
    referral_from: '',
  });

  const fetchApplications = async () => {
    setIsLoading(true);
    try {
      const [appsRes, jobsRes, contsRes] = await Promise.all([
        api.get<{ success: boolean; applications: Application[] }>('/applications'),
        api.get<{ success: boolean; jobs: Job[] }>('/jobs'),
        api.get<{ success: boolean; contacts: Contact[] }>('/contacts'),
      ]);
      if (appsRes.success) setApplications(appsRes.applications || []);
      if (jobsRes.success) setJobs(jobsRes.jobs || []);
      if (contsRes.success) setContacts(contsRes.contacts || []);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchApplications();
  }, []);

  const handleUpdateStatus = async (appId: string, newStatus: any) => {
    try {
      await api.put(`/applications/${appId}`, { status: newStatus });
      setApplications((prev) =>
        prev.map((a) => (a.id === appId ? { ...a, status: newStatus } : a))
      );
      if (selectedApp && selectedApp.id === appId) {
        setSelectedApp({ ...selectedApp, status: newStatus });
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleCreateApp = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await api.post('/applications', newApp);
      if (res.success) {
        setCreateModalOpen(false);
        setNewApp({
          job_id: '',
          contact_id: '',
          applied_via: 'portal',
          applied_date: new Date().toISOString().split('T')[0],
          status: 'applied',
          notes: '',
          referral_from: '',
        });
        fetchApplications();
      }
    } catch (err: any) {
      alert(err.message || 'Failed to create application.');
    }
  };

  const stages = [
    { id: 'applied', label: 'Applied', color: 'border-blue-500/40 text-blue-400' },
    { id: 'phone-screen', label: 'Phone Screen', color: 'border-cyan-500/40 text-cyan-400' },
    { id: 'interview', label: 'Interview', color: 'border-purple-500/40 text-purple-400' },
    { id: 'offer', label: 'Offer', color: 'border-emerald-500/50 text-emerald-400' },
    { id: 'rejected', label: 'Rejected', color: 'border-red-500/30 text-red-400' },
    { id: 'withdrawn', label: 'Withdrawn', color: 'border-gray-500/30 text-gray-400' },
  ] as const;

  return (
    <div className="space-y-6 animate-fadeIn pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-[28px] font-bold text-white tracking-tight font-sans">
            Application Pipeline
          </h1>
          <p className="text-[13px] text-[#9CA3AF]">
            6-stage Kanban board tracking interviews, offers, and recruiter conversations
          </p>
        </div>

        <button
          onClick={() => setCreateModalOpen(true)}
          className="flex items-center gap-1.5 px-4 py-2 bg-[#00C896] hover:bg-[#00b084] text-[#0D1117] text-[13px] font-bold rounded-[6px] transition-colors shadow-[0_0_12px_rgba(0,200,150,0.2)]"
        >
          <Plus className="w-4 h-4 stroke-[2.5]" />
          <span>Add Application</span>
        </button>
      </div>

      {/* 6-Stage Kanban Board */}
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4 overflow-x-auto pb-4">
        {stages.map((stage) => {
          const bucket = applications.filter((a) => a.status === stage.id);
          return (
            <div
              key={stage.id}
              className="bg-[#161B22] border border-[#2D3A4A] rounded-[8px] p-3 flex flex-col min-w-[210px]"
            >
              <div className="flex items-center justify-between pb-2 border-b border-[#2D3A4A] mb-3">
                <span className={`font-mono text-[12px] font-semibold uppercase ${stage.color}`}>
                  {stage.label}
                </span>
                <span className="text-[11px] font-mono text-[#6B7280] bg-[#111827] px-1.5 py-0.5 rounded">
                  {bucket.length}
                </span>
              </div>

              <div className="space-y-2 flex-1">
                {bucket.map((app) => {
                  const companyName = app.company?.name || app.job?.company?.name || 'Company';
                  const title = app.job?.title || 'Engineering Role';
                  return (
                    <div
                      key={app.id}
                      onClick={() => setSelectedApp(app)}
                      className="p-3 bg-[#111827] border border-[#2D3A4A] hover:border-[#00C896]/40 rounded-[6px] cursor-pointer transition-all space-y-2"
                    >
                      <div>
                        <div className="font-semibold text-white text-[13px] leading-snug">
                          {title}
                        </div>
                        <div className="text-[11px] text-[#00C896] flex items-center gap-1 mt-0.5">
                          <Building2 className="w-3 h-3" />
                          <span>{companyName}</span>
                        </div>
                      </div>

                      <div className="flex items-center justify-between text-[11px] text-[#6B7280] pt-1 border-t border-[#2D3A4A]/50">
                        <span className="font-mono">{app.applied_date}</span>
                        <span className="capitalize">{app.applied_via}</span>
                      </div>
                    </div>
                  );
                })}

                {bucket.length === 0 && (
                  <div className="text-center py-8 text-[12px] text-[#6B7280]">
                    No applications
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Application Detail Drawer */}
      {selectedApp && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex justify-end animate-fadeIn">
          <div className="w-full max-w-lg bg-[#161B22] border-l border-[#2D3A4A] h-full flex flex-col p-6 overflow-y-auto shadow-2xl">
            <div className="flex items-center justify-between pb-4 border-b border-[#2D3A4A] mb-4">
              <div>
                <h2 className="text-[20px] font-bold text-white font-sans">
                  {selectedApp.job?.title || 'Application Details'}
                </h2>
                <p className="text-[13px] text-[#00C896] mt-0.5">
                  {selectedApp.company?.name || selectedApp.job?.company?.name || 'Company'}
                </p>
              </div>
              <button
                onClick={() => setSelectedApp(null)}
                className="p-1 text-[#9CA3AF] hover:text-white rounded"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Quick Stage Switcher */}
            <div className="mb-6">
              <label className="block text-[11px] font-mono uppercase text-[#9CA3AF] mb-2">
                Move Pipeline Stage
              </label>
              <div className="grid grid-cols-3 gap-1.5 bg-[#111827] p-1.5 rounded-[6px] border border-[#2D3A4A]">
                {stages.map((st) => (
                  <button
                    key={st.id}
                    onClick={() => handleUpdateStatus(selectedApp.id, st.id)}
                    className={`py-1.5 px-2 rounded text-[11px] font-medium transition-colors ${
                      selectedApp.status === st.id
                        ? 'bg-[#00C896] text-[#0D1117] font-bold'
                        : 'text-[#9CA3AF] hover:text-white'
                    }`}
                  >
                    {st.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Application Meta */}
            <div className="space-y-3 bg-[#111827] p-4 rounded-[6px] border border-[#2D3A4A] text-[13px] mb-6">
              <div className="flex justify-between">
                <span className="text-[#6B7280]">Applied Via</span>
                <span className="text-white capitalize">{selectedApp.applied_via}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#6B7280]">Applied Date</span>
                <span className="text-white font-mono">{selectedApp.applied_date}</span>
              </div>
              {selectedApp.referral_from && (
                <div className="flex justify-between">
                  <span className="text-[#6B7280]">Referral Source</span>
                  <span className="text-white">{selectedApp.referral_from}</span>
                </div>
              )}
            </div>

            {/* Notes Section */}
            <div className="space-y-2 mb-6">
              <h4 className="text-[13px] font-bold text-white">Interview Notes & Next Steps</h4>
              <div className="p-3 bg-[#111827] border border-[#2D3A4A] rounded-[6px] text-[13px] text-[#9CA3AF] whitespace-pre-wrap leading-relaxed">
                {selectedApp.notes || 'No notes added for this application.'}
              </div>
            </div>

            {/* Linked Contact */}
            {selectedApp.contact && (
              <div className="p-3 bg-[#111827] border border-[#2D3A4A] rounded-[6px] flex items-center justify-between text-[12px]">
                <div>
                  <div className="font-semibold text-white">{selectedApp.contact.name}</div>
                  <div className="text-[#6B7280]">{selectedApp.contact.job_title}</div>
                </div>
                <span className="text-[#00C896] font-mono">{selectedApp.contact.email}</span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Add Application Modal */}
      {createModalOpen && (
        <div className="fixed inset-0 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fadeIn">
          <div className="w-full max-w-lg bg-[#161B22] border border-[#2D3A4A] rounded-[8px] shadow-2xl p-6 relative">
            <button
              onClick={() => setCreateModalOpen(false)}
              className="absolute top-4 right-4 text-[#9CA3AF] hover:text-white"
            >
              <X className="w-4 h-4" />
            </button>
            <h2 className="text-[18px] font-bold text-white mb-4">Track New Job Application</h2>

            <form onSubmit={handleCreateApp} className="space-y-3 text-[13px]">
              <div>
                <label className="block text-[#9CA3AF] mb-1">Select Target Job *</label>
                <select
                  required
                  value={newApp.job_id}
                  onChange={(e) => setNewApp({ ...newApp, job_id: e.target.value })}
                  className="w-full px-3 py-1.5 bg-[#111827] border border-[#2D3A4A] rounded text-white focus:border-[#00C896] outline-none"
                >
                  <option value="">-- Choose Job --</option>
                  {jobs.map((j) => (
                    <option key={j.id} value={j.id}>
                      {j.title} {j.company?.name ? `@ ${j.company.name}` : ''}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[#9CA3AF] mb-1">Applied Via</label>
                  <select
                    value={newApp.applied_via}
                    onChange={(e) => setNewApp({ ...newApp, applied_via: e.target.value })}
                    className="w-full px-3 py-1.5 bg-[#111827] border border-[#2D3A4A] rounded text-white focus:border-[#00C896] outline-none"
                  >
                    <option value="portal">Company Portal</option>
                    <option value="referral">Referral</option>
                    <option value="email">Cold Email</option>
                    <option value="LinkedIn">LinkedIn</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[#9CA3AF] mb-1">Applied Date</label>
                  <input
                    type="date"
                    value={newApp.applied_date}
                    onChange={(e) => setNewApp({ ...newApp, applied_date: e.target.value })}
                    className="w-full px-3 py-1.5 bg-[#111827] border border-[#2D3A4A] rounded text-white focus:border-[#00C896] outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[#9CA3AF] mb-1">Linked Contact (optional)</label>
                <select
                  value={newApp.contact_id}
                  onChange={(e) => setNewApp({ ...newApp, contact_id: e.target.value })}
                  className="w-full px-3 py-1.5 bg-[#111827] border border-[#2D3A4A] rounded text-white focus:border-[#00C896] outline-none"
                >
                  <option value="">-- None --</option>
                  {contacts.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name} ({c.company || 'Company'})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[#9CA3AF] mb-1">Notes / Referral Details</label>
                <textarea
                  rows={3}
                  value={newApp.notes}
                  onChange={(e) => setNewApp({ ...newApp, notes: e.target.value })}
                  placeholder="Interview rounds, coding challenges, referral context..."
                  className="w-full px-3 py-1.5 bg-[#111827] border border-[#2D3A4A] rounded text-white focus:border-[#00C896] outline-none resize-none"
                />
              </div>

              <div className="flex justify-end gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => setCreateModalOpen(false)}
                  className="px-4 py-2 text-[#9CA3AF] hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={!newApp.job_id}
                  className="px-5 py-2 bg-[#00C896] text-[#0D1117] font-semibold rounded hover:bg-[#00b084] disabled:opacity-50"
                >
                  Track Application
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
