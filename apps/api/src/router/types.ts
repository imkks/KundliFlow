import type http from 'node:http';
import type { AuthTokenPayload } from '../auth.js';

export interface RequestContext {
  req: http.IncomingMessage;
  res: http.ServerResponse;
  url: string;
  pathname: string;
  method: string;
  params: Record<string, string>;
  query: Record<string, string>;
  body: any;
  authUser: AuthTokenPayload | null;
  json: (data: any, status?: number) => void;
  error: (message: string, status?: number) => void;
}

export type Handler = (ctx: RequestContext) => Promise<any> | any;
export type Middleware = (ctx: RequestContext, next: () => Promise<void>) => Promise<void> | void;

export interface RouteEntry {
  method: string;
  pattern: RegExp;
  paramNames: string[];
  handler: Handler;
}
