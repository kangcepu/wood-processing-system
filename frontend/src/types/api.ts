export interface ApiErrorField {
  field: string;
  message: string;
}

export interface ApiErrorPayload {
  code: string;
  message: string;
  fields?: ApiErrorField[];
  correlationId?: string;
}

export class ApiError extends Error {
  readonly status: number;
  readonly code: string;
  readonly fields?: ApiErrorField[];

  constructor(status: number, payload: ApiErrorPayload) {
    super(payload.message);
    this.name = "ApiError";
    this.status = status;
    this.code = payload.code;
    this.fields = payload.fields;
  }
}
