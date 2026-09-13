import React, { useState, useEffect } from 'react';
import {
  Building2,
  Plus,
  ExternalLink,
  Search,
  Sparkles,
  Users,
  Briefcase,
  Globe,
  Copy,
  Check,
  X,
  TrendingUp,
} from 'lucide-react';
import { api } from '../lib/api';
import { Company, Contact, Job } from '../types';
import { TableSkeleton } from '../components/common/Skeleton';

export const CompaniesPage: React.FC = () => {
  const [companies, setCompanies] = useState<Company[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');

  // Modals & Drawer
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [selectedCompany, setSelectedCompany] = useState<Company | null>(null);
  const [companyContacts, setCompanyContacts] = useState<Contact[]>([]);
  const [companyJobs, setCompanyJobs] = useState<Job[]>([]);

  // Research State
  const [isResearching, setIsResearching] = useState(false);
  const [researchData, setResearchData] = useState<any>(null);
  const [copiedNotes, setCopiedNotes] = useState(false);

  // New Company form
  const [newCompany, setNewCompany] = useState({
    name: '',
    website: '',
    careers_url: '',
    industry: 'Software & Cloud Services',
    location: '',
    size: '100–500 employees',
    funding_stage: 'Growth / Venture',
    notes: '',
  });

  const fetchCompanies = async () => {
    setIsLoading(true);
    try {
      const res = await api.get<{ success: boolean; companies: Company[] }>('/companies');
      if (res.success) setCompanies(res.companies || []);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchCompanies();
  }, []);

  const openCompanyDetail = async (comp: Company) => {
    setSelectedCompany(comp);
    setResearchData(null);
    try {
      const res = await api.get<{ success: boolean; company: Company; contacts: Contact[]; jobs: Job[] }>(
        `/companies/${comp.id}`
      );
      if (res.success) {
        setCompanyContacts(res.contacts || []);
        setCompanyJobs(res.jobs || []);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleResearch = async () => {
    if (!selectedCompany) return;
    setIsResearching(true);
    try {
      const res = await api.get(`/companies/${selectedCompany.id}/research`);
      if (res.success) {
        setResearchData(res.research);
      }
    } catch (err: any) {
      alert(err.message || 'Research failed.');
    } finally {
      setIsResearching(false);
    }
  };

  const handleCopyToNotes = async () => {
    if (!selectedCompany || !researchData) return;
    const addedNote = `\n[AI Research Insights]:\nSize: ${researchData.estimatedSize}\nFunding: ${researchData.fundingStage}\nTech hints: ${researchData.technologies.join(', ')}`;
    try {
      await api.put(`/companies/${selectedCompany.id}`, {
        notes: (selectedCompany.notes || '') + addedNote,
      });
      setSelectedCompany({ ...selectedCompany, notes: (selectedCompany.notes || '') + addedNote });
      setCopiedNotes(true);
      setTimeout(() => setCopiedNotes(false), 2000);
    } catch (err) {
      console.error(err);
    }
  };

  const handleCreateCompany = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await api.post('/companies', newCompany);
      if (res.success) {
        setCreateModalOpen(false);
        setNewCompany({
          name: '',
          website: '',
          careers_url: '',
          industry: 'Software & Cloud Services',
          location: '',
          size: '100–500 employees',
          funding_stage: 'Growth / Venture',
          notes: '',
        });
        fetchCompanies();
      }
    } catch (err: any) {
      alert(err.message || 'Failed to create company.');
    }
  };

  const filtered = companies.filter((c) =>
    c.name.toLowerCase().includes(search.toLowerCase()) ||
    c.industry?.toLowerCase().includes(search.toLowerCase()) ||
    c.location?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6 animate-fadeIn pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-[28px] font-bold text-[#17201C] dark:text-white tracking-tight font-sans">
            Target Companies
          </h1>
          <p className="text-[13px] text-[#5E6863] dark:text-[#9CA3AF]">
            Research organizations, monitor hiring culture, and organize recruiter relationships
          </p>
        </div>

        <button
          onClick={() => setCreateModalOpen(true)}
          className="flex items-center gap-1.5 px-4 py-2 bg-[#00A878] hover:bg-[#008f66] dark:bg-[#00C896] dark:hover:bg-[#00b084] text-white dark:text-[#0D1117] text-[13px] font-bold rounded-[6px] transition-colors shadow-[0_0_12px_rgba(0,200,150,0.2)]"
        >
          <Plus className="w-4 h-4 stroke-[2.5]" />
          <span>Add Company</span>
        </button>
      </div>

      {/* Search Filter */}
      <div className="relative max-w-sm">
        <Search className="w-4 h-4 text-[#8A948F] dark:text-[#6B7280] absolute left-3 top-2.5" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Filter companies by name or industry..."
          className="w-full pl-9 pr-3 py-1.5 bg-white dark:bg-[#161B22] border border-[#DDE3DF] dark:border-[#2D3A4A] rounded-[6px] text-[13px] text-[#17201C] dark:text-white placeholder-[#8A948F] dark:placeholder-[#6B7280] focus:outline-none focus:border-[#00A878] dark:focus:border-[#00C896]"
        />
      </div>

      {/* Companies Table */}
      {isLoading ? (
        <TableSkeleton rows={6} cols={6} />
      ) : filtered.length === 0 ? (
        <div className="p-12 text-center bg-white dark:bg-[#161B22] border border-[#DDE3DF] dark:border-[#2D3A4A] rounded-[8px] space-y-3 shadow-sm dark:shadow-none">
          <Building2 className="w-10 h-10 text-[#8A948F] dark:text-[#6B7280] mx-auto" />
          <h3 className="text-[16px] font-semibold text-[#17201C] dark:text-white">No companies saved yet</h3>
          <p className="text-[13px] text-[#5E6863] dark:text-[#9CA3AF] max-w-sm mx-auto">
            Add target tech companies to unlock AI company research and link recruiter contacts.
          </p>
          <button
            onClick={() => setCreateModalOpen(true)}
            className="px-4 py-2 bg-[#00A878] hover:bg-[#008f66] dark:bg-[#00C896] dark:hover:bg-[#00b084] text-white dark:text-[#0D1117] font-semibold text-[13px] rounded-[6px] transition-colors"
          >
            Add Company
          </button>
        </div>
      ) : (
        <div className="overflow-x-auto border border-[#DDE3DF] dark:border-[#2D3A4A] rounded-[8px] bg-white dark:bg-[#161B22] shadow-sm dark:shadow-none">
          <table className="w-full text-left text-[13px]">
            <thead className="bg-[#F8FAF9] dark:bg-[#111827] text-[#5E6863] dark:text-[#9CA3AF] border-b border-[#DDE3DF] dark:border-[#2D3A4A] font-medium">
              <tr>
                <th className="py-3 px-4">Company Name</th>
                <th className="py-3 px-4">Industry</th>
                <th className="py-3 px-4">Location</th>
                <th className="py-3 px-4">Size</th>
                <th className="py-3 px-4 text-center">Contacts</th>
                <th className="py-3 px-4 text-center">Saved Jobs</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#DDE3DF] dark:divide-[#2D3A4A]/50">
              {filtered.map((comp) => (
                <tr
                  key={comp.id}
                  onClick={() => openCompanyDetail(comp)}
                  className="hover:bg-[#F0F2F1] dark:hover:bg-[#1F2937] transition-colors cursor-pointer"
                >
                  <td className="py-3.5 px-4 font-semibold text-[#17201C] dark:text-white flex items-center gap-2">
                    <Building2 className="w-4 h-4 text-[#00A878] dark:text-[#00C896] flex-shrink-0" />
                    <span>{comp.name}</span>
                  </td>
                  <td className="py-3.5 px-4 text-[#5E6863] dark:text-[#9CA3AF]">{comp.industry || 'Tech'}</td>
                  <td className="py-3.5 px-4 text-[#5E6863] dark:text-[#9CA3AF]">{comp.location || 'Remote'}</td>
                  <td className="py-3.5 px-4 text-[#5E6863] dark:text-[#9CA3AF] font-mono text-[12px]">
                    {comp.size || '—'}
                  </td>
                  <td className="py-3.5 px-4 text-center font-mono">
                    <span className="px-2 py-0.5 rounded bg-[#F8FAF9] dark:bg-[#111827] text-[#17201C] dark:text-white text-[12px] border border-[#DDE3DF] dark:border-transparent">
                      {comp.contacts_count || 0}
                    </span>
                  </td>
                  <td className="py-3.5 px-4 text-center font-mono">
                    <span className="px-2 py-0.5 rounded bg-[#F8FAF9] dark:bg-[#111827] text-[#17201C] dark:text-white text-[12px] border border-[#DDE3DF] dark:border-transparent">
                      {comp.jobs_count || 0}
                    </span>
                  </td>
                  <td className="py-3.5 px-4 text-right" onClick={(e) => e.stopPropagation()}>
                    <button
                      onClick={() => openCompanyDetail(comp)}
                      className="px-2.5 py-1 text-[11px] font-semibold bg-[#F8FAF9] dark:bg-[#111827] text-[#17201C] dark:text-white hover:bg-[#00A878] hover:text-white dark:hover:bg-[#00C896] dark:hover:text-[#0D1117] rounded border border-[#DDE3DF] dark:border-[#2D3A4A] transition-colors"
                    >
                      Research & Detail
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Company Detail & Research Drawer */}
      {selectedCompany && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex justify-end animate-fadeIn">
          <div className="w-full max-w-xl bg-white dark:bg-[#161B22] border-l border-[#DDE3DF] dark:border-[#2D3A4A] h-full flex flex-col p-6 overflow-y-auto shadow-2xl">
            <div className="flex items-center justify-between pb-4 border-b border-[#DDE3DF] dark:border-[#2D3A4A] mb-4">
              <div>
                <h2 className="text-[20px] font-bold text-[#17201C] dark:text-white flex items-center gap-2">
                  <Building2 className="w-5 h-5 text-[#00A878] dark:text-[#00C896]" />
                  {selectedCompany.name}
                </h2>
                <div className="flex items-center gap-3 text-[12px] text-[#5E6863] dark:text-[#9CA3AF] mt-1">
                  {selectedCompany.website && (
                    <a
                      href={selectedCompany.website.startsWith('http') ? selectedCompany.website : `https://${selectedCompany.website}`}
                      target="_blank"
                      rel="noreferrer"
                      className="hover:text-[#17201C] dark:hover:text-white flex items-center gap-1 text-[#00A878] dark:text-[#00C896]"
                    >
                      <Globe className="w-3.5 h-3.5" /> Website
                    </a>
                  )}
                  <span>{selectedCompany.industry}</span>
                </div>
              </div>
              <button
                onClick={() => setSelectedCompany(null)}
                className="p-1 text-[#5E6863] dark:text-[#9CA3AF] hover:text-[#17201C] dark:hover:text-white rounded"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* AI Company Research Card */}
            <div className="p-4 bg-[#F8FAF9] dark:bg-[#111827] border border-[#00A878]/30 dark:border-[#00C896]/30 rounded-[8px] space-y-3 mb-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-[#00A878] dark:text-[#00C896] font-semibold text-[13px]">
                  <Sparkles className="w-4 h-4" />
                  <span>AI Company Intelligence</span>
                </div>
                <button
                  type="button"
                  disabled={isResearching}
                  onClick={handleResearch}
                  className="px-3 py-1 bg-[#00A878] hover:bg-[#008f66] dark:bg-[#00C896] dark:hover:bg-[#00b084] text-white dark:text-[#0D1117] font-bold text-[12px] rounded disabled:opacity-50 transition-colors"
                >
                  {isResearching ? 'Searching...' : 'Research Company'}
                </button>
              </div>

              {researchData ? (
                <div className="space-y-3 pt-2 text-[12px] animate-fadeIn">
                  <div className="grid grid-cols-2 gap-2 p-2.5 bg-white dark:bg-[#161B22] rounded border border-[#DDE3DF] dark:border-[#2D3A4A]">
                    <div>
                      <span className="text-[#5E6863] dark:text-[#6B7280] block text-[11px]">Estimated Size</span>
                      <span className="text-[#17201C] dark:text-white font-medium">{researchData.estimatedSize}</span>
                    </div>
                    <div>
                      <span className="text-[#5E6863] dark:text-[#6B7280] block text-[11px]">Funding Stage</span>
                      <span className="text-[#17201C] dark:text-white font-medium">{researchData.fundingStage}</span>
                    </div>
                  </div>

                  <p className="text-[#5E6863] dark:text-[#9CA3AF] leading-relaxed">
                    {researchData.summary}
                  </p>

                  {/* Recent News */}
                  {researchData.recentNews?.length > 0 && (
                    <div className="space-y-1.5 pt-1">
                      <span className="text-[11px] font-mono uppercase text-[#00A878] dark:text-[#00C896]">Recent News</span>
                      {researchData.recentNews.map((news: any, idx: number) => (
                        <div key={idx} className="p-2 bg-white dark:bg-[#161B22] rounded text-[11px] text-[#17201C] dark:text-[#F0F0F0] border border-[#DDE3DF] dark:border-transparent">
                          <div className="font-semibold text-[#17201C] dark:text-white">{news.title}</div>
                          <div className="text-[#5E6863] dark:text-[#6B7280] font-mono text-[10px] mt-0.5">
                            {news.date} · {news.source}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  <div className="flex items-center justify-between pt-2 border-t border-[#DDE3DF] dark:border-[#2D3A4A]">
                    <span className="text-[10px] font-mono text-[#F59E0B]">
                      {researchData.disclaimer}
                    </span>
                    <button
                      onClick={handleCopyToNotes}
                      className="flex items-center gap-1 text-[11px] text-[#00A878] dark:text-[#00C896] hover:underline"
                    >
                      {copiedNotes ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                      <span>Copy to Company Notes</span>
                    </button>
                  </div>
                </div>
              ) : (
                <p className="text-[12px] text-[#5E6863] dark:text-[#9CA3AF]">
                  Click "Research Company" to extract estimated size, public news, funding stage, and technology stack hints.
                </p>
              )}
            </div>

            {/* Linked Contacts */}
            <div className="space-y-3 mb-6">
              <h3 className="text-[14px] font-bold text-[#17201C] dark:text-white flex items-center gap-2">
                <Users className="w-4 h-4 text-[#00A878] dark:text-[#00C896]" />
                <span>Associated Contacts ({companyContacts.length})</span>
              </h3>
              <div className="space-y-2">
                {companyContacts.map((c) => (
                  <div
                    key={c.id}
                    className="p-3 bg-[#F8FAF9] dark:bg-[#111827] border border-[#DDE3DF] dark:border-[#2D3A4A] rounded-[6px] flex items-center justify-between text-[12px]"
                  >
                    <div>
                      <div className="font-medium text-[#17201C] dark:text-white">{c.name}</div>
                      <div className="text-[#5E6863] dark:text-[#6B7280]">{c.job_title}</div>
                    </div>
                    <span className="text-[#5E6863] dark:text-[#9CA3AF] font-mono text-[11px]">{c.email}</span>
                  </div>
                ))}
                {companyContacts.length === 0 && (
                  <div className="text-center py-4 text-[12px] text-[#5E6863] dark:text-[#6B7280]">
                    No contacts linked to {selectedCompany.name} yet.
                  </div>
                )}
              </div>
            </div>

            {/* Linked Jobs */}
            <div className="space-y-3">
              <h3 className="text-[14px] font-bold text-[#17201C] dark:text-white flex items-center gap-2">
                <Briefcase className="w-4 h-4 text-[#00A878] dark:text-[#00C896]" />
                <span>Associated Jobs ({companyJobs.length})</span>
              </h3>
              <div className="space-y-2">
                {companyJobs.map((j) => (
                  <div
                    key={j.id}
                    className="p-3 bg-[#F8FAF9] dark:bg-[#111827] border border-[#DDE3DF] dark:border-[#2D3A4A] rounded-[6px] text-[12px]"
                  >
                    <div className="font-medium text-[#17201C] dark:text-white">{j.title}</div>
                    <div className="text-[#5E6863] dark:text-[#6B7280]">{j.location} · {j.employment_type}</div>
                  </div>
                ))}
                {companyJobs.length === 0 && (
                  <div className="text-center py-4 text-[12px] text-[#5E6863] dark:text-[#6B7280]">
                    No jobs saved for this company yet.
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Add Company Modal */}
      {createModalOpen && (
        <div className="fixed inset-0 bg-black/60 dark:bg-black/75 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fadeIn">
          <div className="w-full max-w-lg bg-white dark:bg-[#161B22] border border-[#DDE3DF] dark:border-[#2D3A4A] rounded-[8px] shadow-2xl p-6 relative">
            <button
              onClick={() => setCreateModalOpen(false)}
              className="absolute top-4 right-4 text-[#5E6863] dark:text-[#9CA3AF] hover:text-[#17201C] dark:hover:text-white"
            >
              <X className="w-4 h-4" />
            </button>
            <h2 className="text-[18px] font-bold text-[#17201C] dark:text-white mb-4">Add Target Company</h2>

            <form onSubmit={handleCreateCompany} className="space-y-3 text-[13px]">
              <div>
                <label className="block text-[#5E6863] dark:text-[#9CA3AF] mb-1">Company Name *</label>
                <input
                  type="text"
                  required
                  value={newCompany.name}
                  onChange={(e) => setNewCompany({ ...newCompany, name: e.target.value })}
                  placeholder="e.g. Stripe, Linear, Supabase"
                  className="w-full px-3 py-1.5 bg-[#F8FAF9] dark:bg-[#111827] border border-[#DDE3DF] dark:border-[#2D3A4A] rounded text-[#17201C] dark:text-white focus:border-[#00A878] dark:focus:border-[#00C896] outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[#5E6863] dark:text-[#9CA3AF] mb-1">Website URL</label>
                  <input
                    type="text"
                    value={newCompany.website}
                    onChange={(e) => setNewCompany({ ...newCompany, website: e.target.value })}
                    placeholder="https://company.com"
                    className="w-full px-3 py-1.5 bg-[#F8FAF9] dark:bg-[#111827] border border-[#DDE3DF] dark:border-[#2D3A4A] rounded text-[#17201C] dark:text-white focus:border-[#00A878] dark:focus:border-[#00C896] outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[#5E6863] dark:text-[#9CA3AF] mb-1">Location</label>
                  <input
                    type="text"
                    value={newCompany.location}
                    onChange={(e) => setNewCompany({ ...newCompany, location: e.target.value })}
                    placeholder="San Francisco / Remote"
                    className="w-full px-3 py-1.5 bg-[#F8FAF9] dark:bg-[#111827] border border-[#DDE3DF] dark:border-[#2D3A4A] rounded text-[#17201C] dark:text-white focus:border-[#00A878] dark:focus:border-[#00C896] outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[#5E6863] dark:text-[#9CA3AF] mb-1">Industry</label>
                  <input
                    type="text"
                    value={newCompany.industry}
                    onChange={(e) => setNewCompany({ ...newCompany, industry: e.target.value })}
                    className="w-full px-3 py-1.5 bg-[#F8FAF9] dark:bg-[#111827] border border-[#DDE3DF] dark:border-[#2D3A4A] rounded text-[#17201C] dark:text-white focus:border-[#00A878] dark:focus:border-[#00C896] outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[#5E6863] dark:text-[#9CA3AF] mb-1">Estimated Size</label>
                  <input
                    type="text"
                    value={newCompany.size}
                    onChange={(e) => setNewCompany({ ...newCompany, size: e.target.value })}
                    className="w-full px-3 py-1.5 bg-[#F8FAF9] dark:bg-[#111827] border border-[#DDE3DF] dark:border-[#2D3A4A] rounded text-[#17201C] dark:text-white focus:border-[#00A878] dark:focus:border-[#00C896] outline-none"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => setCreateModalOpen(false)}
                  className="px-4 py-2 text-[#5E6863] dark:text-[#9CA3AF] hover:text-[#17201C] dark:hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-[#00A878] hover:bg-[#008f66] dark:bg-[#00C896] dark:hover:bg-[#00b084] text-white dark:text-[#0D1117] font-semibold rounded transition-colors"
                >
                  Save Company
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
