import React, { useState, useEffect } from 'react';
import {
  User,
  FileText,
  Upload,
  CheckCircle2,
  Trash2,
  Sparkles,
  Plus,
  Save,
  Check,
  Building2,
  Briefcase,
  GraduationCap,
  Award,
  Globe,
  Sliders,
  X,
} from 'lucide-react';
import { api } from '../lib/api';
import { Profile, ResumeVersion } from '../types';

export const ProfilePage: React.FC = () => {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [resumeVersions, setResumeVersions] = useState<ResumeVersion[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  // Resume Upload & Extraction Review
  const [uploadLoading, setUploadLoading] = useState(false);
  const [extractedReview, setExtractedReview] = useState<{
    rawText: string;
    structured: any;
    fileUrl: string;
    fileName: string;
  } | null>(null);
  const [versionNameInput, setVersionNameInput] = useState('');

  // Ghostwriter samples
  const [samples, setSamples] = useState<string[]>([
    'Hi Sarah, loved your team’s recent engineering article on sharding Postgres. As an engineer focused on Go and distributed systems, I’d love to learn more about upcoming roles.',
    'Hey Dave, reaching out as a fellow Berkeley CS student. I noticed your work leading infrastructure at Linear and wanted to ask about your experience transitioning from college.',
  ]);
  const [isAnalyzingVoice, setIsAnalyzingVoice] = useState(false);

  // Signature layout
  const [sigLayout, setSigLayout] = useState<'minimal' | 'standard' | 'card'>('standard');

  const fetchProfile = async () => {
    setIsLoading(true);
    try {
      const [profRes, versRes] = await Promise.all([
        api.get<{ success: boolean; profile: Profile }>('/profile'),
        api.get<{ success: boolean; versions: ResumeVersion[] }>('/profile/resume/versions'),
      ]);
      if (profRes.success) {
        setProfile(profRes.profile);
        if (profRes.profile?.email_signature?.layout) {
          setSigLayout(profRes.profile.email_signature.layout);
        }
      }
      if (versRes.success) setResumeVersions(versRes.versions || []);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchProfile();
  }, []);

  // Calculate profile completion percentage
  const calculateCompletion = () => {
    if (!profile) return 0;
    let score = 0;
    if (profile.full_name) score += 15;
    if (profile.headline) score += 15;
    if (profile.university) score += 15;
    if (profile.degree) score += 10;
    if (profile.skills && profile.skills.length > 0) score += 20;
    if (profile.experience && profile.experience.length > 0) score += 15;
    if (profile.email_signature?.name) score += 10;
    return Math.min(100, score);
  };

  const handleSaveProfile = async () => {
    if (!profile) return;
    setIsSaving(true);
    try {
      await api.put('/profile', profile);
      alert('✓ Profile updated successfully!');
    } catch (err: any) {
      alert(err.message || 'Failed to update profile.');
    } finally {
      setIsSaving(false);
    }
  };

  // Resume Upload Handler
  const handleResumeFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      alert('File size exceeds 5MB limit.');
      return;
    }

    setUploadLoading(true);
    try {
      const formData = new FormData();
      formData.append('resume', file);

      const res = await api.post('/profile/resume/upload', formData);
      if (res.success) {
        setExtractedReview({
          rawText: res.extracted.rawText,
          structured: res.extracted.structured,
          fileUrl: res.fileUrl,
          fileName: res.fileName,
        });
        setVersionNameInput(file.name.replace(/\.[^/.]+$/, ''));
      }
    } catch (err: any) {
      alert(err.message || 'Resume upload and extraction failed.');
    } finally {
      setUploadLoading(false);
    }
  };

  // Confirm Save Resume Version
  const handleSaveResumeVersion = async () => {
    if (!extractedReview || !versionNameInput) return;
    try {
      const res = await api.post('/profile/resume/versions', {
        name: versionNameInput,
        fileUrl: extractedReview.fileUrl,
        parsedData: extractedReview.structured,
        isDefault: resumeVersions.length === 0,
      });

      if (res.success) {
        // Auto update profile with structured items if empty
        if (profile) {
          const updated = {
            ...profile,
            full_name: profile.full_name || extractedReview.structured.fullName,
            headline: profile.headline || extractedReview.structured.headline,
            university: profile.university || extractedReview.structured.university,
            skills: profile.skills?.length ? profile.skills : extractedReview.structured.skills,
          };
          setProfile(updated);
          await api.put('/profile', updated);
        }

        setExtractedReview(null);
        fetchProfile();
        alert('✓ Resume version saved and linked!');
      }
    } catch (err: any) {
      alert(err.message || 'Failed to save version.');
    }
  };

  const handleSetDefaultResume = async (id: string) => {
    try {
      await api.put(`/profile/resume/versions/${id}/set-default`);
      fetchProfile();
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteResumeVersion = async (id: string) => {
    if (!confirm('Delete this resume version and associated file?')) return;
    try {
      await api.delete(`/profile/resume/versions/${id}`);
      fetchProfile();
    } catch (err) {
      console.error(err);
    }
  };

  // Ghostwriter Voice Trainer
  const handleAnalyzeWritingStyle = async () => {
    setIsAnalyzingVoice(true);
    try {
      const res = await api.post('/ai/ghostwrite', { samples });
      if (res.success) {
        if (profile) {
          setProfile({ ...profile, voice_profile: res.voiceProfile });
        }
        alert('✓ Voice profile successfully extracted and stored in your profile!');
      }
    } catch (err: any) {
      alert(err.message || 'Analysis failed.');
    } finally {
      setIsAnalyzingVoice(false);
    }
  };

  const handleClearVoice = async () => {
    if (!profile) return;
    try {
      await api.put('/profile/voice-profile', { voice_profile: null });
      setProfile({ ...profile, voice_profile: undefined });
    } catch (err) {
      console.error(err);
    }
  };

  const completion = calculateCompletion();

  return (
    <div className="space-y-8 animate-fadeIn pb-16">
      {/* Header & Completion Bar */}
      <div className="space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-[28px] font-bold text-white tracking-tight font-sans">
              Candidate Profile & Voice
            </h1>
            <p className="text-[13px] text-[#9CA3AF]">
              All AI outreach emails are strictly grounded in your confirmed background and writing style
            </p>
          </div>

          <button
            onClick={handleSaveProfile}
            disabled={isSaving}
            className="flex items-center gap-2 px-5 py-2 bg-[#00C896] hover:bg-[#00b084] text-[#0D1117] font-bold text-[13px] rounded-[6px] transition-all shadow-[0_0_12px_rgba(0,200,150,0.2)]"
          >
            <Save className="w-4 h-4" />
            <span>{isSaving ? 'Saving...' : 'Save Profile Changes'}</span>
          </button>
        </div>

        {/* Completion Bar matching spec */}
        <div className="p-3.5 bg-[#161B22] border border-[#2D3A4A] rounded-[8px] space-y-2">
          <div className="flex items-center justify-between text-[12px]">
            <span className="text-[#9CA3AF]">
              Profile <strong className="text-[#00C896] font-mono">{completion}%</strong> complete — complete your profile for better AI personalization.
            </span>
            <span className="text-[11px] font-mono text-[#6B7280]">
              {completion === 100 ? 'Fully Grounded' : 'Action Recommended'}
            </span>
          </div>
          <div className="w-full h-1.5 bg-[#111827] rounded-full overflow-hidden">
            <div
              className="h-full bg-[#00C896] rounded-full transition-all duration-500"
              style={{ width: `${completion}%` }}
            ></div>
          </div>
        </div>
      </div>

      {/* Profile Form */}
      <div className="bg-[#161B22] border border-[#2D3A4A] rounded-[8px] p-6 space-y-6">
        <h2 className="text-[18px] font-bold text-white flex items-center gap-2">
          <User className="w-4 h-4 text-[#00C896]" />
          <span>Core Candidate Details</span>
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-[13px]">
          <div>
            <label className="block text-[#9CA3AF] mb-1">Full Name</label>
            <input
              type="text"
              value={profile?.full_name || ''}
              onChange={(e) => setProfile(profile ? { ...profile, full_name: e.target.value } : null)}
              className="w-full px-3 py-2 bg-[#111827] border border-[#2D3A4A] rounded text-white focus:border-[#00C896] outline-none"
            />
          </div>

          <div>
            <label className="block text-[#9CA3AF] mb-1">Professional Headline</label>
            <input
              type="text"
              value={profile?.headline || ''}
              onChange={(e) => setProfile(profile ? { ...profile, headline: e.target.value } : null)}
              placeholder="e.g. Full-Stack Engineer & Distributed Systems Enthusiast"
              className="w-full px-3 py-2 bg-[#111827] border border-[#2D3A4A] rounded text-white focus:border-[#00C896] outline-none"
            />
          </div>

          <div>
            <label className="block text-[#9CA3AF] mb-1">University / College</label>
            <input
              type="text"
              value={profile?.university || ''}
              onChange={(e) => setProfile(profile ? { ...profile, university: e.target.value } : null)}
              placeholder="Stanford University"
              className="w-full px-3 py-2 bg-[#111827] border border-[#2D3A4A] rounded text-white focus:border-[#00C896] outline-none"
            />
          </div>

          <div>
            <label className="block text-[#9CA3AF] mb-1">Degree & Major</label>
            <input
              type="text"
              value={profile?.degree || ''}
              onChange={(e) => setProfile(profile ? { ...profile, degree: e.target.value } : null)}
              placeholder="B.S. in Computer Science"
              className="w-full px-3 py-2 bg-[#111827] border border-[#2D3A4A] rounded text-white focus:border-[#00C896] outline-none"
            />
          </div>

          <div>
            <label className="block text-[#9CA3AF] mb-1">Graduation Year</label>
            <input
              type="number"
              value={profile?.graduation_year || 2026}
              onChange={(e) =>
                setProfile(profile ? { ...profile, graduation_year: parseInt(e.target.value, 10) } : null)
              }
              className="w-full px-3 py-2 bg-[#111827] border border-[#2D3A4A] rounded text-white focus:border-[#00C896] outline-none"
            />
          </div>

          <div>
            <label className="block text-[#9CA3AF] mb-1">Location</label>
            <input
              type="text"
              value={profile?.location || ''}
              onChange={(e) => setProfile(profile ? { ...profile, location: e.target.value } : null)}
              placeholder="San Francisco, CA / Remote"
              className="w-full px-3 py-2 bg-[#111827] border border-[#2D3A4A] rounded text-white focus:border-[#00C896] outline-none"
            />
          </div>
        </div>

        {/* Skills Tag Input */}
        <div>
          <label className="block text-[#9CA3AF] mb-1 text-[13px]">
            Primary Technical Skills (Comma-separated)
          </label>
          <input
            type="text"
            value={profile?.skills?.join(', ') || ''}
            onChange={(e) =>
              setProfile(
                profile
                  ? {
                      ...profile,
                      skills: e.target.value.split(',').map((s) => s.trim()).filter(Boolean),
                    }
                  : null
              )
            }
            placeholder="React, TypeScript, Go, PostgreSQL, Docker, Kubernetes"
            className="w-full px-3 py-2 bg-[#111827] border border-[#2D3A4A] rounded text-white focus:border-[#00C896] outline-none font-mono text-[12px]"
          />
        </div>
      </div>

      {/* Resume Version Manager Section */}
      <div className="bg-[#161B22] border border-[#2D3A4A] rounded-[8px] p-6 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[#2D3A4A]">
          <div>
            <h2 className="text-[18px] font-bold text-white flex items-center gap-2">
              <FileText className="w-4 h-4 text-[#00C896]" />
              <span>Resume Version Manager</span>
            </h2>
            <p className="text-[12px] text-[#9CA3AF]">
              Upload PDF/DOCX (max 5MB). AI extracts structured skills and experience with side-by-side review.
            </p>
          </div>

          <label className="px-4 py-2 bg-[#111827] border border-[#2D3A4A] hover:border-[#00C896] text-white text-[13px] font-medium rounded-[6px] cursor-pointer flex items-center gap-2 transition-colors">
            <Upload className="w-4 h-4 text-[#00C896]" />
            <span>{uploadLoading ? 'Extracting Resume...' : 'Upload PDF / DOCX'}</span>
            <input
              type="file"
              accept=".pdf,.docx,.doc"
              onChange={handleResumeFile}
              className="hidden"
            />
          </label>
        </div>

        {/* Existing Resume Versions List */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
          {resumeVersions.map((ver) => (
            <div
              key={ver.id}
              className={`p-4 rounded-[6px] border flex flex-col justify-between space-y-3 ${
                ver.is_default
                  ? 'bg-[#111827] border-[#00C896]/50'
                  : 'bg-[#111827] border-[#2D3A4A]'
              }`}
            >
              <div>
                <div className="flex items-center justify-between gap-1 mb-1">
                  <span className="font-semibold text-white text-[13px] truncate">
                    {ver.name}
                  </span>
                  {ver.is_default && (
                    <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-[#00C896]/15 text-[#00C896]">
                      Default
                    </span>
                  )}
                </div>
                <span className="text-[11px] text-[#6B7280] font-mono">
                  {new Date(ver.created_at).toLocaleDateString()}
                </span>
              </div>

              <div className="flex items-center justify-between pt-2 border-t border-[#2D3A4A] text-[12px]">
                {!ver.is_default ? (
                  <button
                    onClick={() => handleSetDefaultResume(ver.id)}
                    className="text-[#9CA3AF] hover:text-[#00C896] text-[11px]"
                  >
                    Set as Default
                  </button>
                ) : (
                  <span className="text-[11px] text-[#00C896] flex items-center gap-1">
                    <Check className="w-3 h-3" /> Active Default
                  </span>
                )}
                <button
                  onClick={() => handleDeleteResumeVersion(ver.id)}
                  className="text-red-400 hover:text-red-300 p-1 rounded"
                  title="Delete version"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}

          {resumeVersions.length === 0 && (
            <div className="col-span-full py-8 text-center text-[13px] text-[#6B7280]">
              No resume versions uploaded yet. Upload your master resume to ground email personalization.
            </div>
          )}
        </div>

        {/* Side-by-Side Review Interface after Extraction */}
        {extractedReview && (
          <div className="p-5 bg-[#111827] border border-[#00C896]/40 rounded-[8px] space-y-4 animate-fadeIn">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-[12px] font-mono uppercase text-[#00C896] block">
                  AI Structured Resume Extractor
                </span>
                <h3 className="text-[16px] font-bold text-white">Review & Confirm Extracted Data</h3>
              </div>
              <button
                onClick={() => setExtractedReview(null)}
                className="text-[#9CA3AF] hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Left: Raw Extracted Text */}
              <div className="space-y-1">
                <span className="text-[11px] font-mono uppercase text-[#9CA3AF]">
                  Raw Extracted Text
                </span>
                <textarea
                  rows={10}
                  readOnly
                  value={extractedReview.rawText}
                  className="w-full p-3 bg-[#161B22] border border-[#2D3A4A] rounded text-[11px] text-[#9CA3AF] font-mono outline-none resize-none leading-relaxed"
                />
              </div>

              {/* Right: Structured Preview & Edit */}
              <div className="space-y-1">
                <span className="text-[11px] font-mono uppercase text-[#00C896]">
                  Structured Preview (Editable)
                </span>
                <textarea
                  rows={10}
                  value={JSON.stringify(extractedReview.structured, null, 2)}
                  onChange={(e) => {
                    try {
                      setExtractedReview({
                        ...extractedReview,
                        structured: JSON.parse(e.target.value),
                      });
                    } catch {
                      // ignore typing errors
                    }
                  }}
                  className="w-full p-3 bg-[#161B22] border border-[#00C896]/30 rounded text-[11px] text-white font-mono outline-none resize-none leading-relaxed"
                />
              </div>
            </div>

            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-3 border-t border-[#2D3A4A]">
              <div className="flex items-center gap-2">
                <label className="text-[12px] text-[#9CA3AF]">Version Name:</label>
                <input
                  type="text"
                  value={versionNameInput}
                  onChange={(e) => setVersionNameInput(e.target.value)}
                  className="px-3 py-1 bg-[#161B22] border border-[#2D3A4A] rounded text-[12px] text-white outline-none"
                />
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setExtractedReview(null)}
                  className="px-4 py-1.5 text-[12px] text-[#9CA3AF] hover:text-white"
                >
                  Discard
                </button>
                <button
                  type="button"
                  onClick={handleSaveResumeVersion}
                  className="px-5 py-1.5 bg-[#00C896] text-[#0D1117] font-bold text-[12px] rounded hover:bg-[#00b084]"
                >
                  Confirm & Save Version
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Ghostwriter Mode: Train Your Voice */}
      <div className="bg-[#161B22] border border-[#2D3A4A] rounded-[8px] p-6 space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-[#2D3A4A]">
          <div>
            <h2 className="text-[18px] font-bold text-white flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-[#00C896]" />
              <span>Ghostwriter Mode: Train Your Writing Voice</span>
            </h2>
            <p className="text-[12px] text-[#9CA3AF]">
              Provide 3–5 sample emails you have previously written. MailMint extracts your average sentence length, formality, and cadence.
            </p>
          </div>
          {profile?.voice_profile && (
            <button
              onClick={handleClearVoice}
              className="text-[11px] text-red-400 hover:underline"
            >
              Clear Voice Profile
            </button>
          )}
        </div>

        {profile?.voice_profile ? (
          <div className="p-4 bg-[#111827] border border-[#00C896]/30 rounded-[6px] space-y-2">
            <div className="flex items-center gap-2 text-[#00C896] font-semibold text-[13px]">
              <CheckCircle2 className="w-4 h-4" />
              <span>Voice Profile Active</span>
            </div>
            <p className="text-[13px] text-white leading-relaxed font-mono text-[12px]">
              {profile.voice_profile}
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {samples.map((s, i) => (
              <div key={i} className="flex gap-2 items-start">
                <textarea
                  rows={2}
                  value={s}
                  onChange={(e) => {
                    const next = [...samples];
                    next[i] = e.target.value;
                    setSamples(next);
                  }}
                  className="flex-1 p-2 bg-[#111827] border border-[#2D3A4A] rounded text-[12px] text-white outline-none resize-none font-serif"
                />
                {samples.length > 1 && (
                  <button
                    onClick={() => setSamples(samples.filter((_, idx) => idx !== i))}
                    className="p-2 text-[#6B7280] hover:text-red-400"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>
            ))}

            <div className="flex items-center justify-between pt-2">
              <button
                type="button"
                onClick={() => setSamples([...samples, ''])}
                className="text-[12px] text-[#00C896] hover:underline flex items-center gap-1"
              >
                <Plus className="w-3.5 h-3.5" /> Add Email Sample
              </button>

              <button
                type="button"
                disabled={isAnalyzingVoice}
                onClick={handleAnalyzeWritingStyle}
                className="px-5 py-2 bg-[#00C896] text-[#0D1117] font-bold text-[13px] rounded hover:bg-[#00b084] disabled:opacity-50 flex items-center gap-1.5"
              >
                <Sparkles className="w-4 h-4" />
                <span>{isAnalyzingVoice ? 'Analyzing Voice...' : 'Analyze My Writing Style'}</span>
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Email Signature Builder */}
      <div className="bg-[#161B22] border border-[#2D3A4A] rounded-[8px] p-6 space-y-4">
        <h2 className="text-[18px] font-bold text-white flex items-center gap-2 pb-3 border-b border-[#2D3A4A]">
          <span>Professional Email Signature</span>
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Controls */}
          <div className="space-y-3 text-[12px]">
            <div>
              <label className="block text-[#9CA3AF] mb-1">Layout</label>
              <div className="grid grid-cols-3 gap-2">
                {(['minimal', 'standard', 'card'] as const).map((lay) => (
                  <button
                    key={lay}
                    type="button"
                    onClick={() => {
                      setSigLayout(lay);
                      if (profile?.email_signature) {
                        setProfile({
                          ...profile,
                          email_signature: { ...profile.email_signature, layout: lay },
                        });
                      }
                    }}
                    className={`py-1.5 capitalize rounded border transition-colors ${
                      sigLayout === lay
                        ? 'bg-[#00C896] text-[#0D1117] font-bold border-[#00C896]'
                        : 'bg-[#111827] text-[#9CA3AF] border-[#2D3A4A]'
                    }`}
                  >
                    {lay}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-[#9CA3AF] mb-1">Professional Title</label>
              <input
                type="text"
                value={profile?.email_signature?.title || ''}
                onChange={(e) =>
                  setProfile(
                    profile && profile.email_signature
                      ? {
                          ...profile,
                          email_signature: { ...profile.email_signature, title: e.target.value },
                        }
                      : null
                  )
                }
                className="w-full px-3 py-1.5 bg-[#111827] border border-[#2D3A4A] rounded text-white outline-none"
              />
            </div>

            <div>
              <label className="block text-[#9CA3AF] mb-1">LinkedIn Profile</label>
              <input
                type="text"
                value={profile?.email_signature?.linkedin || ''}
                onChange={(e) =>
                  setProfile(
                    profile && profile.email_signature
                      ? {
                          ...profile,
                          email_signature: { ...profile.email_signature, linkedin: e.target.value },
                        }
                      : null
                  )
                }
                className="w-full px-3 py-1.5 bg-[#111827] border border-[#2D3A4A] rounded text-white outline-none"
              />
            </div>
          </div>

          {/* Live Lora Serif Preview */}
          <div className="p-4 bg-[#111827] border border-[#2D3A4A] rounded-[8px] flex flex-col justify-center font-serif text-[14px] text-[#F0F0F0] leading-relaxed">
            <span className="text-[11px] font-mono uppercase text-[#6B7280] mb-3 block">
              Live Preview (Lora Serif)
            </span>
            <div className="border-t border-[#2D3A4A] pt-3">
              <div className="font-bold text-white">{profile?.full_name || 'Your Name'}</div>
              <div className="text-[#9CA3AF]">
                {profile?.email_signature?.title || profile?.headline || 'Software Engineer'}
              </div>
              <div className="text-[12px] text-[#6B7280] mt-1 font-mono">
                {profile?.email} {profile?.email_signature?.linkedin ? `· ${profile.email_signature.linkedin}` : ''}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
