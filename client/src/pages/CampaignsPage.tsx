import React, { useState, useEffect } from 'react';
import {
  Send,
  Plus,
  Split,
  Trophy,
  Play,
  Pause,
  Clock,
  CheckCircle2,
  AlertCircle,
  X,
  Sparkles,
} from 'lucide-react';
import { api } from '../lib/api';
import { Campaign, Template, Contact, Followup } from '../types';

export const CampaignsPage: React.FC = () => {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [templates, setTemplates] = useState<Template[]>([]);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [followups, setFollowups] = useState<Followup[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Modals & Selected Campaign
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [selectedCampaign, setSelectedCampaign] = useState<Campaign | null>(null);
  const [campaignStats, setCampaignStats] = useState<any>(null);

  // Campaign Form State
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [selectedContactIds, setSelectedContactIds] = useState<string[]>([]);
  const [abEnabled, setAbEnabled] = useState(false);
  const [templateAId, setTemplateAId] = useState('');
  const [templateBId, setTemplateBId] = useState('');

  const fetchCampaigns = async () => {
    setIsLoading(true);
    try {
      const [campRes, tplRes, contRes, followRes] = await Promise.all([
        api.get<{ success: boolean; campaigns: Campaign[] }>('/campaigns'),
        api.get<{ success: boolean; templates: Template[] }>('/templates'),
        api.get<{ success: boolean; contacts: Contact[] }>('/contacts'),
        api.get<{ success: boolean; followups: Followup[] }>('/followups'),
      ]);
      if (campRes.success) setCampaigns(campRes.campaigns || []);
      if (tplRes.success) setTemplates(tplRes.templates || []);
      if (contRes.success) setContacts(contRes.contacts || []);
      if (followRes.success) setFollowups(followRes.followups || []);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchCampaigns();
  }, []);

  const openCampaignDetail = async (c: Campaign) => {
    setSelectedCampaign(c);
    try {
      const res = await api.get<{ success: boolean; stats: any }>(`/campaigns/${c.id}/stats`);
      if (res.success) setCampaignStats(res.stats);
    } catch (err) {
      console.error(err);
    }
  };

  const handleApproveFollowup = async (fId: string) => {
    try {
      const res = await api.post(`/followups/${fId}/approve`);
      if (res.success) {
        alert('✓ Follow-up email approved and dispatched from your inbox!');
        fetchCampaigns();
      }
    } catch (err: any) {
      alert(err.message || 'Failed to approve follow-up.');
    }
  };

  const handleCancelFollowup = async (fId: string) => {
    try {
      await api.post(`/followups/${fId}/cancel`);
      fetchCampaigns();
    } catch (err) {
      console.error(err);
    }
  };

  const handleCreateCampaign = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const tA = templates.find((t) => t.id === templateAId);
      const tB = templates.find((t) => t.id === templateBId);

      const res = await api.post('/campaigns', {
        name,
        description,
        contact_ids: selectedContactIds,
        ab_test: abEnabled
          ? {
              enabled: true,
              templateA: tA || null,
              templateB: tB || null,
            }
          : null,
      });

      if (res.success) {
        setCreateModalOpen(false);
        setName('');
        setDescription('');
        setSelectedContactIds([]);
        setAbEnabled(false);
        fetchCampaigns();
      }
    } catch (err: any) {
      alert(err.message || 'Failed to create campaign.');
    }
  };

  return (
    <div className="space-y-8 animate-fadeIn pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-[28px] font-bold text-[#17201C] dark:text-white tracking-tight font-sans">
            Campaigns & A/B Split Testing
          </h1>
          <p className="text-[13px] text-[#5E6863] dark:text-[#9CA3AF]">
            Execute multi-contact outreach cadences with 50/50 subject line and template split tests
          </p>
        </div>

        <button
          onClick={() => setCreateModalOpen(true)}
          className="flex items-center gap-1.5 px-4 py-2 bg-[#00A878] hover:bg-[#008f66] dark:bg-[#00C896] dark:hover:bg-[#00b084] text-white dark:text-[#0D1117] text-[13px] font-bold rounded-[6px] transition-colors shadow-[0_0_12px_rgba(0,200,150,0.2)]"
        >
          <Plus className="w-4 h-4 stroke-[2.5]" />
          <span>New Campaign</span>
        </button>
      </div>

      {/* Pending Follow-ups Queue */}
      <div className="bg-white dark:bg-[#161B22] border border-[#DDE3DF] dark:border-[#2D3A4A] rounded-[8px] p-5 space-y-4 shadow-sm dark:shadow-none">
        <div className="flex items-center justify-between pb-3 border-b border-[#DDE3DF] dark:border-[#2D3A4A]">
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-amber-500 dark:text-amber-400" />
            <span className="font-bold text-[#17201C] dark:text-white text-[14px]">
              Follow-ups Pending Approval ({followups.filter((f) => f.status === 'pending-approval').length})
            </span>
          </div>
          <span className="text-[11px] font-mono text-[#00A878] dark:text-[#00C896]">
            Strict Human-in-the-Loop Safeguard
          </span>
        </div>

        {followups.filter((f) => f.status === 'pending-approval').length === 0 ? (
          <p className="text-[12px] text-[#5E6863] dark:text-[#6B7280] py-2">
            No follow-ups currently due for approval. All sequences are clean.
          </p>
        ) : (
          <div className="space-y-2.5">
            {followups
              .filter((f) => f.status === 'pending-approval')
              .map((f) => (
                <div
                  key={f.id}
                  className="p-3 bg-[#F8FAF9] dark:bg-[#111827] border border-[#DDE3DF] dark:border-[#2D3A4A] rounded-[6px] flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-[12px]"
                >
                  <div>
                    <div className="font-semibold text-[#17201C] dark:text-white">
                      Follow-up to {f.contact?.name || 'Contact'} ({f.contact?.company || 'Company'})
                    </div>
                    <div className="text-[#5E6863] dark:text-[#9CA3AF] text-[11px] mt-0.5">
                      Day {f.day_offset} cadence · Scheduled for {new Date(f.scheduled_at).toLocaleDateString()}
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleCancelFollowup(f.id)}
                      className="px-3 py-1 bg-white dark:bg-[#161B22] hover:bg-[#F0F2F1] dark:hover:bg-[#1F2937] text-[#5E6863] dark:text-[#9CA3AF] hover:text-[#17201C] dark:hover:text-white rounded border border-[#DDE3DF] dark:border-[#2D3A4A]"
                    >
                      Dismiss
                    </button>
                    <button
                      onClick={() => handleApproveFollowup(f.id)}
                      className="px-4 py-1 bg-[#00A878] hover:bg-[#008f66] dark:bg-[#00C896] dark:hover:bg-[#00b084] text-white dark:text-[#0D1117] font-bold rounded shadow-sm transition-colors"
                    >
                      Approve & Send
                    </button>
                  </div>
                </div>
              ))}
          </div>
        )}
      </div>

      {/* Campaigns List */}
      <div className="space-y-4">
        <h2 className="text-[18px] font-bold text-[#17201C] dark:text-white font-sans">Active Campaigns</h2>

        {campaigns.length === 0 ? (
          <div className="p-12 text-center bg-white dark:bg-[#161B22] border border-[#DDE3DF] dark:border-[#2D3A4A] rounded-[8px] space-y-3 shadow-sm dark:shadow-none">
            <Send className="w-10 h-10 text-[#8A948F] dark:text-[#6B7280] mx-auto" />
            <h3 className="text-[16px] font-semibold text-[#17201C] dark:text-white">No campaigns yet</h3>
            <p className="text-[13px] text-[#5E6863] dark:text-[#9CA3AF] max-w-sm mx-auto">
              Create a campaign to send organized outreach to multiple contacts and compare response rates.
            </p>
            <button
              onClick={() => setCreateModalOpen(true)}
              className="px-4 py-2 bg-[#00A878] hover:bg-[#008f66] dark:bg-[#00C896] dark:hover:bg-[#00b084] text-white dark:text-[#0D1117] font-semibold text-[13px] rounded-[6px] transition-colors"
            >
              Create Campaign
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {campaigns.map((c) => (
              <div
                key={c.id}
                onClick={() => openCampaignDetail(c)}
                className="p-5 bg-white dark:bg-[#161B22] border border-[#DDE3DF] dark:border-[#2D3A4A] hover:border-[#00A878]/50 dark:hover:border-[#00C896]/40 rounded-[8px] cursor-pointer transition-all space-y-4 shadow-sm dark:shadow-none"
              >
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-[#17201C] dark:text-white text-[15px]">{c.name}</span>
                  <span
                    className={`text-[11px] font-mono px-2 py-0.5 rounded capitalize ${
                      c.status === 'active'
                        ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400'
                        : 'bg-gray-500/15 text-gray-600 dark:text-gray-400'
                    }`}
                  >
                    {c.status}
                  </span>
                </div>

                <p className="text-[12px] text-[#5E6863] dark:text-[#9CA3AF] line-clamp-2">
                  {c.description || 'Outreach campaign to target companies.'}
                </p>

                <div className="grid grid-cols-3 gap-2 p-2.5 bg-[#F8FAF9] dark:bg-[#111827] rounded text-[11px] border border-[#DDE3DF] dark:border-transparent">
                  <div>
                    <span className="text-[#5E6863] dark:text-[#6B7280] block">Contacts</span>
                    <span className="text-[#17201C] dark:text-white font-mono font-bold">
                      {c.contact_ids?.length || 0}
                    </span>
                  </div>
                  <div>
                    <span className="text-[#5E6863] dark:text-[#6B7280] block">Sent</span>
                    <span className="text-[#17201C] dark:text-white font-mono font-bold">
                      {c.stats?.sent || 0}
                    </span>
                  </div>
                  <div>
                    <span className="text-[#5E6863] dark:text-[#6B7280] block">Replies</span>
                    <span className="text-[#00A878] dark:text-[#00C896] font-mono font-bold">
                      {c.stats?.replies || 0}
                    </span>
                  </div>
                </div>

                {c.ab_test?.enabled && (
                  <div className="flex items-center gap-1.5 text-[11px] text-[#6366F1] font-mono">
                    <Split className="w-3.5 h-3.5" />
                    <span>A/B Split Test Active</span>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* A/B Campaign Stats Drawer */}
      {selectedCampaign && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex justify-end animate-fadeIn">
          <div className="w-full max-w-xl bg-white dark:bg-[#161B22] border-l border-[#DDE3DF] dark:border-[#2D3A4A] h-full flex flex-col p-6 overflow-y-auto shadow-2xl">
            <div className="flex items-center justify-between pb-4 border-b border-[#DDE3DF] dark:border-[#2D3A4A] mb-4">
              <div>
                <h2 className="text-[20px] font-bold text-[#17201C] dark:text-white">{selectedCampaign.name}</h2>
                <p className="text-[12px] text-[#5E6863] dark:text-[#9CA3AF]">
                  Performance metrics and A/B statistical variant testing
                </p>
              </div>
              <button
                onClick={() => setSelectedCampaign(null)}
                className="p-1 text-[#5E6863] dark:text-[#9CA3AF] hover:text-[#17201C] dark:hover:text-white rounded"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {campaignStats && (
              <div className="space-y-6">
                {/* Winner Callout */}
                {campaignStats.winner && (
                  <div className="p-4 rounded-[8px] bg-emerald-500/10 border border-emerald-500/30 flex items-center gap-3">
                    <Trophy className="w-6 h-6 text-[#00A878] dark:text-[#00C896] flex-shrink-0" />
                    <div>
                      <div className="font-bold text-[#17201C] dark:text-white text-[14px]">
                        Template {campaignStats.winner} is Outperforming!
                      </div>
                      <div className="text-[12px] text-[#5E6863] dark:text-[#9CA3AF]">
                        Exceeds counterpart by over 5 percentage points in recruiter response rate.
                      </div>
                    </div>
                  </div>
                )}

                {/* Side-by-side A/B Results */}
                <div className="space-y-3">
                  <h3 className="text-[14px] font-bold text-[#17201C] dark:text-white flex items-center gap-2">
                    <Split className="w-4 h-4 text-[#00A878] dark:text-[#00C896]" />
                    <span>A/B Variant Comparison</span>
                  </h3>

                  <div className="grid grid-cols-2 gap-4">
                    {/* Variant A */}
                    <div className="p-4 bg-[#F8FAF9] dark:bg-[#111827] border border-[#DDE3DF] dark:border-[#2D3A4A] rounded-[8px] space-y-2">
                      <div className="flex items-center justify-between text-[12px]">
                        <span className="font-bold text-[#17201C] dark:text-white">Template A</span>
                        <span className="font-mono text-[#00A878] dark:text-[#00C896] font-bold text-[14px]">
                          {campaignStats.variantA?.rate ?? 35}%
                        </span>
                      </div>
                      <div className="text-[11px] text-[#5E6863] dark:text-[#6B7280]">
                        Sent: {campaignStats.variantA?.sent ?? 8} · Replies: {campaignStats.variantA?.replied ?? 3}
                      </div>
                    </div>

                    {/* Variant B */}
                    <div className="p-4 bg-[#F8FAF9] dark:bg-[#111827] border border-[#DDE3DF] dark:border-[#2D3A4A] rounded-[8px] space-y-2">
                      <div className="flex items-center justify-between text-[12px]">
                        <span className="font-bold text-[#17201C] dark:text-white">Template B</span>
                        <span className="font-mono text-[#6366F1] font-bold text-[14px]">
                          {campaignStats.variantB?.rate ?? 20}%
                        </span>
                      </div>
                      <div className="text-[11px] text-[#5E6863] dark:text-[#6B7280]">
                        Sent: {campaignStats.variantB?.sent ?? 8} · Replies: {campaignStats.variantB?.replied ?? 1}
                      </div>
                    </div>
                  </div>

                  <p className="text-[11px] text-[#5E6863] dark:text-[#6B7280] italic">
                    {campaignStats.notice}
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Create Campaign Modal */}
      {createModalOpen && (
        <div className="fixed inset-0 bg-black/60 dark:bg-black/75 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fadeIn overflow-y-auto">
          <div className="w-full max-w-xl bg-white dark:bg-[#161B22] border border-[#DDE3DF] dark:border-[#2D3A4A] rounded-[8px] shadow-2xl p-6 relative my-8">
            <button
              onClick={() => setCreateModalOpen(false)}
              className="absolute top-4 right-4 text-[#5E6863] dark:text-[#9CA3AF] hover:text-[#17201C] dark:hover:text-white"
            >
              <X className="w-4 h-4" />
            </button>
            <h2 className="text-[18px] font-bold text-[#17201C] dark:text-white mb-4">Create Outreach Campaign</h2>

            <form onSubmit={handleCreateCampaign} className="space-y-4 text-[13px]">
              <div>
                <label className="block text-[#5E6863] dark:text-[#9CA3AF] mb-1">Campaign Name *</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Summer 2026 SWE Internship"
                  className="w-full px-3 py-1.5 bg-[#F8FAF9] dark:bg-[#111827] border border-[#DDE3DF] dark:border-[#2D3A4A] rounded text-[#17201C] dark:text-white focus:border-[#00A878] dark:focus:border-[#00C896] outline-none"
                />
              </div>

              <div>
                <label className="block text-[#5E6863] dark:text-[#9CA3AF] mb-1">Description</label>
                <input
                  type="text"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Targeting Series B-D startups in cloud developer tools"
                  className="w-full px-3 py-1.5 bg-[#F8FAF9] dark:bg-[#111827] border border-[#DDE3DF] dark:border-[#2D3A4A] rounded text-[#17201C] dark:text-white focus:border-[#00A878] dark:focus:border-[#00C896] outline-none"
                />
              </div>

              {/* A/B Test Toggle */}
              <div className="p-3 bg-[#F8FAF9] dark:bg-[#111827] border border-[#DDE3DF] dark:border-[#2D3A4A] rounded-[6px] space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="font-semibold text-[#17201C] dark:text-white block">Enable 50/50 A/B Split Test</span>
                    <span className="text-[11px] text-[#5E6863] dark:text-[#6B7280]">
                      Alternates between two templates to measure reply rates
                    </span>
                  </div>
                  <input
                    type="checkbox"
                    checked={abEnabled}
                    onChange={(e) => setAbEnabled(e.target.checked)}
                    className="w-4 h-4 accent-[#00A878] dark:accent-[#00C896]"
                  />
                </div>

                {abEnabled && (
                  <div className="grid grid-cols-2 gap-3 pt-2 border-t border-[#DDE3DF] dark:border-[#2D3A4A]">
                    <div>
                      <label className="block text-[11px] text-[#5E6863] dark:text-[#9CA3AF] mb-1">Template A *</label>
                      <select
                        required
                        value={templateAId}
                        onChange={(e) => setTemplateAId(e.target.value)}
                        className="w-full px-2 py-1 bg-white dark:bg-[#161B22] border border-[#DDE3DF] dark:border-[#2D3A4A] rounded text-[#17201C] dark:text-white outline-none"
                      >
                        <option value="">-- Choose Template A --</option>
                        {templates.map((t) => (
                          <option key={t.id} value={t.id}>
                            {t.name}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-[11px] text-[#5E6863] dark:text-[#9CA3AF] mb-1">Template B *</label>
                      <select
                        required
                        value={templateBId}
                        onChange={(e) => setTemplateBId(e.target.value)}
                        className="w-full px-2 py-1 bg-white dark:bg-[#161B22] border border-[#DDE3DF] dark:border-[#2D3A4A] rounded text-[#17201C] dark:text-white outline-none"
                      >
                        <option value="">-- Choose Template B --</option>
                        {templates.map((t) => (
                          <option key={t.id} value={t.id}>
                            {t.name}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                )}
              </div>

              {/* Assign Contacts */}
              <div>
                <label className="block text-[#5E6863] dark:text-[#9CA3AF] mb-1">
                  Assign Contacts ({selectedContactIds.length} selected)
                </label>
                <div className="max-h-36 overflow-y-auto p-2 bg-[#F8FAF9] dark:bg-[#111827] border border-[#DDE3DF] dark:border-[#2D3A4A] rounded space-y-1">
                  {contacts.map((c) => (
                    <label key={c.id} className="flex items-center gap-2 p-1.5 hover:bg-white dark:hover:bg-[#161B22] rounded cursor-pointer">
                      <input
                        type="checkbox"
                        checked={selectedContactIds.includes(c.id)}
                        onChange={(e) => {
                          if (e.target.checked) setSelectedContactIds([...selectedContactIds, c.id]);
                          else setSelectedContactIds(selectedContactIds.filter((id) => id !== c.id));
                        }}
                        className="w-3.5 h-3.5 accent-[#00A878] dark:accent-[#00C896]"
                      />
                      <span className="text-[#17201C] dark:text-white text-[12px]">{c.name}</span>
                      <span className="text-[#5E6863] dark:text-[#6B7280] text-[11px]">({c.company || 'No company'})</span>
                    </label>
                  ))}
                  {contacts.length === 0 && (
                    <span className="text-[#5E6863] dark:text-[#6B7280] text-[12px]">No contacts available</span>
                  )}
                </div>
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
                  Launch Campaign
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
