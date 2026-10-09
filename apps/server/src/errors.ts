export class HttpError extends Error {
  constructor(public statusCode: number, message: string) {
    super(message);
  }
}

export class UpstreamError extends HttpError {
  constructor(provider: string, status: number) {
    super(502, `${provider} request failed with status ${status}`);
  }
}
