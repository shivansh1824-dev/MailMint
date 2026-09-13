import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Users,
  Search,
  Plus,
  Upload,
  Download,
  Trash2,
  Moon,
  Clock,
  ExternalLink,
  MessageSquare,
  FileText,
  Copy,
  Check,
  X,
  LayoutList,
  Kanban,
  Sparkles,
  ChevronRight,
} from 'lucide-react';
import { api } from '../lib/api';
import { Contact, ContactTimelineItem, Email } from '../types';
import { StatusBadge } from '../components/common/Badge';
import { TableSkeleton } from '../components/common/Skeleton';
import { SnoozeModal } from '../components/common/SnoozeModal';
import { CsvImportModal } from '../components/common/CsvImportModal';
import { Avatar } from '../components/common/Avatar';
import { CompanyLogo } from '../components/common/CompanyLogo';
import { EmptyState } from '../components/common/EmptyState';

export const ContactsPage: React.FC = () => {
  const navigate = useNavigate();
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [viewMode, setViewMode] = useState<'table' | 'kanban'>('table');

  // Filters & Search
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  // Modals & Drawers
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [csvModalOpen, setCsvModalOpen] = useState(false);
  const [snoozeModalOpen, setSnoozeModalOpen] = useState(false);
  const [activeContactForSnooze, setActiveContactForSnooze] = useState<Contact | null>(null);

  // Sentiment Sync Modal State (Feature 4)
  const [syncModalOpen, setSyncModalOpen] = useState(false);
  const [syncContact, setSyncContact] = useState<Contact | null>(null);
  const [syncReplyText, setSyncReplyText] = useState('');
  const [isSyncing, setIsSyncing] = useState(false);
  const [sentimentResult, setSentimentResult] = useState<any>(null);

  // Detail Right Drawer
  const [drawerContact, setDrawerContact] = useState<Contact | null>(null);
  const [drawerTab, setDrawerTab] = useState<'history' | 'linkedin' | 'timeline'>('timeline');
  const [drawerTimeline, setDrawerTimeline] = useState<ContactTimelineItem[]>([]);
  const [drawerEmails, setDrawerEmails] = useState<Email[]>([]);
  const [newNote, setNewNote] = useState('');

  // LinkedIn Message Generator state
  const [linkedInMsg, setLinkedInMsg] = useState('');
  const [isGeneratingLinkedIn, setIsGeneratingLinkedIn] = useState(false);
  const [copiedLinkedIn, setCopiedLinkedIn] = useState(false);

  // Add Contact Form
  const [newContact, setNewContact] = useState({
    name: '',
    company: '',
    job_title: '',
    email: '',
    linkedin_url: '',
    source: 'manual',
    notes: '',
  });

  const fetchContacts = async () => {
    setIsLoading(true);
    try {
      const res = await api.get<{ success: boolean; contacts: Contact[] }>(
        `/contacts?status=${statusFilter}&search=${encodeURIComponent(search)}&includeSnoozed=${statusFilter === 'snoozed' ? 'true' : 'false'}`
      );
      if (res.success) setContacts(res.contacts || []);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(fetchContacts, 300); // 300ms debounce
    return () => clearTimeout(timer);
  }, [search, statusFilter]);

  const openDrawer = async (contact: Contact) => {
    setDrawerContact(contact);
    try {
      const res = await api.get<{ success: boolean; contact: Contact; timeline: ContactTimelineItem[]; emails: Email[] }>(
        `/contacts/${contact.id}`
      );
      if (res.success) {
        setDrawerTimeline(res.timeline || []);
        setDrawerEmails(res.emails || []);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleAddNote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newNote || !drawerContact) return;
    try {
      const res = await api.post(`/contacts/${drawerContact.id}/timeline`, {
        description: newNote,
      });
      if (res.success) {
        setDrawerTimeline([res.entry, ...drawerTimeline]);
        setNewNote('');
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleGenerateLinkedIn = async () => {
    if (!drawerContact) return;
    setIsGeneratingLinkedIn(true);
    try {
      const res = await api.post('/ai/generate-linkedin-message', {
        contactName: drawerContact.name,
        company: drawerContact.company || 'your company',
        roleTitle: drawerContact.job_title || 'Software Engineering',
        candidateName: 'Candidate',
      });
      if (res.success) {
        setLinkedInMsg(res.message);
      }
    } catch (err: any) {
      alert(err.message || 'Failed to generate message.');
    } finally {
      setIsGeneratingLinkedIn(false);
    }
  };

  const handleCreateContact = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await api.post('/contacts', newContact);
      if (res.success) {
        setAddModalOpen(false);
        setNewContact({ name: '', company: '', job_title: '', email: '', linkedin_url: '', source: 'manual', notes: '' });
        fetchContacts();
      }
    } catch (err: any) {
      alert(err.message || 'Failed to add contact.');
    }
  };

  const handleBulkAction = async (action: string, payload?: any) => {
    if (selectedIds.length === 0) return;
    if (action === 'delete') {
      if (!confirm(`Are you sure you want to delete ${selectedIds.length} contact(s)?`)) return;
    }

    try {
      await api.post('/contacts/bulk-action', {
        ids: selectedIds,
        action,
        payload,
      });
      setSelectedIds([]);
      fetchContacts();
    } catch (err) {
      console.error(err);
    }
  };

  const handleExportCsv = () => {
    const selected = contacts.filter((c) => selectedIds.includes(c.id));
    const toExport = selected.length > 0 ? selected : contacts;
    const header = 'Name,Company,Role,Email,Status,LinkedIn,Source\n';
    const rows = toExport
      .map(
        (c) =>
          `"${c.name}","${c.company || ''}","${c.job_title || ''}","${c.email || ''}","${c.status}","${c.linkedin_url || ''}","${c.source}"`
      )
      .join('\n');

    const blob = new Blob([header + rows], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `mailmint_contacts_${Date.now()}.csv`;
    a.click();
  };

  const handleSyncSentiment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!syncContact || !syncReplyText.trim()) return;

    setIsSyncing(true);
    try {
      const res = await api.post<any>('/emails/sync/sentiment-sync', {
        contactId: syncContact.id,
        replyText: syncReplyText,
      });

      if (res.success && res.analysis) {
        setSentimentResult(res.analysis);
        fetchContacts();
        if (drawerContact && drawerContact.id === syncContact.id) {
          openDrawer({
            ...drawerContact,
            status: res.contact?.status || drawerContact.status,
            sentiment: res.analysis.sentiment,
            sentiment_label: res.analysis.sentimentLabel,
          });
        }
      }
    } catch (err: any) {
      alert(err.message || 'Failed to sync sentiment.');
    } finally {
      setIsSyncing(false);
    }
  };

  // Kanban buckets
  const kanbanColumns = ['new', 'draft', 'sent', 'replied', 'closed'] as const;

  return (
    <div className="space-y-6 animate-fadeIn pb-12">
      {/* Header & Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-[28px] font-bold text-white tracking-tight font-sans">
            Contacts Management
          </h1>
          <p className="text-[13px] text-[#9CA3AF]">
            Track recruiter connections, communication histories, and follow-up schedules
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={() => setCsvModalOpen(true)}
            className="flex items-center gap-1.5 px-3 py-2 bg-[#161B22] border border-[#2D3A4A] hover:bg-[#1F2937] text-white text-[13px] font-medium rounded-[6px] transition-colors"
          >
            <Upload className="w-4 h-4 text-[#00C896]" />
            <span>Import CSV</span>
          </button>

          <button
            onClick={() => setAddModalOpen(true)}
            className="flex items-center gap-1.5 px-4 py-2 bg-[#00C896] hover:bg-[#00b084] text-[#0D1117] text-[13px] font-bold rounded-[6px] transition-colors shadow-[0_0_12px_rgba(0,200,150,0.2)]"
          >
            <Plus className="w-4 h-4 stroke-[2.5]" />
            <span>Add Contact</span>
          </button>
        </div>
      </div>

      {/* Filter Bar & Search */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 bg-[#161B22] p-3 rounded-[8px] border border-[#2D3A4A]">
        {/* Search */}
        <div className="relative flex-1 max-w-sm">
          <Search className="w-4 h-4 text-[#6B7280] absolute left-3 top-2.5" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name, company, role..."
            className="w-full pl-9 pr-3 py-1.5 bg-[#111827] border border-[#2D3A4A] rounded-[6px] text-[13px] text-white placeholder-[#6B7280] focus:outline-none focus:border-[#00C896]"
          />
        </div>

        {/* Status Filters */}
        <div className="flex items-center gap-1 overflow-x-auto text-[12px]">
          {['all', 'new', 'draft', 'sent', 'replied', 'follow-up', 'closed', 'snoozed'].map(
            (status) => (
              <button
                key={status}
                onClick={() => setStatusFilter(status)}
                className={`px-2.5 py-1 rounded-[4px] capitalize transition-colors ${
                  statusFilter === status
                    ? 'bg-[#00C896] text-[#0D1117] font-semibold'
                    : 'text-[#9CA3AF] hover:text-white hover:bg-[#1F2937]'
                }`}
              >
                {status}
              </button>
            )
          )}
        </div>

        {/* View Toggle */}
        <div className="flex items-center gap-1 bg-[#111827] p-1 rounded-[6px] border border-[#2D3A4A]">
          <button
            onClick={() => setViewMode('table')}
            className={`p-1.5 rounded transition-colors ${
              viewMode === 'table' ? 'bg-[#1F2937] text-[#00C896]' : 'text-[#6B7280] hover:text-white'
            }`}
            title="Table View"
          >
            <LayoutList className="w-4 h-4" />
          </button>
          <button
            onClick={() => setViewMode('kanban')}
            className={`p-1.5 rounded transition-colors ${
              viewMode === 'kanban' ? 'bg-[#1F2937] text-[#00C896]' : 'text-[#6B7280] hover:text-white'
            }`}
            title="Kanban View"
          >
            <Kanban className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Bulk Action Bar */}
      {selectedIds.length > 0 && (
        <div className="p-3 bg-[#111827] border border-[#00C896]/30 rounded-[8px] flex items-center justify-between text-[13px] animate-fadeIn">
          <span className="text-white font-medium">
            {selectedIds.length} contact{selectedIds.length > 1 ? 's' : ''} selected
          </span>
          <div className="flex items-center gap-2">
            <button
              onClick={() => handleBulkAction('snooze')}
              className="px-2.5 py-1 bg-[#161B22] text-[#F59E0B] border border-[#2D3A4A] rounded hover:bg-[#1F2937] flex items-center gap-1"
            >
              <Moon className="w-3.5 h-3.5" /> Snooze
            </button>
            <button
              onClick={handleExportCsv}
              className="px-2.5 py-1 bg-[#161B22] text-white border border-[#2D3A4A] rounded hover:bg-[#1F2937] flex items-center gap-1"
            >
              <Download className="w-3.5 h-3.5" /> Export
            </button>
            <button
              onClick={() => handleBulkAction('delete')}
              className="px-2.5 py-1 bg-red-500/10 text-red-400 border border-red-500/20 rounded hover:bg-red-500/20 flex items-center gap-1"
            >
              <Trash2 className="w-3.5 h-3.5" /> Delete
            </button>
          </div>
        </div>
      )}

      {/* Main View: Table vs Kanban */}
      {isLoading ? (
        <TableSkeleton rows={8} cols={6} />
      ) : contacts.length === 0 ? (
        <EmptyState
          type="contacts"
          title="Your recruiter pipeline is empty"
          description="Add a recruiter manually, clip them with the MailMint Chrome extension, or import a CSV to start authentic outreach."
          actionLabel="Add First Contact"
          onAction={() => setAddModalOpen(true)}
        />
      ) : viewMode === 'table' ? (
        <div className="overflow-x-auto border border-[#DDE3DF] dark:border-[#2D3A4A] rounded-[8px] bg-white dark:bg-[#161B22] shadow-sm">
          <table className="w-full text-left text-[13px]">
            <thead className="bg-[#F1F4F2] dark:bg-[#111827] text-[#5E6863] dark:text-[#9CA3AF] border-b border-[#DDE3DF] dark:border-[#2D3A4A] font-medium">
              <tr>
                <th className="py-3 px-3 w-8">
                  <input
                    type="checkbox"
                    checked={selectedIds.length === contacts.length && contacts.length > 0}
                    onChange={(e) => {
                      if (e.target.checked) setSelectedIds(contacts.map((c) => c.id));
                      else setSelectedIds([]);
                    }}
                    className="w-4 h-4 accent-[#00A878] dark:accent-[#00C896] rounded"
                  />
                </th>
                <th className="py-3 px-4">Recruiter / Contact</th>
                <th className="py-3 px-4">Company</th>
                <th className="py-3 px-4">Status & Sentiment</th>
                <th className="py-3 px-4">Email</th>
                <th className="py-3 px-4">Last Contacted</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#DDE3DF]/60 dark:divide-[#2D3A4A]/50">
              {contacts.map((contact) => (
                <tr
                  key={contact.id}
                  className="hover:bg-[#F7F8F6] dark:hover:bg-[#1F2937] transition-colors cursor-pointer group"
                  onClick={() => openDrawer(contact)}
                >
                  <td className="py-3 px-3" onClick={(e) => e.stopPropagation()}>
                    <input
                      type="checkbox"
                      checked={selectedIds.includes(contact.id)}
                      onChange={(e) => {
                        if (e.target.checked) setSelectedIds([...selectedIds, contact.id]);
                        else setSelectedIds(selectedIds.filter((id) => id !== contact.id));
                      }}
                      className="w-4 h-4 accent-[#00A878] dark:accent-[#00C896] rounded"
                    />
                  </td>
                  <td className="py-3.5 px-4 font-medium text-[#17201C] dark:text-white flex items-center gap-2.5">
                    <Avatar name={contact.name} size="sm" />
                    <div>
                      <div className="text-[#17201C] dark:text-white font-semibold">{contact.name}</div>
                      {contact.job_title && (
                        <div className="text-[11px] text-[#5E6863] dark:text-[#87918C]">{contact.job_title}</div>
                      )}
                    </div>
                  </td>
                  <td className="py-3.5 px-4 text-[#17201C] dark:text-[#F0F0F0]">
                    <div className="flex items-center gap-2">
                      {contact.company && <CompanyLogo name={contact.company} size="xs" />}
                      <span>{contact.company || '—'}</span>
                    </div>
                  </td>
                  <td className="py-3.5 px-4">
                    <div className="flex flex-col gap-1 items-start">
                      <StatusBadge status={contact.status} />
                      {contact.sentiment_label && (
                        <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-[#00A878]/15 dark:bg-[#00C896]/20 text-[#00A878] dark:text-[#00C896] border border-[#00A878]/30 dark:border-[#00C896]/30">
                          {contact.sentiment_label}
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="py-3.5 px-4 text-[#5E6863] dark:text-[#9CA3AF] font-mono text-[12px]">
                    {contact.email || '—'}
                  </td>
                  <td className="py-3.5 px-4 text-[#5E6863] dark:text-[#9CA3AF] text-[12px]">
                    {contact.last_contacted
                      ? new Date(contact.last_contacted).toLocaleDateString()
                      : 'Never'}
                  </td>
                  <td className="py-3.5 px-4 text-right" onClick={(e) => e.stopPropagation()}>
                    <div className="flex items-center justify-end gap-1.5">
                      <button
                        onClick={() => {
                          setSyncContact(contact);
                          setSentimentResult(null);
                          setSyncReplyText('');
                          setSyncModalOpen(true);
                        }}
                        className="p-1.5 text-[#5E6863] dark:text-[#9CA3AF] hover:text-[#00A878] dark:hover:text-[#00C896] hover:bg-[#F1F4F2] dark:hover:bg-[#1F2937] rounded transition-colors"
                        title="Sync Recruiter Reply & Sentiment (Feature 4)"
                      >
                        <Sparkles className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => {
                          setActiveContactForSnooze(contact);
                          setSnoozeModalOpen(true);
                        }}
                        className="p-1.5 text-[#5E6863] dark:text-[#9CA3AF] hover:text-[#F59E0B] hover:bg-[#F1F4F2] dark:hover:bg-[#1F2937] rounded transition-colors"
                        title="Snooze Contact"
                      >
                        <Moon className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() =>
                          navigate('/email-generator', { state: { contactId: contact.id } })
                        }
                        className="px-2.5 py-1 text-[11px] font-semibold bg-[#00A878]/15 dark:bg-[#00C896]/15 text-[#00A878] dark:text-[#00C896] hover:bg-[#00A878] hover:text-white dark:hover:bg-[#00C896] dark:hover:text-[#0D1117] rounded transition-colors"
                      >
                        Draft
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        /* Kanban View */
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4 overflow-x-auto pb-4">
          {kanbanColumns.map((colStatus) => {
            const bucket = contacts.filter((c) => c.status === colStatus);
            return (
              <div
                key={colStatus}
                className="bg-white dark:bg-[#161B22] border border-[#DDE3DF] dark:border-[#2D3A4A] rounded-[8px] p-3 min-w-[220px] flex flex-col shadow-xs"
              >
                <div className="flex items-center justify-between pb-2 border-b border-[#DDE3DF] dark:border-[#2D3A4A] mb-3">
                  <span className="font-mono text-[12px] uppercase font-semibold text-[#5E6863] dark:text-[#9CA3AF]">
                    {colStatus}
                  </span>
                  <span className="text-[11px] font-mono text-[#5E6863] dark:text-[#6B7280] bg-[#F1F4F2] dark:bg-[#111827] px-1.5 py-0.5 rounded">
                    {bucket.length}
                  </span>
                </div>

                <div className="space-y-2 flex-1">
                  {bucket.map((c) => (
                    <div
                      key={c.id}
                      onClick={() => openDrawer(c)}
                      className="p-3 bg-[#F7F8F6] dark:bg-[#111827] border border-[#DDE3DF] dark:border-[#2D3A4A] hover:border-[#00A878] dark:hover:border-[#00C896]/50 rounded-[6px] cursor-pointer transition-colors space-y-1.5"
                    >
                      <div className="flex items-center gap-2">
                        <Avatar name={c.name} size="xs" />
                        <div className="font-semibold text-[#17201C] dark:text-white text-[13px] truncate">{c.name}</div>
                      </div>
                      <div className="flex items-center gap-1.5 text-[11px] text-[#5E6863] dark:text-[#9CA3AF]">
                        {c.company && <CompanyLogo name={c.company} size="xs" />}
                        <span className="truncate">{c.company || 'No Company'}</span>
                      </div>
                      {c.sentiment_label && (
                        <div className="text-[10px] font-bold text-[#00A878] dark:text-[#00C896]">
                          {c.sentiment_label}
                        </div>
                      )}
                    </div>
                  ))}
                  {bucket.length === 0 && (
                    <div className="text-center py-6 text-[12px] text-[#87918C] dark:text-[#6B7280]">
                      Empty
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Right-Side Detail Drawer */}
      {drawerContact && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex justify-end animate-fadeIn">
          <div className="w-full max-w-lg bg-white dark:bg-[#161B22] border-l border-[#DDE3DF] dark:border-[#2D3A4A] h-full flex flex-col p-6 overflow-y-auto shadow-2xl animate-slideLeft">
            <div className="flex items-center justify-between pb-4 border-b border-[#DDE3DF] dark:border-[#2D3A4A] mb-4">
              <div className="flex items-center gap-3">
                <Avatar name={drawerContact.name} size="md" />
                <div>
                  <h2 className="text-[18px] font-bold text-[#17201C] dark:text-white font-sans">{drawerContact.name}</h2>
                  <div className="flex items-center gap-1.5 text-[12px] text-[#5E6863] dark:text-[#9CA3AF]">
                    {drawerContact.company && <CompanyLogo name={drawerContact.company} size="xs" />}
                    <span>{drawerContact.job_title || 'Contact'} · {drawerContact.company || 'Company'}</span>
                  </div>
                </div>
              </div>
              <button
                onClick={() => setDrawerContact(null)}
                className="p-1 text-[#87918C] dark:text-[#9CA3AF] hover:text-[#17201C] dark:hover:text-white rounded"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Quick Sentiment Sync Trigger Button in Drawer */}
            <div className="mb-4">
              <button
                onClick={() => {
                  setSyncContact(drawerContact);
                  setSentimentResult(null);
                  setSyncReplyText('');
                  setSyncModalOpen(true);
                }}
                className="w-full py-2 px-3 bg-[#00A878]/10 dark:bg-[#00C896]/15 hover:bg-[#00A878]/20 dark:hover:bg-[#00C896]/25 text-[#00A878] dark:text-[#00C896] text-[12px] font-bold rounded-[6px] border border-[#00A878]/30 dark:border-[#00C896]/30 transition-colors flex items-center justify-center gap-1.5"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>⚡ Sync Recruiter Reply & Sentiment (Feature 4)</span>
              </button>
            </div>

            {/* Quick Meta */}
            <div className="grid grid-cols-2 gap-3 mb-6 p-3 bg-[#111827] border border-[#2D3A4A] rounded-[6px] text-[12px]">
              <div>
                <span className="text-[#6B7280] block">Email</span>
                <span className="text-white font-mono">{drawerContact.email || '—'}</span>
              </div>
              <div>
                <span className="text-[#6B7280] block">Status</span>
                <StatusBadge status={drawerContact.status} />
              </div>
            </div>

            {/* Drawer Tabs */}
            <div className="flex border-b border-[#2D3A4A] mb-4 text-[13px]">
              <button
                onClick={() => setDrawerTab('timeline')}
                className={`pb-2 px-3 font-medium transition-colors ${
                  drawerTab === 'timeline'
                    ? 'border-b-2 border-[#00C896] text-[#00C896]'
                    : 'text-[#9CA3AF] hover:text-white'
                }`}
              >
                Notes & Timeline
              </button>
              <button
                onClick={() => setDrawerTab('linkedin')}
                className={`pb-2 px-3 font-medium transition-colors ${
                  drawerTab === 'linkedin'
                    ? 'border-b-2 border-[#00C896] text-[#00C896]'
                    : 'text-[#9CA3AF] hover:text-white'
                }`}
              >
                LinkedIn Message
              </button>
              <button
                onClick={() => setDrawerTab('history')}
                className={`pb-2 px-3 font-medium transition-colors ${
                  drawerTab === 'history'
                    ? 'border-b-2 border-[#00C896] text-[#00C896]'
                    : 'text-[#9CA3AF] hover:text-white'
                }`}
              >
                Email History ({drawerEmails.length})
              </button>
            </div>

            {/* Tab: Timeline */}
            {drawerTab === 'timeline' && (
              <div className="space-y-4 flex-1 flex flex-col">
                <form onSubmit={handleAddNote} className="flex gap-2">
                  <input
                    type="text"
                    value={newNote}
                    onChange={(e) => setNewNote(e.target.value)}
                    placeholder="Add an outreach note..."
                    className="flex-1 px-3 py-1.5 bg-[#111827] border border-[#2D3A4A] rounded text-[13px] text-white focus:border-[#00C896] outline-none"
                  />
                  <button
                    type="submit"
                    className="px-3 py-1.5 bg-[#00C896] text-[#0D1117] font-semibold text-[13px] rounded hover:bg-[#00b084]"
                  >
                    Post Note
                  </button>
                </form>

                <div className="space-y-2 flex-1 overflow-y-auto">
                  {drawerTimeline.map((item) => (
                    <div
                      key={item.id}
                      className="p-3 bg-[#111827] border border-[#2D3A4A] rounded-[6px] text-[12px] space-y-1"
                    >
                      <div className="flex items-center justify-between text-[#6B7280]">
                        <span className="capitalize font-medium text-white">{item.action}</span>
                        <span className="font-mono">{new Date(item.created_at).toLocaleString()}</span>
                      </div>
                      <p className="text-[#9CA3AF]">{item.description}</p>
                    </div>
                  ))}
                  {drawerTimeline.length === 0 && (
                    <div className="text-center py-8 text-[13px] text-[#6B7280]">
                      No timeline events yet
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Tab: LinkedIn Generator */}
            {drawerTab === 'linkedin' && (
              <div className="space-y-4">
                <p className="text-[12px] text-[#9CA3AF]">
                  Generates an authentic connection note under the strict 300-character LinkedIn invitation limit.
                </p>

                <button
                  type="button"
                  disabled={isGeneratingLinkedIn}
                  onClick={handleGenerateLinkedIn}
                  className="w-full py-2 bg-[#00C896] text-[#0D1117] font-bold text-[13px] rounded hover:bg-[#00b084] flex items-center justify-center gap-2"
                >
                  <Sparkles className="w-4 h-4" />
                  <span>{isGeneratingLinkedIn ? 'Generating...' : 'Generate Connection Note'}</span>
                </button>

                {linkedInMsg && (
                  <div className="p-4 bg-[#111827] border border-[#2D3A4A] rounded-[6px] space-y-2">
                    <textarea
                      rows={4}
                      value={linkedInMsg}
                      onChange={(e) => setLinkedInMsg(e.target.value)}
                      maxLength={300}
                      className="w-full bg-transparent text-[13px] text-white focus:outline-none resize-none"
                    />

                    <div className="flex items-center justify-between pt-2 border-t border-[#2D3A4A] text-[11px]">
                      <span
                        className={`font-mono font-bold ${
                          linkedInMsg.length > 280 ? 'text-red-400' : 'text-[#00C896]'
                        }`}
                      >
                        {linkedInMsg.length} / 300 characters
                      </span>

                      <button
                        onClick={() => {
                          navigator.clipboard.writeText(linkedInMsg);
                          setCopiedLinkedIn(true);
                          setTimeout(() => setCopiedLinkedIn(false), 2000);
                        }}
                        className="px-2.5 py-1 bg-[#1F2937] hover:bg-[#2D3A4A] text-white rounded flex items-center gap-1"
                      >
                        {copiedLinkedIn ? <Check className="w-3.5 h-3.5 text-[#00C896]" /> : <Copy className="w-3.5 h-3.5" />}
                        <span>Copy</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Tab: Email History */}
            {drawerTab === 'history' && (
              <div className="space-y-3 flex-1 overflow-y-auto">
                {drawerEmails.map((email) => (
                  <div
                    key={email.id}
                    className="p-3.5 bg-[#111827] border border-[#2D3A4A] rounded-[6px] space-y-2 text-[12px]"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-white truncate max-w-[260px]">
                        {email.subject}
                      </span>
                      <StatusBadge status={email.status} />
                    </div>
                    <p className="font-serif text-[#9CA3AF] line-clamp-3 leading-relaxed">
                      {email.body}
                    </p>
                    <div className="text-[11px] text-[#6B7280] font-mono pt-1">
                      {new Date(email.created_at).toLocaleDateString()}
                    </div>
                  </div>
                ))}
                {drawerEmails.length === 0 && (
                  <div className="text-center py-8 text-[13px] text-[#6B7280]">
                    No emails drafted for this contact yet.
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Add Contact Modal */}
      {addModalOpen && (
        <div className="fixed inset-0 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fadeIn">
          <div className="w-full max-w-lg bg-[#161B22] border border-[#2D3A4A] rounded-[8px] shadow-2xl p-6 relative">
            <button
              onClick={() => setAddModalOpen(false)}
              className="absolute top-4 right-4 text-[#9CA3AF] hover:text-white"
            >
              <X className="w-4 h-4" />
            </button>
            <h2 className="text-[18px] font-bold text-white mb-4">Add New Contact</h2>

            <form onSubmit={handleCreateContact} className="space-y-3 text-[13px]">
              <div>
                <label className="block text-[#9CA3AF] mb-1">Contact Name *</label>
                <input
                  type="text"
                  required
                  value={newContact.name}
                  onChange={(e) => setNewContact({ ...newContact, name: e.target.value })}
                  placeholder="Sarah Jenkins"
                  className="w-full px-3 py-1.5 bg-[#111827] border border-[#2D3A4A] rounded text-white focus:border-[#00C896] outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[#9CA3AF] mb-1">Company</label>
                  <input
                    type="text"
                    value={newContact.company}
                    onChange={(e) => setNewContact({ ...newContact, company: e.target.value })}
                    placeholder="Stripe"
                    className="w-full px-3 py-1.5 bg-[#111827] border border-[#2D3A4A] rounded text-white focus:border-[#00C896] outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[#9CA3AF] mb-1">Job Title</label>
                  <input
                    type="text"
                    value={newContact.job_title}
                    onChange={(e) => setNewContact({ ...newContact, job_title: e.target.value })}
                    placeholder="Technical Recruiter"
                    className="w-full px-3 py-1.5 bg-[#111827] border border-[#2D3A4A] rounded text-white focus:border-[#00C896] outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[#9CA3AF] mb-1">Email Address</label>
                <input
                  type="email"
                  value={newContact.email}
                  onChange={(e) => setNewContact({ ...newContact, email: e.target.value })}
                  placeholder="sarah@stripe.com"
                  className="w-full px-3 py-1.5 bg-[#111827] border border-[#2D3A4A] rounded text-white focus:border-[#00C896] outline-none"
                />
              </div>

              <div>
                <label className="block text-[#9CA3AF] mb-1">LinkedIn Profile URL</label>
                <input
                  type="url"
                  value={newContact.linkedin_url}
                  onChange={(e) => setNewContact({ ...newContact, linkedin_url: e.target.value })}
                  placeholder="https://linkedin.com/in/sarahjenkins"
                  className="w-full px-3 py-1.5 bg-[#111827] border border-[#2D3A4A] rounded text-white focus:border-[#00C896] outline-none"
                />
              </div>

              <div>
                <label className="block text-[#9CA3AF] mb-1">Notes</label>
                <textarea
                  rows={2}
                  value={newContact.notes}
                  onChange={(e) => setNewContact({ ...newContact, notes: e.target.value })}
                  placeholder="Met at university tech talk..."
                  className="w-full px-3 py-1.5 bg-[#111827] border border-[#2D3A4A] rounded text-white focus:border-[#00C896] outline-none resize-none"
                />
              </div>

              <div className="flex justify-end gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => setAddModalOpen(false)}
                  className="px-4 py-2 text-[#9CA3AF] hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-[#00C896] text-[#0D1117] font-semibold rounded hover:bg-[#00b084]"
                >
                  Save Contact
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* CSV Import Modal */}
      <CsvImportModal
        isOpen={csvModalOpen}
        onClose={() => setCsvModalOpen(false)}
        onImportSuccess={fetchContacts}
      />

      {/* Snooze Modal */}
      <SnoozeModal
        isOpen={snoozeModalOpen}
        contactId={activeContactForSnooze?.id || null}
        contactName={activeContactForSnooze?.name}
        onClose={() => {
          setSnoozeModalOpen(false);
          setActiveContactForSnooze(null);
        }}
        onSnoozed={fetchContacts}
      />

      {/* Sentiment Sync Modal (Feature 4) */}
      {syncModalOpen && syncContact && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fadeIn">
          <div className="w-full max-w-lg bg-white dark:bg-[#161B22] border border-[#DDE3DF] dark:border-[#2D3A4A] rounded-[10px] shadow-2xl p-6 relative animate-scaleIn">
            <button
              onClick={() => setSyncModalOpen(false)}
              className="absolute top-4 right-4 text-[#87918C] dark:text-[#9CA3AF] hover:text-[#17201C] dark:hover:text-white"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="flex items-center gap-2 text-[#00A878] dark:text-[#00C896] mb-1">
              <Sparkles className="w-4 h-4" />
              <span className="text-[11px] font-bold uppercase font-mono tracking-wider">
                Feature 4: Reply Sentiment & Pipeline Sync
              </span>
            </div>

            <h3 className="text-[18px] font-bold text-[#17201C] dark:text-white mb-1 font-sans">
              Classify Reply from {syncContact.name}
            </h3>
            <p className="text-[12px] text-[#5E6863] dark:text-[#9CA3AF] mb-4">
              AI evaluates recruiter intent, classifies the sentiment, and automatically transitions the recruiter's stage in your Kanban pipeline.
            </p>

            <form onSubmit={handleSyncSentiment} className="space-y-4 text-[13px]">
              {/* Quick Presets for Instant Testing */}
              <div>
                <label className="block text-[11px] font-mono text-[#87918C] dark:text-[#9CA3AF] mb-1.5">
                  QUICK PRESETS (CLICK TO TEST)
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() =>
                      setSyncReplyText(
                        `Hi ${syncContact.name.split(' ')[0]}, loved your background and projects! We'd love to set up a 30-min screening call this Thursday at 2 PM EST. Are you available?`
                      )
                    }
                    className="p-2 text-left bg-[#F1F4F2] dark:bg-[#111827] border border-[#DDE3DF] dark:border-[#2D3A4A] rounded hover:border-[#00A878] dark:hover:border-[#00C896] text-[11px] text-[#17201C] dark:text-white transition-all"
                  >
                    🎉 <strong>Interview Invitation</strong>
                    <p className="text-[10px] text-[#5E6863] dark:text-[#87918C] mt-0.5 truncate">"Loved your note, let's schedule..."</p>
                  </button>

                  <button
                    type="button"
                    onClick={() =>
                      setSyncReplyText(
                        `Hey! Thanks for reaching out. I just submitted your referral to our engineering hiring manager. Look out for an email from careers@${syncContact.company ? syncContact.company.toLowerCase().replace(/[^a-z]/g, '') : 'company'}.com.`
                      )
                    }
                    className="p-2 text-left bg-[#F1F4F2] dark:bg-[#111827] border border-[#DDE3DF] dark:border-[#2D3A4A] rounded hover:border-[#00A878] dark:hover:border-[#00C896] text-[11px] text-[#17201C] dark:text-white transition-all"
                  >
                    ✓ <strong>Referral Confirmed</strong>
                    <p className="text-[10px] text-[#5E6863] dark:text-[#87918C] mt-0.5 truncate">"Submitted your referral to manager..."</p>
                  </button>

                  <button
                    type="button"
                    onClick={() =>
                      setSyncReplyText(
                        `Hi, thanks for reaching out! Do you have a live link to your portfolio website or a GitHub repo showcasing your recent work?`
                      )
                    }
                    className="p-2 text-left bg-[#F1F4F2] dark:bg-[#111827] border border-[#DDE3DF] dark:border-[#2D3A4A] rounded hover:border-[#00A878] dark:hover:border-[#00C896] text-[11px] text-[#17201C] dark:text-white transition-all"
                  >
                    ℹ <strong>More Info Requested</strong>
                    <p className="text-[10px] text-[#5E6863] dark:text-[#87918C] mt-0.5 truncate">"Can you send portfolio or GitHub..."</p>
                  </button>

                  <button
                    type="button"
                    onClick={() =>
                      setSyncReplyText(
                        `Hi, thank you for your note and interest in our team. Unfortunately, we don't have open headcount for this role right now, but we will keep your resume on file for future cycles.`
                      )
                    }
                    className="p-2 text-left bg-[#F1F4F2] dark:bg-[#111827] border border-[#DDE3DF] dark:border-[#2D3A4A] rounded hover:border-[#00A878] dark:hover:border-[#00C896] text-[11px] text-[#17201C] dark:text-white transition-all"
                  >
                    👋 <strong>Polite Pass</strong>
                    <p className="text-[10px] text-[#5E6863] dark:text-[#87918C] mt-0.5 truncate">"No headcount right now, but..."</p>
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-[12px] font-semibold text-[#17201C] dark:text-white mb-1">
                  Recruiter Response Text
                </label>
                <textarea
                  rows={4}
                  required
                  value={syncReplyText}
                  onChange={(e) => setSyncReplyText(e.target.value)}
                  placeholder="Paste the recruiter's email response or click a preset above..."
                  className="w-full p-2.5 bg-[#F7F8F6] dark:bg-[#111827] border border-[#DDE3DF] dark:border-[#2D3A4A] rounded text-[#17201C] dark:text-white text-[12px] outline-none focus:border-[#00A878] dark:focus:border-[#00C896]"
                />
              </div>

              {sentimentResult && (
                <div className="p-3.5 bg-[#F1F4F2] dark:bg-[#111827] border border-[#00A878]/30 dark:border-[#00C896]/30 rounded-[8px] space-y-1.5 animate-fadeIn">
                  <div className="flex items-center justify-between">
                    <span className="text-[12px] font-bold text-[#00A878] dark:text-[#00C896]">
                      {sentimentResult.sentimentLabel}
                    </span>
                    <span className="text-[11px] font-mono text-[#5E6863] dark:text-[#9CA3AF]">
                      {(sentimentResult.confidence * 100).toFixed(0)}% confidence
                    </span>
                  </div>
                  <p className="text-[12px] text-[#17201C] dark:text-white font-medium">
                    {sentimentResult.summary}
                  </p>
                  <p className="text-[11px] text-[#5E6863] dark:text-[#9CA3AF]">
                    <strong>Recommended next step:</strong> {sentimentResult.recommendedNextAction}
                  </p>
                </div>
              )}

              <div className="flex items-center justify-end gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={() => setSyncModalOpen(false)}
                  className="px-4 py-2 text-[#5E6863] dark:text-[#9CA3AF] hover:text-[#17201C] dark:hover:text-white"
                >
                  Close
                </button>
                <button
                  type="submit"
                  disabled={isSyncing || !syncReplyText.trim()}
                  className="px-5 py-2 bg-[#00A878] dark:bg-[#00C896] text-white dark:text-[#0D1117] font-bold rounded hover:bg-[#008f66] dark:hover:bg-[#00b084] transition-all disabled:opacity-50 flex items-center gap-2"
                >
                  {isSyncing ? (
                    <span>Classifying...</span>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4" />
                      <span>Classify & Sync to Kanban</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
