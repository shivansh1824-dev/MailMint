export interface User {
  id: string;
  email: string;
  name?: string;
  plan: 'free' | 'pro' | 'team';
  gmailConnected?: boolean;
  gmailEmail?: string;
  createdAt?: string;
}

export interface Profile {
  id: string;
  user_id: string;
  full_name?: string;
  headline?: string;
  email?: string;
  phone?: string;
  location?: string;
  university?: string;
  degree?: string;
  graduation_year?: number;
  skills?: string[];
  experience?: {
    company: string;
    role: string;
    duration: string;
    description: string;
  }[];
  projects?: {
    name: string;
    description: string;
    tech: string[];
    url?: string;
  }[];
  achievements?: string[];
  certifications?: string[];
  technologies?: string[];
  github_url?: string;
  linkedin_url?: string;
  portfolio_url?: string;
  active_resume_version_id?: string;
  voice_profile?: string;
  email_signature?: {
    name: string;
    title: string;
    email: string;
    phone?: string;
    linkedin?: string;
    github?: string;
    portfolio?: string;
    layout: 'minimal' | 'standard' | 'card';
  };
}

export interface ResumeVersion {
  id: string;
  user_id: string;
  name: string;
  file_url?: string;
  parsed_data?: any;
  is_default?: boolean;
  created_at: string;
}

export interface Contact {
  id: string;
  user_id: string;
  name: string;
  company?: string;
  job_title?: string;
  email?: string;
  linkedin_url?: string;
  source: string;
  source_url?: string;
  notes?: string;
  tags?: string[];
  status: 'new' | 'draft' | 'scheduled' | 'sent' | 'replied' | 'follow-up' | 'closed' | 'snoozed';
  sentiment?: 'interview_invitation' | 'referral_confirmed' | 'more_info_needed' | 'polite_rejection' | string;
  sentiment_label?: string;
  suggested_action?: string;
  timezone?: string;
  last_contacted?: string;
  next_follow_up?: string;
  snoozed_until?: string;
  is_snoozed: boolean;
  created_at: string;
  updated_at: string;
}

export interface ContactTimelineItem {
  id: string;
  user_id: string;
  contact_id: string;
  action: 'drafted' | 'sent' | 'replied' | 'snoozed' | 'note' | 'status-changed' | 'follow-up-sent';
  description: string;
  created_at: string;
}

export interface Company {
  id: string;
  user_id: string;
  name: string;
  website?: string;
  careers_url?: string;
  industry?: string;
  location?: string;
  size?: string;
  funding_stage?: string;
  recent_news?: { title: string; date: string; source: string }[];
  notes?: string;
  tags?: string[];
  contacts_count?: number;
  jobs_count?: number;
  created_at: string;
  updated_at: string;
}

export interface Job {
  id: string;
  user_id: string;
  company_id?: string;
  company?: Company;
  title: string;
  url?: string;
  description?: string;
  location?: string;
  employment_type?: string;
  skills?: string[];
  analyzed_data?: {
    requiredSkills: string[];
    preferredSkills: string[];
    responsibilities: string[];
    technologies: string[];
    seniority: string;
    keywords: string[];
    summary: string;
  };
  status: 'saved' | 'applied' | 'interviewing' | 'archived';
  linkedin_job_id?: string;
  source: string;
  created_at: string;
  updated_at: string;
}

export interface Application {
  id: string;
  user_id: string;
  job_id?: string;
  job?: Job;
  contact_id?: string;
  contact?: Contact;
  company?: Company;
  applied_via: string;
  applied_date: string;
  status: 'draft' | 'applied' | 'phone-screen' | 'interview' | 'offer' | 'rejected' | 'withdrawn';
  notes?: string;
  interview_dates?: string[];
  referral_from?: string;
  created_at: string;
  updated_at: string;
}

export interface Email {
  id: string;
  user_id: string;
  contact_id?: string;
  contact?: Contact;
  job_id?: string;
  job?: Job;
  campaign_id?: string;
  type: 'cold-email' | 'follow-up' | 'referral' | 'thank-you' | 'alumni' | 'networking';
  subject: string;
  body: string;
  generated_by?: any;
  status: 'draft' | 'scheduled' | 'sent' | 'replied';
  scheduled_at?: string;
  sent_at?: string;
  gmail_message_id?: string;
  thread_id?: string;
  replied_at?: string;
  language: string;
  ab_variant?: string;
  quality_score?: any;
  created_at: string;
  updated_at: string;
}

export interface Campaign {
  id: string;
  user_id: string;
  name: string;
  description?: string;
  company_id?: string;
  contact_ids: string[];
  template_id?: string;
  status: 'draft' | 'active' | 'paused' | 'completed';
  ab_test?: any;
  stats?: {
    sent: number;
    replies: number;
    variantA?: { sent: number; replies: number; rate?: number };
    variantB?: { sent: number; replies: number; rate?: number };
    winner?: string | null;
  };
  created_at: string;
  updated_at: string;
}

export interface Template {
  id: string;
  user_id?: string;
  name: string;
  category: string;
  subject: string;
  body: string;
  variables: string[];
  language: string;
  is_default: boolean;
  is_public: boolean;
  author_alias?: string;
  usage_count: number;
  created_at: string;
}

export interface Followup {
  id: string;
  user_id: string;
  email_id: string;
  email?: Email;
  contact_id: string;
  contact?: Contact;
  campaign_id?: string;
  day_offset: number;
  status: 'pending-approval' | 'approved' | 'sent' | 'cancelled';
  scheduled_at: string;
  sent_at?: string;
  approved_by_user: boolean;
  created_at: string;
}

export interface NotificationItem {
  id: string;
  user_id: string;
  type: string;
  title: string;
  body?: string;
  message?: string;
  read: boolean;
  created_at: string;
}
