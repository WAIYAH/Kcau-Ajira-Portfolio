export type MemberRole = 'member' | 'leader' | 'admin'
export type MemberStatus = 'pending' | 'active' | 'suspended' | 'alumni'

export interface Profile {
  id: string
  full_name: string
  email: string
  phone: string | null
  university_id: string | null
  course: string | null
  year_of_study: string | null
  role: MemberRole
  status: MemberStatus
  avatar_url: string | null
  bio: string | null
  skills: string[]
  cv_url: string | null
  joined_at: string
}

export type TransactionType = 'income' | 'expense'

export interface Transaction {
  id: string
  type: TransactionType
  category: string
  amount: number
  description: string | null
  recorded_by: string | null
  receipt_url: string | null
  occurred_at: string
  created_at: string
  recorder?: Pick<Profile, 'full_name'> | null
}

export type DueStatus = 'unpaid' | 'partial' | 'paid'

export interface MembershipDue {
  id: string
  profile_id: string
  term: string
  amount_due: number
  amount_paid: number
  status: DueStatus
  due_date: string | null
  created_at: string
  updated_at: string
  profiles?: Pick<Profile, 'full_name' | 'email'>
}

export interface Budget {
  id: string
  term: string
  category: string
  planned_amount: number
  created_at: string
}

export interface EventItem {
  id: string
  title: string
  description: string | null
  category: string | null
  location: string | null
  starts_at: string
  ends_at: string | null
  cover_image_url: string | null
  created_by: string | null
  created_at: string
}

export type RsvpStatus = 'going' | 'maybe' | 'declined'

export interface EventRsvp {
  id: string
  event_id: string
  profile_id: string
  status: RsvpStatus
  created_at: string
}

export type ElectionStatus = 'draft' | 'open' | 'closed'

export interface Election {
  id: string
  title: string
  description: string | null
  opens_at: string
  closes_at: string
  status: ElectionStatus
  is_anonymous: boolean
  created_by: string | null
  created_at: string
}

export interface Candidate {
  id: string
  election_id: string
  profile_id: string | null
  display_name: string
  position_title: string
  statement: string | null
  photo_url: string | null
  created_at: string
}

export interface ElectionResultRow {
  position_title: string
  candidate_id: string
  vote_count: number
}

export type AnnouncementAudience = 'all' | 'members' | 'leaders'

export interface Announcement {
  id: string
  title: string
  body: string
  audience: AnnouncementAudience
  sent_by: string | null
  sent_via: string
  created_at: string
  sender?: Pick<Profile, 'full_name'> | null
}

export interface EmailLogEntry {
  id: string
  subject: string
  body: string
  template: string | null
  audience: AnnouncementAudience
  sent_by: string | null
  recipient_count: number
  status: string
  created_at: string
  sender?: Pick<Profile, 'full_name'> | null
}

export type ReportType = 'finance' | 'membership' | 'attendance' | 'election'

export interface ReportRecord {
  id: string
  type: ReportType
  generated_by: string | null
  period_start: string | null
  period_end: string | null
  file_url: string | null
  created_at: string
  generator?: Pick<Profile, 'full_name'> | null
}

export type LearningResourceType = 'article' | 'video' | 'course' | 'link'
export type ProgressStatus = 'not_started' | 'in_progress' | 'done'

export interface LearningResource {
  id: string
  title: string
  type: LearningResourceType
  category: string
  skill_tag: string | null
  url_or_content: string
  created_by: string | null
  created_at: string
}

export interface LearningProgress {
  id: string
  profile_id: string
  resource_id: string
  status: ProgressStatus
  updated_at: string
}

export type OpportunityType = 'job' | 'internship' | 'gig' | 'freelance' | 'scholarship'
export type OpportunityStatus = 'open' | 'closed'

export interface Opportunity {
  id: string
  title: string
  organization: string
  type: OpportunityType
  location: string | null
  is_remote: boolean
  skill_tags: string[]
  description: string
  apply_url: string | null
  apply_email: string | null
  status: OpportunityStatus
  expires_at: string | null
  posted_by: string | null
  created_at: string
  updated_at: string
  poster?: Pick<Profile, 'full_name'> | null
}

export type InquiryType = 'contact' | 'join_interest'
export type InquiryStatus = 'new' | 'in_progress' | 'resolved'

export interface Inquiry {
  id: string
  type: InquiryType
  name: string
  email: string
  phone: string | null
  subject: string | null
  message: string | null
  newsletter_opt_in: boolean
  status: InquiryStatus
  created_at: string
}

export interface AuditLogEntry {
  id: string
  actor_id: string | null
  action: string
  target_table: string | null
  target_id: string | null
  metadata: Record<string, unknown> | null
  created_at: string
  actor?: Pick<Profile, 'full_name'> | null
}
