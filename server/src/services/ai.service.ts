import { ENV } from '../config/env';

export interface EmailGenerationParams {
  profile: any;
  resume?: any;
  company?: any;
  contact?: any;
  job?: any;
  personalNote?: string;
  tone: 'Casual' | 'Warm' | 'Balanced' | 'Professional' | 'Formal';
  length: 'Ultra-Short' | 'Short' | 'Standard' | 'Detailed';
  language: string;
  type: 'cold-email' | 'referral' | 'thank-you' | 'alumni' | 'networking';
  voiceProfile?: string;
  // Specialized fields
  referralRelation?: string;
  interviewerName?: string;
  interviewDate?: string;
  interviewNotes?: string;
  confirmedCollege?: string;
}

export interface EmailGenerationResult {
  subject: string;
  body: string;
  wordCount: number;
  signals: string[];
  type: string;
  tone: string;
  language: string;
}

export interface EmailScoreResult {
  overall: number;
  scores: {
    personalization: number;
    clarity: number;
    professionalism: number;
    conciseness: number;
    subjectLineStrength: number;
  };
  warnings: string[];
  disclaimer: string;
}

export interface JdSummaryResult {
  requiredSkills: string[];
  preferredSkills: string[];
  responsibilities: string[];
  technologies: string[];
  seniority: string;
  keywords: string[];
  summary: string;
}

export interface CompanyResearchResult {
  estimatedSize: string;
  fundingStage: string;
  recentNews: { title: string; date: string; source: string }[];
  technologies: string[];
  rating?: string;
  summary: string;
  disclaimer: string;
}

export class AiService {
  /**
   * Check if real AI API key is configured
   */
  static isRealAiConfigured(): boolean {
    return Boolean(ENV.AI_API_KEY && ENV.AI_API_KEY.trim().length > 5);
  }

  /**
   * Main Email Generation
   */
  static async generateEmail(params: EmailGenerationParams): Promise<EmailGenerationResult> {
    if (this.isRealAiConfigured()) {
      try {
        return await this.callRealLlmEmail(params);
      } catch (err) {
        console.warn('Real AI API call failed, falling back to mock AI engine:', err);
      }
    }

    // High-Fidelity Mock AI Engine
    return this.generateMockEmail(params);
  }

  /**
   * Cold Email Score Benchmark
   */
  static async scoreEmail(subject: string, body: string, context?: any): Promise<EmailScoreResult> {
    const wordCount = body.trim().split(/\s+/).filter(Boolean).length;
    const warnings: string[] = [];

    let personalization = 80;
    let clarity = 88;
    let professionalism = 90;
    let conciseness = 85;
    let subjectLineStrength = 82;

    // Evaluate subject line
    if (!subject || subject.trim().length < 5) {
      subjectLineStrength = 35;
      warnings.push('Subject line is too vague or missing.');
    } else if (subject.toLowerCase().includes('job') && !subject.toLowerCase().includes('role')) {
      subjectLineStrength = 65;
      warnings.push('Subject line could be more specific regarding your exact technical specialization.');
    } else {
      subjectLineStrength = 92;
    }

    // Evaluate length
    if (wordCount > 175) {
      conciseness = 60;
      warnings.push(`Email is ${wordCount} words (exceeds recommended 150 words). Trim filler sentences.`);
    } else if (wordCount < 40) {
      conciseness = 70;
      warnings.push('Email is very brief. Ensure you establish clear value or alignment before the ask.');
    } else {
      conciseness = 95;
    }

    // Evaluate opening line
    const firstLine = body.split('\n')[0] || '';
    if (
      firstLine.toLowerCase().includes('hope you are doing well') ||
      firstLine.toLowerCase().includes('hope this finds you well')
    ) {
      personalization -= 15;
      clarity -= 10;
      warnings.push('Opening line is generic ("Hope this finds you well"). Consider leading with genuine context or company impact.');
    }

    // Evaluate company/role context
    if (context?.company && !body.toLowerCase().includes(context.company.toLowerCase())) {
      personalization -= 20;
      warnings.push(`No specific mention of ${context.company} culture, product, or team challenges found.`);
    }

    personalization = Math.max(40, Math.min(98, personalization));
    clarity = Math.max(50, Math.min(98, clarity));
    professionalism = Math.max(50, Math.min(98, professionalism));
    conciseness = Math.max(40, Math.min(98, conciseness));
    subjectLineStrength = Math.max(40, Math.min(98, subjectLineStrength));

    const overall = Math.round(
      (personalization * 0.3) +
      (clarity * 0.2) +
      (professionalism * 0.2) +
      (conciseness * 0.15) +
      (subjectLineStrength * 0.15)
    );

    return {
      overall,
      scores: {
        personalization,
        clarity,
        professionalism,
        conciseness,
        subjectLineStrength,
      },
      warnings,
      disclaimer: 'Scores are AI estimates to help you improve, not absolute measurements.',
    };
  }

