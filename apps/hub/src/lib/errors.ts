export class DomainError extends Error {
  readonly code: string;
  readonly httpStatus: number;
  constructor(code: string, message: string, httpStatus = 400) {
    super(message);
    this.code = code;
    this.httpStatus = httpStatus;
    this.name = 'DomainError';
  }
}

export class NotFoundError extends DomainError {
  constructor(message: string) {
    super('not_found', message, 404);
  }
}

export class ConflictError extends DomainError {
  constructor(message: string) {
    super('conflict', message, 409);
  }
}

export class UnauthorizedError extends DomainError {
  constructor(message = 'unauthorized') {
    super('unauthorized', message, 401);
  }
}

export class ValidationError extends DomainError {
  readonly issues: unknown;
  constructor(message: string, issues: unknown) {
    super('validation', message, 422);
    this.issues = issues;
  }
}
