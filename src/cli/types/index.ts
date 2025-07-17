export interface CLIOptions {
  orgId: string;
  appVersionId: string;
  test: string;
  target: string;
  priority: string;
}

export interface JobData {
  org_id: string;
  app_version_id: string;
  test_path: string;
  priority: number;
  target: string;
}

export interface SubmitJobResponse {
  success: boolean;
  message?: string;
  data: {
    job_id: string;
    status: string;
  };
}

export interface JobStatusResponse {
  success: boolean;
  message?: string;

  data: {
    job_id: string;
    org_id: string;
    app_version_id: string;
    test_path: string;
    target: string;
    priority: number;
    status: string;
    created_at: string;
    updated_at: string;
    logs?: string[];
  };
}