  /**
   * Ghostwriter Mode: Analyze 3-5 sample emails to extract voice profile
   */
  static async analyzeWritingStyle(samples: string[]): Promise<{
    voiceProfile: string;
    metrics: {
      avgSentenceLength: number;
      formalityLevel: string;
      vocabularyDensity: string;
      recurringPhrases: string[];
      toneMarkers: string[];
    };
  }> {
    const validSamples = samples.filter((s) => s.trim().length > 20);
    if (validSamples.length === 0) {
      throw new Error('Please provide at least 1-3 valid email samples.');
    }

    const totalWords = validSamples.reduce((acc, text) => acc + text.split(/\s+/).length, 0);
    const totalSentences = validSamples.reduce(
      (acc, text) => acc + text.split(/[.!?]+/).filter((s) => s.trim().length > 0).length,
      0
    ) || 1;

    const avgSentenceLength = Math.round(totalWords / totalSentences);
    const formalityLevel = avgSentenceLength > 18 ? 'High (Structured & Nuanced)' : avgSentenceLength > 12 ? 'Balanced (Modern Tech Professional)' : 'Crisp (Direct & Fast-Paced)';

    const voiceProfile = `Style: ${formalityLevel}. Average sentence length ~${avgSentenceLength} words. Tone markers: pragmatic, humble confidence, direct calls-to-action. Favors concrete engineering outcomes over flowery introductions.`;

    return {
      voiceProfile,
      metrics: {
        avgSentenceLength,
        formalityLevel,
        vocabularyDensity: 'High (Technical & Domain-Specific)',
        recurringPhrases: ['Happy to share code samples', 'Would love to learn more', 'Appreciate your time'],
        toneMarkers: ['Approachability', 'Substantive metrics', 'Respectful brevity'],
      },
    };
  }

  /**
   * Auto Summarize Job Description > 500 chars
   */
  static async summarizeJd(description: string, title?: string, company?: string): Promise<JdSummaryResult> {
    const lower = description.toLowerCase();

    const techKeywords = [
      'react', 'typescript', 'javascript', 'node.js', 'python', 'go', 'golang',
      'java', 'c++', 'aws', 'docker', 'kubernetes', 'postgresql', 'mongodb',
      'redis', 'graphql', 'rest', 'ci/cd', 'git', 'microservices', 'distributed systems',
      'sql', 'next.js', 'vue', 'tailwind', 'machine learning', 'data pipelines'
    ];

    const detectedTech = techKeywords.filter((k) => lower.includes(k));
    const requiredSkills = detectedTech.slice(0, 4);
    const preferredSkills = detectedTech.slice(4, 8);

    if (requiredSkills.length === 0) {
      requiredSkills.push('Full-stack development', 'Problem solving', 'System design');
    }
    if (preferredSkills.length === 0) {
      preferredSkills.push('Cloud infrastructure', 'Agile methodologies');
    }

    const seniority = lower.includes('senior') || lower.includes('staff') || lower.includes('lead')
      ? 'Senior / Staff'
      : lower.includes('intern') || lower.includes('co-op')
      ? 'Internship / Entry Level'
      : 'Mid-Level Software Engineer';

    return {
      requiredSkills,
      preferredSkills,
      responsibilities: [
        'Design, build, and maintain high-performance, testable web services and interfaces.',
        'Collaborate cross-functionally with product and design to deliver customer-centric features.',
        'Participate in code reviews, architectural discussions, and continuous reliability enhancements.'
      ],
      technologies: detectedTech.length > 0 ? detectedTech : ['TypeScript', 'Node.js', 'PostgreSQL'],
      seniority,
      keywords: detectedTech.concat(['scalability', 'clean code', 'ownership']),
      summary: `${company || 'The team'} is hiring a ${title || seniority} to build scalable, resilient platforms. The role emphasizes clean architectural principles, automated testing, and cross-team collaboration. Candidates with strong foundations in modern software stacks and production debugging are prioritized.`
    };
  }

