import { createClient, SupabaseClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { ENV } from '../config/env';

// Initialize Supabase if keys are provided
let supabase: SupabaseClient | null = null;
if (ENV.SUPABASE_URL && ENV.SUPABASE_SERVICE_ROLE_KEY) {
  try {
    supabase = createClient(ENV.SUPABASE_URL, ENV.SUPABASE_SERVICE_ROLE_KEY, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });
    console.log('✓ Connected to Supabase backend service');
  } catch (err) {
    console.warn('⚠️ Could not initialize Supabase client:', err);
  }
}

// Local JSON file store for offline dev fallback
const LOCAL_DB_DIR = path.resolve(__dirname, '../../data');
const LOCAL_DB_FILE = path.join(LOCAL_DB_DIR, 'local_db.json');
const LOCAL_STORAGE_DIR = path.join(LOCAL_DB_DIR, 'storage');

if (!fs.existsSync(LOCAL_DB_DIR)) {
  fs.mkdirSync(LOCAL_DB_DIR, { recursive: true });
}
if (!fs.existsSync(LOCAL_STORAGE_DIR)) {
  fs.mkdirSync(LOCAL_STORAGE_DIR, { recursive: true });
}

interface LocalDbSchema {
  users: any[];
  profiles: any[];
  resume_versions: any[];
  contacts: any[];
  contact_timeline: any[];
  companies: any[];
  jobs: any[];
  applications: any[];
  emails: any[];
  campaigns: any[];
  templates: any[];
  follow_ups: any[];
  integrations: any[];
  notifications: any[];
}

function loadLocalDb(): LocalDbSchema {
  if (!fs.existsSync(LOCAL_DB_FILE)) {
    const initialDb: LocalDbSchema = {
      users: [],
      profiles: [],
      resume_versions: [],
      contacts: [],
      contact_timeline: [],
      companies: [],
      jobs: [],
      applications: [],
      emails: [],
      campaigns: [],
      templates: getDefaultTemplates(),
      follow_ups: [],
      integrations: [],
      notifications: [],
    };
    fs.writeFileSync(LOCAL_DB_FILE, JSON.stringify(initialDb, null, 2));
    return initialDb;
  }
  try {
    const raw = fs.readFileSync(LOCAL_DB_FILE, 'utf-8');
    return JSON.parse(raw);
  } catch {
    return {
      users: [],
      profiles: [],
      resume_versions: [],
      contacts: [],
      contact_timeline: [],
      companies: [],
      jobs: [],
      applications: [],
      emails: [],
      campaigns: [],
      templates: getDefaultTemplates(),
      follow_ups: [],
      integrations: [],
      notifications: [],
    };
  }
}

function saveLocalDb(data: LocalDbSchema) {
  fs.writeFileSync(LOCAL_DB_FILE, JSON.stringify(data, null, 2));
}

