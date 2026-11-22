import type http from 'node:http';
import { extractAuthUser } from '../auth.js';
import type { RequestContext, Handler, Middleware, RouteEntry } from './types.js';

export function pathToRegex(path: string): { pattern: RegExp; paramNames: string[] } {
  const paramNames: string[] = [];
  const regexStr = path.replace(/:([a-zA-Z0-9_]+)/g, (_, name) => {
    paramNames.push(name);
    return '([^/]+)';
  });
  return {
    pattern: new RegExp(`^${regexStr}$`),
    paramNames,
  };
}

export async function readJsonBody(req: http.IncomingMessage): Promise<any> {
  const buffers: Buffer[] = [];
  for await (const chunk of req) {
    buffers.push(typeof chunk === 'string' ? Buffer.from(chunk) : chunk);
  }
  const raw = Buffer.concat(buffers).toString('utf8').trim();
  if (!raw) return {};
  try {
    return JSON.parse(raw);
  } catch {
    throw new Error('Malformed JSON payload');
  }
}

export function setCors(res: http.ServerResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
}

export class AppRouter {
  private routes: RouteEntry[] = [];
  private middlewares: Middleware[] = [];

  use(middleware: Middleware): this {
    this.middlewares.push(middleware);
    return this;
  }

  addRoute(method: string, path: string, handler: Handler): this {
    const { pattern, paramNames } = pathToRegex(path);
    this.routes.push({
      method: method.toUpperCase(),
      pattern,
      paramNames,
      handler,
    });
    return this;
  }

  get(path: string, handler: Handler): this {
    return this.addRoute('GET', path, handler);
  }

  post(path: string, handler: Handler): this {
    return this.addRoute('POST', path, handler);
  }

  put(path: string, handler: Handler): this {
    return this.addRoute('PUT', path, handler);
  }

  delete(path: string, handler: Handler): this {
    return this.addRoute('DELETE', path, handler);
  }

  handle = async (req: http.IncomingMessage, res: http.ServerResponse): Promise<void> => {
    setCors(res);

    if (req.method === 'OPTIONS') {
      res.writeHead(204);
      res.end();
      return;
    }

    const host = req.headers.host ?? 'localhost';
    const parsedUrl = new URL(req.url ?? '/', `http://${host}`);
    const pathname = parsedUrl.pathname;
    const method = (req.method ?? 'GET').toUpperCase();

    const query: Record<string, string> = {};
    parsedUrl.searchParams.forEach((v, k) => {
      query[k] = v;
    });

    let body: any = {};
    if (method === 'POST' || method === 'PUT') {
      try {
        body = await readJsonBody(req);
      } catch (err: any) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: err?.message || 'Invalid JSON' }));
        return;
      }
    }

    const authUser = extractAuthUser(req);

    const ctx: RequestContext = {
      req,
      res,
      url: req.url ?? '/',
      pathname,
      method,
      params: {},
      query,
      body,
      authUser,
      json: (data: any, status = 200) => {
        res.writeHead(status, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify(data));
      },
      error: (message: string, status = 400) => {
        res.writeHead(status, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: message }));
      },
    };

    // Find matching route
    let matchedRoute: RouteEntry | null = null;
    for (const r of this.routes) {
      if (r.method === method) {
        const match = pathname.match(r.pattern);
        if (match) {
          matchedRoute = r;
          const params: Record<string, string> = {};
          r.paramNames.forEach((name, idx) => {
            params[name] = decodeURIComponent(match[idx + 1] ?? '');
          });
          ctx.params = params;
          break;
        }
      }
    }

    if (!matchedRoute) {
      ctx.error(`Cannot ${method} ${pathname}`, 404);
      return;
    }

    try {
      // Execute middleware chain
      let index = 0;
      const next = async () => {
        if (index < this.middlewares.length) {
          const mw = this.middlewares[index++]!;
          await mw(ctx, next);
        } else {
          await matchedRoute!.handler(ctx);
        }
      };
      await next();
    } catch (err: any) {
      if (!res.headersSent) {
        ctx.error(err?.message || 'Internal Server Error', 500);
      }
    }
  };
}