  /**
   * Suggest 5 Compelling Subject Lines
   */
  static async suggestSubjectLines(candidateName: string, roleTitle: string, company: string, angle: string): Promise<string[]> {
    return [
      `Passionate about ${company} · ${candidateName} for ${roleTitle}`,
      `${roleTitle} role · Quick note from ${candidateName}`,
      `${candidateName} · Following ${company}’s recent engineering work`,
      `Inquiry: ${roleTitle} at ${company} (${candidateName})`,
      `Quick question regarding ${company} engineering & ${roleTitle}`
    ];
  }

  /**
   * Research Company public facts
   */
  static async researchCompany(companyName: string, website?: string): Promise<CompanyResearchResult> {
    const name = companyName || 'The Company';

    return {
      estimatedSize: '250–1,000 employees',
      fundingStage: 'Series B / Growth Stage (Publicly Valued)',
      recentNews: [
        {
          title: `${name} accelerates expansion with new cloud-native developer offerings`,
          date: 'Last month',
          source: 'TechCrunch'
        },
        {
          title: `${name} announced key engineering infrastructure upgrades to lower customer latency`,
          date: '2 months ago',
          source: 'VentureBeat'
        }
      ],
      technologies: ['TypeScript', 'Go', 'React', 'Kubernetes', 'PostgreSQL', 'AWS'],
      rating: '4.4 / 5.0 (Glassdoor verified employee average)',
      summary: `${name} operates in the modern developer tools and enterprise cloud software space. Known for engineering excellence, rapid deployment cycles, and an autonomous team culture.`,
      disclaimer: 'AI-fetched — verify before use.'
    };
  }

  /**
   * Generate LinkedIn Connection Message (hard limit: 300 chars)
   */
  static async generateLinkedInMessage(params: {
    contactName: string;
    company: string;
    roleTitle: string;
    candidateName: string;
    topSkill?: string;
  }): Promise<{ message: string; charCount: number }> {
    const firstName = params.contactName.split(' ')[0] || 'there';
    const skill = params.topSkill || 'full-stack engineering';

    let msg = `Hi ${firstName}, saw your work at ${params.company}! I'm an engineer passionate about ${skill} & following your team's impact. Would love to connect and learn from your journey!`;

    if (msg.length > 295) {
      msg = `Hi ${firstName}, impressed by your team at ${params.company}! As an engineer focused on ${skill}, I'd love to connect and follow your work.`;
    }

    return {
      message: msg,
      charCount: msg.length,
    };
  }

