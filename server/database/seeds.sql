-- ============================================================================
-- MAILMINT SEED DATA - PUBLIC TEMPLATES FOR MARKETPLACE
-- ============================================================================

insert into templates (id, user_id, name, category, subject, body, variables, language, is_default, is_public, author_alias, usage_count)
values
(
  'a0000001-0000-0000-0000-000000000001',
  null,
  'Software Engineer Intern Outreach',
  'internship',
  'Passionate about {{company}} engineering · {{candidateName}} for {{roleTitle}}',
  'Hi {{firstName}},\n\nI’ve been following {{company}}’s work on distributed systems, particularly how your team scaled real-time event streaming. As a computer science student graduating in {{graduationYear}}, I’ve built full-stack distributed apps using {{topSkills}}.\n\nI’d love to contribute to your engineering team as a {{roleTitle}} for Summer 2026. Would you be open to a brief 10-minute chat or passing my resume along to the hiring team?\n\nBest regards,\n{{candidateName}}',
  array['firstName', 'company', 'candidateName', 'roleTitle', 'graduationYear', 'topSkills'],
  'en',
  true,
  true,
  'StanfordHacker',
  342
),
(
  'a0000001-0000-0000-0000-000000000002',
  null,
  'Alumni Warm Introduction & Coffee Chat',
  'alumni',
  'Fellow {{university}} alum reaching out · Quick advice on {{company}}?',
  'Hi {{firstName}},\n\nI hope you’re having a great week! I came across your profile while exploring alumni journeys from {{university}}. Huge congratulations on your recent impact at {{company}}!\n\nI am currently completing my degree in {{degree}} at {{university}} and am eager to learn more about the engineering culture and expectations at {{company}}. Would you have 10 minutes for a virtual coffee chat in the coming weeks?\n\nNo expectations at all—just eager to learn from your experience.\n\nWarm regards,\n{{candidateName}}',
  array['firstName', 'university', 'company', 'degree', 'candidateName'],
  'en',
  true,
  true,
  'CrimsonDev',
  218
),
(
  'a0000001-0000-0000-0000-000000000003',
  null,
  'High-Impact Technical Recruiter Pitch',
  'recruiter',
  '{{roleTitle}} inquiry · {{candidateName}} ({{topSkills}})',
  'Hi {{firstName}},\n\nI saw that {{company}} is actively looking for a {{roleTitle}}. Over the past year, I have engineered production systems handling high-concurrency workloads using {{topSkills}}, cutting latency by 35%.\n\nI believe my background directly aligns with what {{company}} is building. I have attached my resume and would welcome the opportunity to discuss how my skill set could benefit your team.\n\nThanks for your time and consideration,\n{{candidateName}}',
  array['firstName', 'company', 'roleTitle', 'candidateName', 'topSkills'],
  'en',
  true,
  true,
  'TechTalentPro',
  489
),
(
  'a0000001-0000-0000-0000-000000000004',
  null,
  'Post-Interview Thoughtful Thank You',
  'thank-you',
  'Thank you for our conversation today · {{candidateName}}',
  'Hi {{firstName}},\n\nThank you for taking the time to speak with me today about the {{roleTitle}} position at {{company}}. I really enjoyed our discussion around {{specificTopic}} and learning more about how your team approaches architectural trade-offs.\n\nOur conversation further reinforced my excitement about joining {{company}}. Please let me know if you need any additional code samples or references.\n\nBest regards,\n{{candidateName}}',
  array['firstName', 'roleTitle', 'company', 'specificTopic', 'candidateName'],
  'en',
  true,
  true,
  'CareerMentor',
  167
),
(
  'a0000001-0000-0000-0000-000000000005',
  null,
  'Polite Value-Add Follow-Up',
  'follow-up',
  'Following up on {{roleTitle}} application · {{candidateName}}',
  'Hi {{firstName}},\n\nI wanted to briefly follow up on my note from last week regarding the {{roleTitle}} role at {{company}}. Since my last email, I also open-sourced a project addressing {{relevantProblem}}, which had similar design patterns to what {{company}} is tackling.\n\nI understand your schedule is busy, but I remain very interested in the team. Let me know if you have any questions!\n\nBest,\n{{candidateName}}',
  array['firstName', 'roleTitle', 'company', 'candidateName', 'relevantProblem'],
  'en',
  true,
  true,
  'InboxMaverick',
  312
),
(
  'a0000001-0000-0000-0000-000000000006',
  null,
  'Mutual Connection Referral Request',
  'referral',
  '{{referrerName}} suggested I connect · {{roleTitle}} at {{company}}',
  'Hi {{firstName}},\n\n{{referrerName}} suggested I reach out to you directly! They mentioned your work leading the platform team at {{company}} and thought our backgrounds would resonate.\n\nI recently applied for the {{roleTitle}} role. Given my background in {{topSkills}}, {{referrerName}} thought I would be a natural fit. Would you be open to reviewing my portfolio or putting in a referral if you agree?\n\nThank you so much,\n{{candidateName}}',
  array['referrerName', 'firstName', 'company', 'roleTitle', 'topSkills', 'candidateName'],
  'en',
  true,
  true,
  'NetworkNinjas',
  195
)
on conflict (id) do nothing;
