export interface Summary {
  summaryId: string;
  patientId: string;
  admissionId: string;
  status: 'draft' | 'approved' | 'sent';
  content: string; // HTML形式
  version: number;
  createdAt: string; // ISO 8601
  createdBy: string;
  updatedAt?: string;
  updatedBy?: string;
}

export interface GenerateSummaryRequest {
  patientId: string;
  admissionId: string;
  options?: {
    templateVersion?: string;
    includeNursingRecords?: boolean;
  };
}

export interface GenerateSummaryResponse {
  summaryId: string;
  patientId: string;
  admissionId: string;
  status: string;
  content: string;
  version: number;
  createdAt: string;
  createdBy: string;
}

export interface AsyncTask {
  taskId: string;
  summaryId: string;
  status: 'processing' | 'completed' | 'failed';
  estimatedCompletionTime?: string;
}