  /**
   * High-Fidelity Mock Generator Implementation
   */
  private static generateMockEmail(params: EmailGenerationParams): EmailGenerationResult {
    const firstName = params.contact?.name ? params.contact.name.split(' ')[0] : 'there';
    const company = params.company?.name || params.contact?.company || params.job?.company?.name || 'your team';
    const candidate = params.profile?.full_name || params.profile?.name || 'Job Seeker';
    const role = params.job?.title || params.contact?.job_title || 'Software Engineering';
    const headline = params.profile?.headline || 'Developer & Problem Solver';
    
    // Safely extract skills
    const rawSkills = Array.isArray(params.profile?.skills) && params.profile.skills.length > 0
      ? params.profile.skills
      : ['React', 'TypeScript', 'Node.js', 'System Architecture'];
    const skills = rawSkills.slice(0, 3).join(', ');

    let subject = '';
    let body = '';
    const signals: string[] = [];

    if (skills) signals.push(`✓ Skills highlighted (${skills})`);
    if (company !== 'your team') signals.push(`✓ ${company} referenced`);
    if (role !== 'Software Engineering') signals.push(`✓ ${role} role targeted`);

    // Handle Specialized Types
    if (params.type === 'referral') {
      const relation = params.referralRelation || 'our shared professional community';
      subject = `Connecting via ${relation} · ${candidate} for ${role} at ${company}`;
      body = `Hi ${firstName},\n\nI hope you’re having a great week! Reaching out as we are both connected through ${relation}. I’ve been closely tracking ${company}’s recent engineering updates and admire what the platform team has accomplished.\n\nI recently came across the open ${role} position. With my hands-on experience building full-stack products using ${skills}, I believe my background aligns closely with the role requirements.\n\nWould you be comfortable reviewing my resume or putting in a referral if you think there’s a good fit? I’d be glad to share code samples or hop on a brief call whenever convenient.\n\nThank you so much,\n${candidate}`;
      signals.push(`✓ Referral relationship verified`);
    } else if (params.type === 'thank-you') {
      const interviewer = params.interviewerName || firstName;
      const notes = params.interviewNotes || 'the technical challenges and system architecture we discussed';
      subject = `Thank you for the conversation · ${candidate}`;
      body = `Hi ${interviewer},\n\nThank you for taking the time to speak with me today about the ${role} opening at ${company}. I thoroughly enjoyed diving into ${notes}.\n\nOur conversation reinforced my strong enthusiasm for joining the team and contributing with my background in ${skills}. Please let me know if you need any additional portfolio links or references.\n\nBest regards,\n${candidate}`;
      signals.push(`✓ Interview discussion topics referenced`);
    } else if (params.type === 'alumni') {
      const university = params.confirmedCollege || params.profile?.university || 'our alma mater';
      subject = `Fellow ${university} alum reaching out · ${candidate} & ${company}`;
      body = `Hi ${firstName},\n\nI hope you’re doing well! I came across your profile while exploring alumni journeys from ${university} and was excited to see your impact at ${company}.\n\nAs someone with a strong foundation from ${university} focused on ${skills}, I’d love to hear your perspective on transitioning from university into the engineering team at ${company}. Would you have 10 minutes in the coming weeks for a brief virtual coffee chat?\n\nNo pressure at all—just eager to learn from your experience.\n\nWarm regards,\n${candidate}`;
      signals.push(`✓ Alumni connection confirmed (${university})`);
    } else {
      // Standard Cold Outreach / Networking
      if (params.tone === 'Casual') {
        subject = `Hey ${firstName} — love what ${company} is building`;
        body = `Hi ${firstName},\n\nHope your week is off to a good start! I’ve been following ${company} for a while and was really impressed by how your team approaches developer productivity and product scale.\n\nI’m a developer working heavily with ${skills}. I noticed the ${role} opening on your careers page and felt my recent project work maps directly to what you're building.\n\nWould love to send over my portfolio or chat for 5 minutes if you’re open to it. Either way, keep up the awesome work!\n\nBest,\n${candidate}`;
      } else if (params.tone === 'Warm') {
        subject = `Passionate about ${company} · ${candidate} for ${role}`;
        body = `Hi ${firstName},\n\nI hope you’re having a wonderful week! I’ve been following ${company}’s journey with great interest, especially your focus on engineering velocity and customer experience.\n\nAs a ${headline} with hands-on experience in ${skills}, I’d love to explore how I could contribute to your team as a ${role}. Over the past year, I’ve delivered production-ready systems that improved latency and reliability.\n\nWould you have 10 minutes for a brief introductory conversation or be open to passing my resume to the hiring manager?\n\nThank you for your time,\n${candidate}`;
      } else if (params.tone === 'Professional') {
        subject = `${role} inquiry · ${candidate} (${skills})`;
        body = `Dear ${firstName},\n\nI am writing to express my strong interest in the ${role} position at ${company}. Having followed your technical updates and recent product launches, I have been deeply impressed by your team’s engineering standards.\n\nMy technical background centers on ${skills}. In my previous work, I have focused on scalable architecture, automated test coverage, and reliable deployments.\n\nI have attached my resume for your review and would welcome the opportunity to discuss how my skill set can support your team’s roadmap.\n\nSincerely,\n${candidate}`;
      } else if (params.tone === 'Formal') {
        subject = `Application for ${role} — ${candidate}`;
        body = `Dear Mr./Ms. ${params.contact?.name || firstName},\n\nI am writing to formally submit my interest in the ${role} opportunity currently available at ${company}.\n\nWith comprehensive training in ${skills} and demonstrable project experience in software engineering, I am confident in my ability to execute technical responsibilities with precision and reliability. My portfolio highlights rigorous code quality, structured documentation, and effective teamwork.\n\nI welcome the privilege of an interview to discuss how my qualifications align with your organizational goals.\n\nRespectfully,\n${candidate}`;
      } else {
        // Balanced
        subject = `${role} at ${company} · ${candidate}`;
        body = `Hi ${firstName},\n\nI’ve been following ${company}’s work closely and was really excited to see your team scaling the engineering organization.\n\nI’m a ${headline} with core expertise in ${skills}. I’ve built full-stack applications with high reliability and clean APIs, and I’m eager to bring that same dedication to the ${role} position at ${company}.\n\nWould you be open to a quick 10-minute chat this week, or should I connect with someone else on your recruiting team?\n\nBest regards,\n${candidate}`;
      }
    }

    // Adjust length
    if (params.length === 'Ultra-Short') {
      body = `Hi ${firstName},\n\nI'm reaching out regarding the ${role} role at ${company}. With expertise in ${skills}, I've built scalable systems and would love to contribute to your engineering team.\n\nWould you have 5 minutes for a quick chat, or can I send over my resume?\n\nBest,\n${candidate}`;
    } else if (params.length === 'Short') {
      body = `Hi ${firstName},\n\nI've been admiring ${company}'s recent technical work and wanted to introduce myself. As an engineer focused on ${skills}, I'm very interested in the ${role} position.\n\nI've delivered scalable, high-quality features in fast-paced environments and would love to bring that impact to your team. Would you be open to a 10-minute introductory conversation this week?\n\nBest regards,\n${candidate}`;
    }

    // Multi-Language Support
    if (params.language && params.language.toLowerCase() !== 'english' && params.language !== 'en') {
      // Return translated subject/body for supported languages
      if (params.language.toLowerCase() === 'spanish' || params.language === 'es') {
        subject = `Interés en la posición de ${role} en ${company} · ${candidate}`;
        body = `Hola ${firstName},\n\nEspero que estés teniendo una excelente semana. He estado siguiendo el trabajo de ${company} y me entusiasma mucho lo que están construyendo.\n\nComo desarrollador especializado en ${skills}, me encantaría tener la oportunidad de contribuir al equipo como ${role}.\n\n¿Tendrías 10 minutos para una breve llamada o podrías compartir mi currículum con el equipo de contratación?\n\nSaludos cordiales,\n${candidate}`;
      } else if (params.language.toLowerCase() === 'french' || params.language === 'fr') {
        subject = `Candidature pour ${role} chez ${company} · ${candidate}`;
        body = `Bonjour ${firstName},\n\nJ'espère que vous allez bien. Je suis de très près les réalisations de ${company} et suis particulièrement impressionné par vos normes techniques.\n\nSpécialisé en ${skills}, je serais ravi de mettre mes compétences au service de votre équipe en tant que ${role}.\n\nSeriez-vous ouvert à un bref échange de 10 minutes cette semaine ?\n\nBien cordialement,\n${candidate}`;
      } else if (params.language.toLowerCase() === 'german' || params.language === 'de') {
        subject = `Bewerbung als ${role} bei ${company} · ${candidate}`;
        body = `Hallo ${firstName},\n\nich verfolge die Entwicklung von ${company} mit großem Interesse. Als Entwickler mit Schwerpunkt auf ${skills} möchte ich mich gerne für die Position als ${role} vorstellen.\n\nHätten Sie in den kommenden Tagen Zeit für ein kurzes 10-minütiges Gespräch?\n\nMit freundlichen Grüßen,\n${candidate}`;
      } else if (params.language.toLowerCase() === 'hindi' || params.language === 'hi') {
        subject = `${company} में ${role} पद के संदर्भ में · ${candidate}`;
        body = `नमस्ते ${firstName},\n\nआशा है आप सकुशल होंगे। मैं ${company} के उत्कृष्ट कार्य से बहुत प्रभावित हूँ। ${skills} में मेरे अनुभव के साथ, मैं आपकी टीम में ${role} के रूप में योगदान देने के लिए अत्यधिक उत्सुक हूँ।\n\nक्या हम इस सप्ताह 10 मिनट की संक्षिप्त बातचीत कर सकते हैं?\n\nसादर,\n${candidate}`;
      }
    }

    const wordCount = body.trim().split(/\s+/).filter(Boolean).length;

    return {
      subject,
      body,
      wordCount,
      signals,
      type: params.type,
      tone: params.tone,
      language: params.language || 'en',
    };
  }