function getDefaultTemplates(): any[] {
  return [
    {
      id: 'a0000001-0000-0000-0000-000000000001',
      user_id: null,
      name: 'Software Engineer Intern Outreach',
      category: 'internship',
      subject: 'Passionate about {{company}} engineering · {{candidateName}} for {{roleTitle}}',
      body: 'Hi {{firstName}},\n\nI’ve been following {{company}}’s work on distributed systems, particularly how your team scaled real-time event streaming. As a computer science student graduating in {{graduationYear}}, I’ve built full-stack distributed apps using {{topSkills}}.\n\nI’d love to contribute to your engineering team as a {{roleTitle}} for Summer 2026. Would you be open to a brief 10-minute chat or passing my resume along to the hiring team?\n\nBest regards,\n{{candidateName}}',
      variables: ['firstName', 'company', 'candidateName', 'roleTitle', 'graduationYear', 'topSkills'],
      language: 'en',
      is_default: true,
      is_public: true,
      author_alias: 'StanfordHacker',
      usage_count: 342,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
    {
      id: 'a0000001-0000-0000-0000-000000000002',
      user_id: null,
      name: 'Alumni Warm Introduction & Coffee Chat',
      category: 'alumni',
      subject: 'Fellow {{university}} alum reaching out · Quick advice on {{company}}?',
      body: 'Hi {{firstName}},\n\nI hope you’re having a great week! I came across your profile while exploring alumni journeys from {{university}}. Huge congratulations on your recent impact at {{company}}!\n\nI am currently completing my degree in {{degree}} at {{university}} and am eager to learn more about the engineering culture and expectations at {{company}}. Would you have 10 minutes for a virtual coffee chat in the coming weeks?\n\nNo expectations at all—just eager to learn from your experience.\n\nWarm regards,\n{{candidateName}}',
      variables: ['firstName', 'university', 'company', 'degree', 'candidateName'],
      language: 'en',
      is_default: true,
      is_public: true,
      author_alias: 'CrimsonDev',
      usage_count: 218,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
    {
      id: 'a0000001-0000-0000-0000-000000000003',
      user_id: null,
      name: 'High-Impact Technical Recruiter Pitch',
      category: 'recruiter',
      subject: '{{roleTitle}} inquiry · {{candidateName}} ({{topSkills}})',
      body: 'Hi {{firstName}},\n\nI saw that {{company}} is actively looking for a {{roleTitle}}. Over the past year, I have engineered production systems handling high-concurrency workloads using {{topSkills}}, cutting latency by 35%.\n\nI believe my background directly aligns with what {{company}} is building. I have attached my resume and would welcome the opportunity to discuss how my skill set could benefit your team.\n\nThanks for your time and consideration,\n{{candidateName}}',
      variables: ['firstName', 'company', 'roleTitle', 'candidateName', 'topSkills'],
      language: 'en',
      is_default: true,
      is_public: true,
      author_alias: 'TechTalentPro',
      usage_count: 489,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
    {
      id: 'a0000001-0000-0000-0000-000000000004',
      user_id: null,
      name: 'Post-Interview Thoughtful Thank You',
      category: 'thank-you',
      subject: 'Thank you for our conversation today · {{candidateName}}',
      body: 'Hi {{firstName}},\n\nThank you for taking the time to speak with me today about the {{roleTitle}} position at {{company}}. I really enjoyed our discussion around {{specificTopic}} and learning more about how your team approaches architectural trade-offs.\n\nOur conversation further reinforced my excitement about joining {{company}}. Please let me know if you need any additional code samples or references.\n\nBest regards,\n{{candidateName}}',
      variables: ['firstName', 'roleTitle', 'company', 'specificTopic', 'candidateName'],
      language: 'en',
      is_default: true,
      is_public: true,
      author_alias: 'CareerMentor',
      usage_count: 167,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
    {
      id: 'a0000001-0000-0000-0000-000000000005',
      user_id: null,
      name: 'Polite Value-Add Follow-Up',
      category: 'follow-up',
      subject: 'Following up on {{roleTitle}} application · {{candidateName}}',
      body: 'Hi {{firstName}},\n\nI wanted to briefly follow up on my note from last week regarding the {{roleTitle}} role at {{company}}. Since my last email, I also open-sourced a project addressing {{relevantProblem}}, which had similar design patterns to what {{company}} is tackling.\n\nI understand your schedule is busy, but I remain very interested in the team. Let me know if you have any questions!\n\nBest,\n{{candidateName}}',
      variables: ['firstName', 'roleTitle', 'company', 'candidateName', 'relevantProblem'],
      language: 'en',
      is_default: true,
      is_public: true,
      author_alias: 'InboxMaverick',
      usage_count: 312,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
    {
      id: 'a0000001-0000-0000-0000-000000000006',
      user_id: null,
      name: 'Mutual Connection Referral Request',
      category: 'referral',
      subject: '{{referrerName}} suggested I connect · {{roleTitle}} at {{company}}',
      body: 'Hi {{firstName}},\n\n{{referrerName}} suggested I reach out to you directly! They mentioned your work leading the platform team at {{company}} and thought our backgrounds would resonate.\n\nI recently applied for the {{roleTitle}} role. Given my background in {{topSkills}}, {{referrerName}} thought I would be a natural fit. Would you be open to reviewing my portfolio or putting in a referral if you agree?\n\nThank you so much,\n{{candidateName}}',
      variables: ['referrerName', 'firstName', 'company', 'roleTitle', 'topSkills', 'candidateName'],
      language: 'en',
      is_default: true,
      is_public: true,
      author_alias: 'NetworkNinjas',
      usage_count: 195,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
  ];
}

/**
 * DB Service providing unified query methods with strict user_id isolation
 */
export class DbService {
  /**
   * Universal Find Many
   */
  static async findMany<T = any>(
    table: keyof LocalDbSchema,
    query: Record<string, any> = {},
    options: { orderBy?: string; ascending?: boolean; limit?: number; offset?: number } = {}
  ): Promise<T[]> {
    if (supabase) {
      try {
        let q = supabase.from(table).select('*');
        for (const [key, val] of Object.entries(query)) {
          if (val === null) {
            q = q.is(key, null);
          } else if (Array.isArray(val)) {
            q = q.in(key, val);
          } else {
            q = q.eq(key, val);
          }
        }
        if (options.orderBy) {
          q = q.order(options.orderBy, { ascending: options.ascending ?? false });
        }
        if (options.limit) {
          const from = options.offset || 0;
          q = q.range(from, from + options.limit - 1);
        }
        const { data, error } = await q;
        if (error) throw error;
        return (data as T[]) || [];
      } catch (err) {
        console.warn(`Supabase findMany fallback to local DB for ${table}:`, err);
      }
    }

    // Local fallback
    const db = loadLocalDb();
    let records = (db[table] || []) as any[];

    // Filter
    records = records.filter((item) => {
      for (const [key, val] of Object.entries(query)) {
        if (val === null) {
          if (item[key] !== null && item[key] !== undefined) return false;
        } else if (Array.isArray(val)) {
          if (!val.includes(item[key])) return false;
        } else {
          if (item[key] !== val) return false;
        }
      }
      return true;
    });

    // Sort
    if (options.orderBy) {
      const field = options.orderBy;
      const asc = options.ascending ?? false;
      records.sort((a, b) => {
        const valA = a[field];
        const valB = b[field];
        if (valA < valB) return asc ? -1 : 1;
        if (valA > valB) return asc ? 1 : -1;
        return 0;
      });
    }

    // Pagination
    if (options.limit !== undefined) {
      const from = options.offset || 0;
      records = records.slice(from, from + options.limit);
    }

    return records as T[];
  }

  /**
   * Universal Find One
   */
  static async findOne<T = any>(
    table: keyof LocalDbSchema,
    query: Record<string, any>
  ): Promise<T | null> {
    const list = await this.findMany<T>(table, query, { limit: 1 });
    return list[0] || null;
  }

  /**
   * Universal Find by ID (must specify userId for user-owned tables)
   */
  static async findById<T = any>(
    table: keyof LocalDbSchema,
    id: string,
    userId?: string
  ): Promise<T | null> {
    const query: Record<string, any> = { id };
    if (userId && table !== 'users' && table !== 'templates') {
      query.user_id = userId;
    }
    return this.findOne<T>(table, query);
  }

  /**
   * Universal Insert
   */
  static async insert<T = any>(table: keyof LocalDbSchema, data: any): Promise<T> {
    const now = new Date().toISOString();
    const record = {
      id: data.id || crypto.randomUUID(),
      ...data,
      created_at: data.created_at || now,
      updated_at: data.updated_at || now,
    };

    if (supabase) {
      try {
        const { data: inserted, error } = await supabase
          .from(table)
          .insert(record)
          .select()
          .single();
        if (error) throw error;
        return inserted as T;
      } catch (err) {
        console.warn(`Supabase insert fallback to local DB for ${table}:`, err);
      }
    }

    const db = loadLocalDb();
    if (!db[table]) db[table] = [];
    db[table].push(record);
    saveLocalDb(db);
    return record as T;
  }

  /**
   * Universal Update (scoped to userId for user-owned tables)
   */
  static async update<T = any>(
    table: keyof LocalDbSchema,
    query: Record<string, any>,
    updates: any
  ): Promise<T | null> {
    const now = new Date().toISOString();
    const updatedFields = {
      ...updates,
      updated_at: now,
    };

    if (supabase) {
      try {
        let q = supabase.from(table).update(updatedFields);
        for (const [key, val] of Object.entries(query)) {
          q = q.eq(key, val);
        }
        const { data, error } = await q.select();
        if (error) throw error;
        return (data && data[0]) as T;
      } catch (err) {
        console.warn(`Supabase update fallback to local DB for ${table}:`, err);
      }
    }

    const db = loadLocalDb();
    let updatedRecord: any = null;
    db[table] = (db[table] || []).map((item) => {
      let match = true;
      for (const [k, v] of Object.entries(query)) {
        if (item[k] !== v) {
          match = false;
          break;
        }
      }
      if (match) {
        updatedRecord = { ...item, ...updatedFields };
        return updatedRecord;
      }
      return item;
    });

    saveLocalDb(db);
    return updatedRecord as T;
  }

  /**
   * Universal Delete (scoped to userId)
   */
  static async delete(table: keyof LocalDbSchema, query: Record<string, any>): Promise<boolean> {
    if (supabase) {
      try {
        let q = supabase.from(table).delete();
        for (const [key, val] of Object.entries(query)) {
          q = q.eq(key, val);
        }
        const { error } = await q;
        if (error) throw error;
        return true;
      } catch (err) {
        console.warn(`Supabase delete fallback to local DB for ${table}:`, err);
      }
    }

    const db = loadLocalDb();
    const initialLen = (db[table] || []).length;
    db[table] = (db[table] || []).filter((item) => {
      for (const [k, v] of Object.entries(query)) {
        if (item[k] === v) return false;
      }
      return true;
    });

    saveLocalDb(db);
    return db[table].length < initialLen;
  }

  /**
   * Count records
   */
  static async count(table: keyof LocalDbSchema, query: Record<string, any> = {}): Promise<number> {
    const list = await this.findMany(table, query);
    return list.length;
  }

  /**
   * Storage: Upload Resume / Profile file
   */
  static async uploadFile(
    bucket: string,
    filePath: string,
    fileBuffer: Buffer,
    contentType: string
  ): Promise<string> {
    if (supabase) {
      try {
        const { data, error } = await supabase.storage
          .from(bucket)
          .upload(filePath, fileBuffer, {
            contentType,
            upsert: true,
          });
        if (error) throw error;
        const { data: publicData } = supabase.storage.from(bucket).getPublicUrl(filePath);
        return publicData.publicUrl || `/storage/${bucket}/${filePath}`;
      } catch (err) {
        console.warn(`Supabase Storage upload fallback to local storage:`, err);
      }
    }

    // Local file storage
    const targetPath = path.join(LOCAL_STORAGE_DIR, filePath);
    const dir = path.dirname(targetPath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(targetPath, fileBuffer);
    return `/api/storage/${filePath}`;
  }

  /**
   * Storage: Delete file
   */
  static async deleteFile(bucket: string, filePath: string): Promise<boolean> {
    if (supabase) {
      try {
        const { error } = await supabase.storage.from(bucket).remove([filePath]);
        if (error) throw error;
        return true;
      } catch (err) {
        console.warn(`Supabase Storage delete fallback to local storage:`, err);
      }
    }

    const targetPath = path.join(LOCAL_STORAGE_DIR, filePath);
    if (fs.existsSync(targetPath)) {
      fs.unlinkSync(targetPath);
      return true;
    }
    return false;
  }
}

export default supabase;
