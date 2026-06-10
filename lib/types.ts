export type Role = 'superadmin' | 'editor'

export interface AdminUser {
  id: number
  username: string
  password_hash: string
  display_name: string
  role: Role
  color: string
  created_at: Date
  updated_at: Date
}

export interface Category {
  id: number
  sheet_key: string
  cat: string
  type: string
  label: string
  emoji: string
  created_at: Date
}

export interface Teller {
  id: number
  user_code: string
  name: string
  position: string | null
  unit: string | null
  branch: string | null
  score: number
  rank_in_category: number
  category_id: number
  category_sheet_key?: string
  category_label?: string
  category_emoji?: string
  created_at: Date
  updated_at: Date
}

export type AnnouncementStatus = 'live' | 'draft' | 'scheduled'
export type AnnouncementTag = 'new' | 'perf' | 'event' | 'q1'
export type AnnouncementRole = 'all' | 'admin'

export interface Announcement {
  id: number
  title_lo: string
  title_en: string | null
  body: string | null
  status: AnnouncementStatus
  tag: AnnouncementTag
  role_target: AnnouncementRole
  created_by: number | null
  created_at: Date
  updated_at: Date
}

export interface UploadHistory {
  id: number
  filename: string
  records_count: number
  status: 'success' | 'error'
  uploaded_by: number | null
  created_at: Date
}

export interface SessionPayload {
  userId: number
  username: string
  displayName: string
  role: Role
  color: string
}
