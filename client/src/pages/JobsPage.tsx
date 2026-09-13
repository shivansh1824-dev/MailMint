import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Briefcase,
  Plus,
  Link2,
  Sparkles,
  ExternalLink,
  Search,
  Check,
  AlertCircle,
  X,
  FileText,
} from 'lucide-react';
import { api } from '../lib/api';
import { Job, Company } from '../types';
import { TableSkeleton } from '../components/common/Skeleton';

export const JobsPage: React.FC = () => {
  const navigate = useNavigate();
  const [jobs, setJobs] = useState<Job[]>([]);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');

  // Modals
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [linkedInModalOpen, setLinkedInModalOpen] = useState(false);
  const [linkedInUrl, setLinkedInUrl] = useState('');
  const [linkedInLoading, setLinkedInLoading] = useState(false);
  const [linkedInNotice, setLinkedInNotice] = useState('');

  // Auto-summarize state
  const [isSummarizing, setIsSummarizing] = useState(false);
  const [summarizedData, setSummarizedData] = useState<any>(null);

  // New Job form
  const [newJob, setNewJob] = useState({
    company_id: '',
    company_name: '',
    title: '',
    url: '',
    description: '',
    location: 'Remote',
    employment_type: 'Full-time',
    skills: [] as string[],
  });

  const fetchJobs = async () => {
    setIsLoading(true);
    try {
      const [jobsRes, compsRes] = await Promise.all([
        api.get<{ success: boolean; jobs: Job[] }>('/jobs'),
        api.get<{ success: boolean; companies: Company[] }>('/companies'),
      ]);
      if (jobsRes.success) setJobs(jobsRes.jobs || []);
      if (compsRes.success) setCompanies(compsRes.companies || []);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchJobs();
  }, []);

  const handleAutoSummarize = async () => {
    if (!newJob.description || newJob.description.length < 50) return;
    setIsSummarizing(true);
    try {
      const compName = companies.find((c) => c.id === newJob.company_id)?.name;
      const res = await api.post('/jobs/analyze', {
        description: newJob.description,
        title: newJob.title,
        company: compName,
      });
      if (res.success) {
        setSummarizedData(res.analyzed);
      }
    } catch (err: any) {
      alert(err.message || 'Auto-summarization failed.');
    } finally {
      setIsSummarizing(false);
    }
  };

  const handleImportLinkedIn = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!linkedInUrl) return;

    setLinkedInLoading(true);
    setLinkedInNotice('');
    try {
      const res = await api.post('/jobs/import-linkedin', { url: linkedInUrl });
      if (res.success && res.extracted) {
        setNewJob({
          ...newJob,
          title: res.extracted.title || 'Software Engineer',
          location: res.extracted.location || 'Remote',
          employment_type: res.extracted.employment_type || 'Full-time',
          url: linkedInUrl,
        });
        setLinkedInModalOpen(false);
        setCreateModalOpen(true);
      } else if (res.fallbackRequired) {
        setLinkedInNotice(res.message);
      }
    } catch (err: any) {
      setLinkedInNotice(err.message || 'Import failed.');
    } finally {
      setLinkedInLoading(false);
    }
  };

  const handleCreateJob = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const payload = {
        ...newJob,
        analyzed_data: summarizedData || null,
        skills: summarizedData?.requiredSkills || newJob.skills,
      };

      const res = await api.post('/jobs', payload);
      if (res.success) {
        setCreateModalOpen(false);
        setSummarizedData(null);
        setNewJob({
          company_id: '',
          company_name: '',
          title: '',
          url: '',
          description: '',
          location: 'Remote',
          employment_type: 'Full-time',
          skills: [],
        });
        fetchJobs();
      }
    } catch (err: any) {
      alert(err.message || 'Failed to save job.');
    }
  };

  const filtered = jobs.filter((j) =>
    j.title.toLowerCase().includes(search.toLowerCase()) ||
    j.company?.name?.toLowerCase().includes(search.toLowerCase()) ||
    j.location?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6 animate-fadeIn pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-[28px] font-bold text-white tracking-tight font-sans">
            Saved Job Openings
          </h1>
          <p className="text-[13px] text-[#9CA3AF]">
            Maintain job descriptions, extract technical skill requirements, and ground email generation
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={() => setLinkedInModalOpen(true)}
            className="flex items-center gap-1.5 px-3 py-2 bg-[#161B22] border border-[#2D3A4A] hover:bg-[#1F2937] text-white text-[13px] font-medium rounded-[6px] transition-colors"
          >
            <Link2 className="w-4 h-4 text-[#00C896]" />
            <span>Import from LinkedIn</span>
          </button>

          <button
            onClick={() => setCreateModalOpen(true)}
            className="flex items-center gap-1.5 px-4 py-2 bg-[#00C896] hover:bg-[#00b084] text-[#0D1117] text-[13px] font-bold rounded-[6px] transition-colors shadow-[0_0_12px_rgba(0,200,150,0.2)]"
          >
            <Plus className="w-4 h-4 stroke-[2.5]" />
            <span>Add Job</span>
          </button>
        </div>
      </div>

      {/* Search */}
      <div className="relative max-w-sm">
        <Search className="w-4 h-4 text-[#6B7280] absolute left-3 top-2.5" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Filter jobs by title or company..."
          className="w-full pl-9 pr-3 py-1.5 bg-[#161B22] border border-[#2D3A4A] rounded-[6px] text-[13px] text-white placeholder-[#6B7280] focus:outline-none focus:border-[#00C896]"
        />
      </div>

      {/* Jobs Table */}
      {isLoading ? (
        <TableSkeleton rows={6} cols={6} />
      ) : filtered.length === 0 ? (
        <div className="p-16 text-center bg-[#161B22] border border-[#2D3A4A] rounded-[8px] space-y-3">
          <Briefcase className="w-10 h-10 text-[#6B7280] mx-auto" />
          <h3 className="text-[16px] font-semibold text-white">No jobs saved yet</h3>
          <p className="text-[13px] text-[#9CA3AF] max-w-sm mx-auto">
            Add a job description to give the AI better context for personalization.
          </p>
          <button
            onClick={() => setCreateModalOpen(true)}
            className="px-4 py-2 bg-[#00C896] text-[#0D1117] font-semibold text-[13px] rounded-[6px] hover:bg-[#00b084]"
          >
            Add First Job
          </button>
        </div>
      ) : (
        <div className="overflow-x-auto border border-[#2D3A4A] rounded-[8px] bg-[#161B22]">
          <table className="w-full text-left text-[13px]">
            <thead className="bg-[#111827] text-[#9CA3AF] border-b border-[#2D3A4A] font-medium">
              <tr>
                <th className="py-3 px-4">Role Title</th>
                <th className="py-3 px-4">Company</th>
                <th className="py-3 px-4">Location</th>
                <th className="py-3 px-4">Type</th>
                <th className="py-3 px-4">Skills Highlight</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#2D3A4A]/50">
              {filtered.map((job) => (
                <tr key={job.id} className="hover:bg-[#1F2937] transition-colors">
                  <td className="py-3.5 px-4 font-semibold text-white flex items-center gap-2">
                    <Briefcase className="w-4 h-4 text-[#00C896] flex-shrink-0" />
                    <span>{job.title}</span>
                  </td>
                  <td className="py-3.5 px-4 text-[#F0F0F0]">{job.company?.name || '—'}</td>
                  <td className="py-3.5 px-4 text-[#9CA3AF]">{job.location}</td>
                  <td className="py-3.5 px-4 text-[#9CA3AF]">{job.employment_type}</td>
                  <td className="py-3.5 px-4">
                    <div className="flex flex-wrap gap-1 max-w-xs">
                      {(job.skills || []).slice(0, 3).map((sk, idx) => (
                        <span
                          key={idx}
                          className="px-1.5 py-0.5 rounded bg-[#111827] text-[#00C896] text-[10px] font-mono border border-[#00C896]/20"
                        >
                          {sk}
                        </span>
                      ))}
                    </div>
                  </td>
                  <td className="py-3.5 px-4 text-right">
                    <button
                      onClick={() =>
                        navigate('/email-generator', {
                          state: { jobId: job.id, companyId: job.company_id },
                        })
                      }
                      className="px-2.5 py-1 text-[11px] font-semibold bg-[#00C896]/15 text-[#00C896] hover:bg-[#00C896] hover:text-[#0D1117] rounded transition-colors"
                    >
                      Draft Email
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Add Job Modal with Auto-Summarize */}
      {createModalOpen && (
        <div className="fixed inset-0 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fadeIn overflow-y-auto">
          <div className="w-full max-w-2xl bg-[#161B22] border border-[#2D3A4A] rounded-[8px] shadow-2xl p-6 relative my-8">
            <button
              onClick={() => setCreateModalOpen(false)}
              className="absolute top-4 right-4 text-[#9CA3AF] hover:text-white"
            >
              <X className="w-4 h-4" />
            </button>
            <h2 className="text-[18px] font-bold text-white mb-4">Add Target Job Posting</h2>

            <form onSubmit={handleCreateJob} className="space-y-4 text-[13px]">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[#9CA3AF] mb-1">Target Company</label>
                  <input
                    type="text"
                    value={newJob.company_name}
                    onChange={(e) => {
                      const val = e.target.value;
                      const matched = companies.find((c) => c.name.toLowerCase() === val.trim().toLowerCase());
                      setNewJob({
                        ...newJob,
                        company_name: val,
                        company_id: matched ? matched.id : '',
                      });
                    }}
                    placeholder="Enter company name (e.g. Stripe, Figma)"
                    list="jobs-company-datalist"
                    className="w-full px-3 py-2 bg-[#111827] border border-[#2D3A4A] rounded text-white placeholder-[#6B7280] focus:border-[#00C896] outline-none"
                  />
                  <datalist id="jobs-company-datalist">
                    {companies.map((c) => (
                      <option key={c.id} value={c.name} />
                    ))}
                  </datalist>
                </div>

                <div>
                  <label className="block text-[#9CA3AF] mb-1">Role Title *</label>
                  <input
                    type="text"
                    required
                    value={newJob.title}
                    onChange={(e) => setNewJob({ ...newJob, title: e.target.value })}
                    placeholder="e.g. Software Engineer Intern"
                    className="w-full px-3 py-2 bg-[#111827] border border-[#2D3A4A] rounded text-white focus:border-[#00C896] outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[#9CA3AF] mb-1">Location</label>
                  <input
                    type="text"
                    value={newJob.location}
                    onChange={(e) => setNewJob({ ...newJob, location: e.target.value })}
                    placeholder="San Francisco / Remote"
                    className="w-full px-3 py-2 bg-[#111827] border border-[#2D3A4A] rounded text-white focus:border-[#00C896] outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[#9CA3AF] mb-1">Employment Type</label>
                  <select
                    value={newJob.employment_type}
                    onChange={(e) => setNewJob({ ...newJob, employment_type: e.target.value })}
                    className="w-full px-3 py-2 bg-[#111827] border border-[#2D3A4A] rounded text-white focus:border-[#00C896] outline-none"
                  >
                    <option value="Full-time">Full-time</option>
                    <option value="Internship">Internship</option>
                    <option value="Contract">Contract</option>
                    <option value="Part-time">Part-time</option>
                  </select>
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-[#9CA3AF]">Job Description</label>
                  {newJob.description.length > 300 && (
                    <button
                      type="button"
                      disabled={isSummarizing}
                      onClick={handleAutoSummarize}
                      className="text-[11px] text-[#00C896] hover:underline font-mono flex items-center gap-1"
                    >
                      <Sparkles className="w-3.5 h-3.5" />
                      {isSummarizing ? 'Analyzing...' : 'Auto-Summarize JD (>500 chars)'}
                    </button>
                  )}
                </div>
                <textarea
                  rows={6}
                  value={newJob.description}
                  onChange={(e) => setNewJob({ ...newJob, description: e.target.value })}
                  placeholder="Paste complete or partial job description..."
                  className="w-full p-3 bg-[#111827] border border-[#2D3A4A] rounded text-white focus:border-[#00C896] outline-none resize-none font-mono text-[12px]"
                />
              </div>

              {/* Summarized Review UI */}
              {summarizedData && (
                <div className="p-4 bg-[#111827] border border-[#00C896]/30 rounded-[6px] space-y-3 animate-fadeIn">
                  <div className="flex items-center gap-2 text-[#00C896] font-semibold text-[12px]">
                    <Check className="w-4 h-4" />
                    <span>Analyzed Job Intelligence Preview (Confirm Before Save)</span>
                  </div>

                  <p className="text-[12px] text-[#9CA3AF] leading-relaxed">
                    {summarizedData.summary}
                  </p>

                  <div className="grid grid-cols-2 gap-2 text-[11px]">
                    <div>
                      <span className="text-[#6B7280] block font-mono">Required Skills</span>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {summarizedData.requiredSkills?.map((s: string, i: number) => (
                          <span key={i} className="px-1.5 py-0.5 rounded bg-[#161B22] text-[#00C896] border border-[#2D3A4A]">
                            {s}
                          </span>
                        ))}
                      </div>
                    </div>
                    <div>
                      <span className="text-[#6B7280] block font-mono">Seniority</span>
                      <span className="text-white font-medium">{summarizedData.seniority}</span>
                    </div>
                  </div>
                </div>
              )}

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setCreateModalOpen(false)}
                  className="px-4 py-2 text-[#9CA3AF] hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-[#00C896] text-[#0D1117] font-semibold rounded hover:bg-[#00b084]"
                >
                  Save Job
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* LinkedIn Import Modal */}
      {linkedInModalOpen && (
        <div className="fixed inset-0 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fadeIn">
          <div className="w-full max-w-md bg-[#161B22] border border-[#2D3A4A] rounded-[8px] shadow-2xl p-6 relative">
            <button
              onClick={() => setLinkedInModalOpen(false)}
              className="absolute top-4 right-4 text-[#9CA3AF] hover:text-white"
            >
              <X className="w-4 h-4" />
            </button>
            <h2 className="text-[18px] font-bold text-white mb-2">Import from LinkedIn Job</h2>
            <p className="text-[12px] text-[#9CA3AF] mb-4">
              Paste a public LinkedIn job URL to pre-fill title and role details.
            </p>

            {linkedInNotice && (
              <div className="p-3 mb-4 rounded-[6px] bg-amber-500/10 border border-amber-500/30 text-[12px] text-amber-300 flex items-start gap-2">
                <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5 text-amber-400" />
                <span>{linkedInNotice}</span>
              </div>
            )}

            <form onSubmit={handleImportLinkedIn} className="space-y-4">
              <input
                type="url"
                required
                value={linkedInUrl}
                onChange={(e) => setLinkedInUrl(e.target.value)}
                placeholder="https://www.linkedin.com/jobs/view/..."
                className="w-full px-3 py-2 bg-[#111827] border border-[#2D3A4A] rounded text-[13px] text-white focus:border-[#00C896] outline-none"
              />

              <div className="flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setLinkedInModalOpen(false)}
                  className="px-4 py-2 text-[13px] text-[#9CA3AF] hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={linkedInLoading}
                  className="px-5 py-2 bg-[#00C896] text-[#0D1117] font-semibold text-[13px] rounded hover:bg-[#00b084] disabled:opacity-50"
                >
                  {linkedInLoading ? 'Extracting...' : 'Fetch Public Posting'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
