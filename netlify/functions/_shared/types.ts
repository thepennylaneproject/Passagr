/**
 * Shared type definitions for privacy API endpoints
 */

// Database enum matching privacy_job_status
export type PrivacyJobStatus =
  | "pending"
  | "in_progress"
  | "completed"
  | "failed"
  | "cancelled";

// Export format options
export type ExportFormat = "json" | "csv";

// Request types
export interface CreateExportRequest {
  export_format?: ExportFormat;
  metadata?: Record<string, unknown>;
}

export interface CreateDeletionRequest {
  metadata?: Record<string, unknown>;
}

// Response types
export interface ExportJobResponse {
  job_id: string;
  status: PrivacyJobStatus;
  export_format?: string;
  file_url?: string;
  file_size_bytes?: number;
  expires_at?: string;
  requested_at?: string;
  completed_at?: string;
  failed_at?: string;
  failure_reason?: string;
  metadata?: Record<string, unknown>;
}

export interface DeletionRequestResponse {
  request_id: string;
  status: PrivacyJobStatus;
  requested_at?: string;
  started_at?: string;
  completed_at?: string;
  failed_at?: string;
  cancelled_at?: string;
  failure_reason?: string;
  metadata?: Record<string, unknown>;
}

export interface ErrorResponse {
  error: string;
  details?: string;
}

// Minimal success responses for create operations
export interface CreateExportResponse {
  job_id: string;
  status: PrivacyJobStatus;
}

export interface CreateDeletionResponse {
  request_id: string;
  status: PrivacyJobStatus;
}