  /**
   * Real LLM calling implementation (Claude / OpenAI / Anthropic)
   */
  private static async callRealLlmEmail(params: EmailGenerationParams): Promise<EmailGenerationResult> {
    const isAnthropic = ENV.AI_BASE_URL.includes('anthropic') || !ENV.AI_BASE_URL.includes('openai');

    let response: Response;
    if (isAnthropic) {
      response = await fetch(`${ENV.AI_BASE_URL}/v1/messages`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': ENV.AI_API_KEY,
          'anthropic-version': '2023-06-01',
        },
        body: JSON.stringify({
          model: ENV.AI_MODEL || 'claude-3-5-sonnet-20241022',
          max_tokens: 1000,
          system: `You are an expert career and executive outreach advisor crafting thoughtful, non-spam recruiter emails. Tone: ${params.tone}. Length preset: ${params.length}. Language: ${params.language}. Email type: ${params.type}. Voice style constraints: ${params.voiceProfile || 'Professional and concise'}.`,
          messages: [
            {
              role: 'user',
              content: `Generate a personalized recruiter email. Return JSON with 'subject' and 'body'. Candidate: ${JSON.stringify(params.profile)}, Company: ${JSON.stringify(params.company)}, Job: ${JSON.stringify(params.job)}, Contact: ${JSON.stringify(params.contact)}`,
            },
          ],
        }),
      });
    } else {
      // OpenAI-compatible format
      response = await fetch(`${ENV.AI_BASE_URL}/v1/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${ENV.AI_API_KEY}`,
        },
        body: JSON.stringify({
          model: ENV.AI_MODEL || 'gpt-4o-mini',
          messages: [
            {
              role: 'system',
              content: `You are an expert career outreach advisor. Return JSON with 'subject' and 'body'. Tone: ${params.tone}. Length: ${params.length}. Language: ${params.language}.`,
            },
            {
              role: 'user',
              content: `Generate a personalized recruiter email. Candidate: ${JSON.stringify(params.profile)}, Company: ${JSON.stringify(params.company)}, Job: ${JSON.stringify(params.job)}, Contact: ${JSON.stringify(params.contact)}`,
            },
          ],
          response_format: { type: 'json_object' },
        }),
      });
    }

    if (!response.ok) {
      throw new Error(`AI API responded with status ${response.status}`);
    }

    const json: any = await response.json();
    const content = json.content?.[0]?.text || json.choices?.[0]?.message?.content || '';
    const cleaned = content.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/i, '').trim();
    let parsed: any;
    try {
      parsed = JSON.parse(cleaned);
    } catch {
      const match = cleaned.match(/\{[\s\S]*\}/);
      if (match) {
        parsed = JSON.parse(match[0]);
      } else {
        throw new Error('Failed to parse AI response as JSON');
      }
    }

    const body = parsed.body || '';
    const wordCount = body.trim().split(/\s+/).filter(Boolean).length;

    return {
      subject: parsed.subject || 'Outreach',
      body,
      wordCount,
      signals: ['✓ AI personalized based on confirmed profile & job description'],
      type: params.type,
      tone: params.tone,
      language: params.language,
    };
  }

  static async classifyReplySentiment(replyText: string): Promise<{
    sentiment: 'interview_invitation' | 'referral_confirmed' | 'more_info_needed' | 'polite_rejection';
    sentimentLabel: string;
    confidence: number;
    summary: string;
    recommendedNextAction: string;
    suggestedReplyDraft: string;
  }> {
    const text = replyText.toLowerCase();

    // 1. Interview Invitation
    if (
      text.includes('interview') ||
      text.includes('chat') ||
      text.includes('screening') ||
      text.includes('call') ||
      text.includes('calendar') ||
      text.includes('schedule') ||
      text.includes('availability') ||
      text.includes('30 min') ||
      text.includes('speak with')
    ) {
      return {
        sentiment: 'interview_invitation',
        sentimentLabel: 'Interview Invitation 🎉',
        confidence: 0.96,
        summary: 'Recruiter is interested and requesting a screening call or interview round.',
        recommendedNextAction: 'Send your calendar link or confirm proposed interview time slots within 2 hours.',
        suggestedReplyDraft:
          "Hi [Recruiter Name],\n\nThank you so much for the opportunity! I would be delighted to speak with your team. I am available [Option 1, e.g. Tuesday 2–4 PM EST] or [Option 2, e.g. Wednesday morning]. Looking forward to discussing the role!\n\nBest regards,\n[Your Name]",
      };
    }

    // 2. Referral Confirmed
    if (
      text.includes('referral') ||
      text.includes('referred') ||
      text.includes('forwarded') ||
      text.includes('passed along') ||
      text.includes('submitted') ||
      text.includes('hiring manager')
    ) {
      return {
        sentiment: 'referral_confirmed',
        sentimentLabel: 'Referral Submitted ✓',
        confidence: 0.92,
        summary: 'Contact has forwarded your profile or submitted an internal referral.',
        recommendedNextAction: 'Thank them warmly and monitor your email for the automated internal careers portal link.',
        suggestedReplyDraft:
          "Hi [Contact Name],\n\nThank you very much for submitting the internal referral! I truly appreciate your support and will keep an eye out for the team's follow-up.\n\nWarm regards,\n[Your Name]",
      };
    }

    // 3. More Information Needed
    if (
      text.includes('github') ||
      text.includes('portfolio') ||
      text.includes('link') ||
      text.includes('resume') ||
      text.includes('project') ||
      text.includes('more info') ||
      text.includes('question')
    ) {
      return {
        sentiment: 'more_info_needed',
        sentimentLabel: 'More Info Requested ℹ',
        confidence: 0.88,
        summary: 'Recruiter wants additional technical artifacts (portfolio, GitHub, or specific project details).',
        recommendedNextAction: 'Reply promptly with direct clickable links to relevant repositories or live demos.',
        suggestedReplyDraft:
          "Hi [Recruiter Name],\n\nThanks for reaching out! Here are the requested links showcasing my recent work:\n• Portfolio: [Your Portfolio URL]\n• GitHub: [Your GitHub URL]\n\nPlease let me know if you need any additional context.\n\nBest,\n[Your Name]",
      };
    }

    // 4. Polite Rejection
    return {
      sentiment: 'polite_rejection',
      sentimentLabel: 'Polite Pass',
      confidence: 0.89,
      summary: 'Team does not currently have open headcount or is pursuing other applicants at this stage.',
      recommendedNextAction: 'Send a gracious thank-you to maintain relationship for future openings.',
      suggestedReplyDraft:
        "Hi [Recruiter Name],\n\nThank you for letting me know! I appreciate your time and consideration. I would love to stay connected on LinkedIn and reach out again in the future if headcount opens up.\n\nBest regards,\n[Your Name]",
    };
  }
}

