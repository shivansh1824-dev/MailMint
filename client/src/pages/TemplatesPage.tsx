import React, { useState, useEffect } from 'react';
import {
  FileText,
  Plus,
  Copy,
  Eye,
  Globe,
  Download,
  Share2,
  Search,
  Check,
  X,
  Sparkles,
} from 'lucide-react';
import { api } from '../lib/api';
import { Template } from '../types';
import { VariablePreviewModal } from '../components/common/VariablePreviewModal';

export const TemplatesPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'my' | 'marketplace'>('my');
  const [myTemplates, setMyTemplates] = useState<Template[]>([]);
  const [marketplaceTemplates, setMarketplaceTemplates] = useState<Template[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');

  // Modals
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [previewTemplate, setPreviewTemplate] = useState<Template | null>(null);
  const [publishModalOpen, setPublishModalOpen] = useState(false);
  const [targetTemplateToPublish, setTargetTemplateToPublish] = useState<Template | null>(null);
  const [authorAlias, setAuthorAlias] = useState('');

  // New template form
  const [newTemplate, setNewTemplate] = useState({
    name: '',
    category: 'recruiter',
    subject: '',
    body: '',
    language: 'en',
  });

  const fetchTemplates = async () => {
    setIsLoading(true);
    try {
      const [myRes, marketRes] = await Promise.all([
        api.get<{ success: boolean; templates: Template[] }>('/templates'),
        api.get<{ success: boolean; templates: Template[] }>('/templates/marketplace'),
      ]);
      if (myRes.success) setMyTemplates(myRes.templates || []);
      if (marketRes.success) setMarketplaceTemplates(marketRes.templates || []);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchTemplates();
  }, []);

  const handleCreateTemplate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await api.post('/templates', newTemplate);
      if (res.success) {
        setCreateModalOpen(false);
        setNewTemplate({ name: '', category: 'recruiter', subject: '', body: '', language: 'en' });
        fetchTemplates();
      }
    } catch (err: any) {
      alert(err.message || 'Failed to create template.');
    }
  };

  const handleDuplicate = async (id: string) => {
    try {
      await api.post(`/templates/${id}/duplicate`);
      fetchTemplates();
    } catch (err) {
      console.error(err);
    }
  };

  const handleImport = async (id: string) => {
    try {
      await api.post(`/templates/${id}/import`);
      alert('✓ Template imported into your personal library!');
      fetchTemplates();
    } catch (err) {
      console.error(err);
    }
  };

  const handlePublish = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!targetTemplateToPublish || !authorAlias) return;
    try {
      await api.post(`/templates/${targetTemplateToPublish.id}/publish`, { authorAlias });
      setPublishModalOpen(false);
      setAuthorAlias('');
      alert('✓ Template published to Marketplace anonymously!');
      fetchTemplates();
    } catch (err: any) {
      alert(err.message || 'Failed to publish template.');
    }
  };

  const handleUnpublish = async (id: string) => {
    try {
      await api.delete(`/templates/${id}`);
      fetchTemplates();
    } catch (err) {
      console.error(err);
    }
  };

  const currentList = activeTab === 'my' ? myTemplates : marketplaceTemplates;
  const filtered = currentList.filter(
    (t) =>
      t.name.toLowerCase().includes(search.toLowerCase()) ||
      t.subject.toLowerCase().includes(search.toLowerCase()) ||
      t.category.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6 animate-fadeIn pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-[28px] font-bold text-[#17201C] dark:text-white tracking-tight font-sans">
            Outreach Templates & Marketplace
          </h1>
          <p className="text-[13px] text-[#5E6863] dark:text-[#9CA3AF]">
            Reusable email frameworks with dynamic variable interpolation and community sharing
          </p>
        </div>

        <button
          onClick={() => setCreateModalOpen(true)}
          className="flex items-center gap-1.5 px-4 py-2 bg-[#00A878] hover:bg-[#008f66] dark:bg-[#00C896] dark:hover:bg-[#00b084] text-white dark:text-[#0D1117] text-[13px] font-bold rounded-[6px] transition-colors shadow-[0_0_12px_rgba(0,200,150,0.2)]"
        >
          <Plus className="w-4 h-4 stroke-[2.5]" />
          <span>Create Template</span>
        </button>
      </div>

      {/* Tabs & Search */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-[#DDE3DF] dark:border-[#2D3A4A]">
        <div className="flex items-center gap-4 text-[14px]">
          <button
            onClick={() => setActiveTab('my')}
            className={`pb-2.5 font-medium transition-colors ${
              activeTab === 'my'
                ? 'border-b-2 border-[#00A878] dark:border-[#00C896] text-[#17201C] dark:text-white font-semibold'
                : 'text-[#5E6863] dark:text-[#9CA3AF] hover:text-[#17201C] dark:hover:text-white'
            }`}
          >
            My Templates ({myTemplates.length})
          </button>
          <button
            onClick={() => setActiveTab('marketplace')}
            className={`pb-2.5 font-medium transition-colors flex items-center gap-1.5 ${
              activeTab === 'marketplace'
                ? 'border-b-2 border-[#00A878] dark:border-[#00C896] text-[#17201C] dark:text-white font-semibold'
                : 'text-[#5E6863] dark:text-[#9CA3AF] hover:text-[#17201C] dark:hover:text-white'
            }`}
          >
            <Globe className="w-3.5 h-3.5 text-[#00A878] dark:text-[#00C896]" />
            <span>Community Marketplace ({marketplaceTemplates.length})</span>
          </button>
        </div>

        <div className="relative max-w-xs w-full">
          <Search className="w-3.5 h-3.5 text-[#8A948F] dark:text-[#6B7280] absolute left-3 top-2.5" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search templates..."
            className="w-full pl-8 pr-3 py-1.5 bg-white dark:bg-[#161B22] border border-[#DDE3DF] dark:border-[#2D3A4A] rounded-[6px] text-[12px] text-[#17201C] dark:text-white placeholder-[#8A948F] dark:placeholder-[#6B7280] focus:border-[#00A878] dark:focus:border-[#00C896] outline-none"
          />
        </div>
      </div>

      {/* Templates Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.map((tpl) => (
          <div
            key={tpl.id}
            className="p-5 bg-white dark:bg-[#161B22] border border-[#DDE3DF] dark:border-[#2D3A4A] hover:border-[#00A878]/50 dark:hover:border-[#00C896]/40 rounded-[8px] flex flex-col justify-between space-y-4 transition-all shadow-sm dark:shadow-none"
          >
            <div>
              <div className="flex items-center justify-between gap-2 mb-2">
                <span className="text-[11px] font-mono uppercase px-2 py-0.5 rounded bg-[#F0FDF4] dark:bg-[#111827] text-[#00A878] dark:text-[#00C896] border border-[#00A878]/20 dark:border-[#00C896]/20">
                  {tpl.category}
                </span>
                {tpl.author_alias && (
                  <span className="text-[11px] text-[#5E6863] dark:text-[#6B7280] font-mono">
                    by @{tpl.author_alias}
                  </span>
                )}
              </div>

              <h3 className="text-[15px] font-bold text-[#17201C] dark:text-white mb-1.5">{tpl.name}</h3>
              <p className="text-[12px] font-semibold text-[#5E6863] dark:text-[#9CA3AF] mb-3 truncate">
                {tpl.subject}
              </p>
              <p className="text-[12px] text-[#5E6863] dark:text-[#6B7280] line-clamp-3 leading-relaxed font-serif">
                {tpl.body}
              </p>
            </div>

            <div className="pt-3 border-t border-[#DDE3DF] dark:border-[#2D3A4A]/60 flex items-center justify-between text-[12px]">
              <button
                onClick={() => setPreviewTemplate(tpl)}
                className="flex items-center gap-1 text-[#00A878] dark:text-[#00C896] hover:underline font-medium"
              >
                <Eye className="w-3.5 h-3.5" />
                <span>Preview with Data</span>
              </button>

              <div className="flex items-center gap-2">
                {activeTab === 'marketplace' ? (
                  <button
                    onClick={() => handleImport(tpl.id)}
                    className="flex items-center gap-1 px-2.5 py-1 bg-[#00A878]/15 dark:bg-[#00C896]/15 hover:bg-[#00A878] dark:hover:bg-[#00C896] text-[#00A878] dark:text-[#00C896] hover:text-white dark:hover:text-[#0D1117] font-semibold rounded text-[11px] transition-colors"
                  >
                    <Download className="w-3 h-3" />
                    <span>Import</span>
                  </button>
                ) : (
                  <>
                    <button
                      onClick={() => handleDuplicate(tpl.id)}
                      className="p-1.5 text-[#5E6863] dark:text-[#9CA3AF] hover:text-[#17201C] dark:hover:text-white rounded"
                      title="Duplicate Template"
                    >
                      <Copy className="w-3.5 h-3.5" />
                    </button>
                    {tpl.is_public ? (
                      <button
                        onClick={() => handleUnpublish(tpl.id)}
                        className="text-[11px] text-amber-600 dark:text-amber-400 hover:underline"
                      >
                        Unpublish
                      </button>
                    ) : (
                      <button
                        onClick={() => {
                          setTargetTemplateToPublish(tpl);
                          setPublishModalOpen(true);
                        }}
                        className="p-1.5 text-[#5E6863] dark:text-[#9CA3AF] hover:text-[#00A878] dark:hover:text-[#00C896] rounded"
                        title="Publish to Marketplace"
                      >
                        <Share2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Variable Preview Modal */}
      <VariablePreviewModal
        isOpen={Boolean(previewTemplate)}
        onClose={() => setPreviewTemplate(null)}
        template={previewTemplate}
      />

      {/* Publish to Marketplace Modal */}
      {publishModalOpen && (
        <div className="fixed inset-0 bg-black/60 dark:bg-black/75 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fadeIn">
          <div className="w-full max-w-md bg-white dark:bg-[#161B22] border border-[#DDE3DF] dark:border-[#2D3A4A] rounded-[8px] shadow-2xl p-6 relative">
            <button
              onClick={() => setPublishModalOpen(false)}
              className="absolute top-4 right-4 text-[#5E6863] dark:text-[#9CA3AF] hover:text-[#17201C] dark:hover:text-white"
            >
              <X className="w-4 h-4" />
            </button>
            <h2 className="text-[18px] font-bold text-[#17201C] dark:text-white mb-2">Publish to Marketplace</h2>
            <p className="text-[12px] text-[#5E6863] dark:text-[#9CA3AF] mb-4">
              Share your effective template with the MailMint community. Your email address remains private; you will be credited anonymously through an alias.
            </p>

            <form onSubmit={handlePublish} className="space-y-4">
              <div>
                <label className="block text-[12px] text-[#5E6863] dark:text-[#9CA3AF] mb-1">
                  Author Alias (Public Name) *
                </label>
                <input
                  type="text"
                  required
                  value={authorAlias}
                  onChange={(e) => setAuthorAlias(e.target.value)}
                  placeholder="e.g. StanfordHacker, CrimsonDev"
                  className="w-full px-3 py-2 bg-[#F8FAF9] dark:bg-[#111827] border border-[#DDE3DF] dark:border-[#2D3A4A] rounded text-[13px] text-[#17201C] dark:text-white focus:border-[#00A878] dark:focus:border-[#00C896] outline-none"
                />
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setPublishModalOpen(false)}
                  className="px-4 py-2 text-[13px] text-[#5E6863] dark:text-[#9CA3AF] hover:text-[#17201C] dark:hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-[#00A878] hover:bg-[#008f66] dark:bg-[#00C896] dark:hover:bg-[#00b084] text-white dark:text-[#0D1117] font-semibold text-[13px] rounded transition-colors"
                >
                  Publish Publicly
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Create Template Modal */}
      {createModalOpen && (
        <div className="fixed inset-0 bg-black/60 dark:bg-black/75 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fadeIn">
          <div className="w-full max-w-xl bg-white dark:bg-[#161B22] border border-[#DDE3DF] dark:border-[#2D3A4A] rounded-[8px] shadow-2xl p-6 relative">
            <button
              onClick={() => setCreateModalOpen(false)}
              className="absolute top-4 right-4 text-[#5E6863] dark:text-[#9CA3AF] hover:text-[#17201C] dark:hover:text-white"
            >
              <X className="w-4 h-4" />
            </button>
            <h2 className="text-[18px] font-bold text-[#17201C] dark:text-white mb-4">Create Email Template</h2>

            <form onSubmit={handleCreateTemplate} className="space-y-4 text-[13px]">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[#5E6863] dark:text-[#9CA3AF] mb-1">Template Name *</label>
                  <input
                    type="text"
                    required
                    value={newTemplate.name}
                    onChange={(e) => setNewTemplate({ ...newTemplate, name: e.target.value })}
                    placeholder="Internship Cold Outreach"
                    className="w-full px-3 py-1.5 bg-[#F8FAF9] dark:bg-[#111827] border border-[#DDE3DF] dark:border-[#2D3A4A] rounded text-[#17201C] dark:text-white focus:border-[#00A878] dark:focus:border-[#00C896] outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[#5E6863] dark:text-[#9CA3AF] mb-1">Category</label>
                  <select
                    value={newTemplate.category}
                    onChange={(e) => setNewTemplate({ ...newTemplate, category: e.target.value })}
                    className="w-full px-3 py-1.5 bg-[#F8FAF9] dark:bg-[#111827] border border-[#DDE3DF] dark:border-[#2D3A4A] rounded text-[#17201C] dark:text-white focus:border-[#00A878] dark:focus:border-[#00C896] outline-none"
                  >
                    <option value="internship">Internship</option>
                    <option value="full-time">Full-time</option>
                    <option value="referral">Referral</option>
                    <option value="recruiter">Recruiter</option>
                    <option value="hiring-manager">Hiring Manager</option>
                    <option value="follow-up">Follow-up</option>
                    <option value="networking">Networking</option>
                    <option value="alumni">Alumni</option>
                    <option value="thank-you">Thank You</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-[#5E6863] dark:text-[#9CA3AF] mb-1">Subject * (supports variables like {'{{company}}'})</label>
                <input
                  type="text"
                  required
                  value={newTemplate.subject}
                  onChange={(e) => setNewTemplate({ ...newTemplate, subject: e.target.value })}
                  placeholder="Passionate about {{company}} · {{candidateName}}"
                  className="w-full px-3 py-1.5 bg-[#F8FAF9] dark:bg-[#111827] border border-[#DDE3DF] dark:border-[#2D3A4A] rounded text-[#17201C] dark:text-white focus:border-[#00A878] dark:focus:border-[#00C896] outline-none"
                />
              </div>

              <div>
                <label className="block text-[#5E6863] dark:text-[#9CA3AF] mb-1">Body Text *</label>
                <textarea
                  rows={8}
                  required
                  value={newTemplate.body}
                  onChange={(e) => setNewTemplate({ ...newTemplate, body: e.target.value })}
                  placeholder="Hi {{firstName}},\n\nI’ve been following {{company}}..."
                  className="w-full p-3 bg-[#F8FAF9] dark:bg-[#111827] border border-[#DDE3DF] dark:border-[#2D3A4A] rounded text-[#17201C] dark:text-white focus:border-[#00A878] dark:focus:border-[#00C896] outline-none font-mono text-[12px] resize-none"
                />
              </div>

              <div className="flex justify-end gap-3 pt-2">
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
                  Save Template
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
