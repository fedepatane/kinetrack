export interface PatientSession {
  id: string
  patient_id: string
  session_date: string
  notes: string | null
  created_at: string
}

export interface RoutineDay {
  id: string
  routine_id: string
  name: string
  order_index: number
}

export interface Patient {
  id: string
  first_name: string
  last_name: string
  birth_date: string | null
  consultation_reason: string | null
  notes: string | null
  public_token: string
  is_active: 0 | 1
  total_sessions: number | null
  rehab_phase_current: string | null
  rehab_phase_next: string | null
  objectives: string        // JSON string[]
  key_notes: string         // JSON string[]
  tracking_home: string | null
  tracking_training: string | null
  resources: string         // JSON {label:string, url:string}[]
  created_at: string
}

export interface Exercise {
  id: string
  name: string
  description: string | null
  video_type: 'youtube' | 'upload' | null
  video_url: string | null
  thumbnail_url: string | null
  duration_seconds: number | null
  tags: string[]
  created_at: string
}

export interface Routine {
  id: string
  name: string
  description: string | null
  body_zone: string | null
  difficulty: 'suave' | 'moderado' | 'intenso' | null
  estimated_minutes: number | null
  public_token: string | null
  created_at: string
}

export interface Block {
  id: string
  routine_id: string
  name: string
  order_index: number
  notes: string | null
}

export interface BlockExercise {
  id: string
  block_id: string
  exercise_id: string
  order_index: number
  sets: number | null
  reps: number | null
  duration_seconds: number | null
  rest_seconds: number | null
  intensity_type: 'rpe' | 'rir' | '1rm' | null
  intensity_value: number | null
  notes: string | null
}

export interface Category {
  id: string
  name: string
  parent_id: string | null
  order_index: number
}

export interface Assignment {
  id: string
  patient_id: string
  routine_id: string
  start_date: string
  end_date: string | null
  frequency_per_week: number | null
  total_sessions: number | null
  status: 'active' | 'completed' | 'paused'
  rehab_phase_current: string | null
  rehab_phase_next: string | null
  objectives: string        // JSON string[]
  key_notes: string         // JSON string[]
  tracking_home: string | null
  tracking_training: string | null
  resources: string         // JSON {label:string, url:string}[]
  created_at: string
}
