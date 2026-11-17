import 'dotenv/config';
import crypto from 'node:crypto';
import fs from 'node:fs';
import http from 'node:http';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import zlib from 'node:zlib';
import express from 'express';
import type { NextFunction, Request, Response } from 'express';
import { GoogleGenAI, Type } from '@google/genai';
import {
  CHAT_TIMING,
  OFFICIAL_FAQS,
  REVIEW_URL,
  SUPPORTED_LANGUAGES,
  WHATSAPP_DEFAULT_MESSAGE,
  WHATSAPP_PHONE,
  inferStateFromPinPrefix,
} from './src/data/faqCatalog.ts';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = Number(process.env.PORT) || 3000;
const SESSION_TTL_MS = 24 * 60 * 60 * 1000;
const SESSION_SECRET =
  process.env.SESSION_SECRET ||
  crypto.createHash('sha256').update(process.env.GEMINI_API_KEY || 'anudip-local-dev-secret').digest('hex');

const DATA_DIR = path.join(__dirname, 'data');
const STORE_PATH = path.join(DATA_DIR, 'anudip_store.json');

interface StudentRecord {
  id: string;
  studentType: 'NEW_STUDENT' | 'EXISTING_STUDENT';
  name: string;
  mobileNumber: string;
  studentId?: string;
  pinCode?: string;
  state?: string;
  createdAt: string;
  updatedAt: string;
}

interface TicketRecord {
  ticketId: string;
  studentKey: string;
  studentName: string;
  studentId?: string;
  subject: string;
  message: string;
  hasAttachment: boolean;
  attachmentMimeType?: string;
  createdAt: string;
}

interface StoreData {
  newStudents: StudentRecord[];
  existingStudents: StudentRecord[];
  tickets: TicketRecord[];
}

interface SessionClaims {
  sub: string;
  studentType: 'NEW_STUDENT' | 'EXISTING_STUDENT';
  name: string;
  studentId?: string;
  mobileNumber?: string;
  exp: number;
}

function readStore(): StoreData {
  try {
    if (!fs.existsSync(STORE_PATH)) {
      return { newStudents: [], existingStudents: [], tickets: [] };
    }
    const raw = fs.readFileSync(STORE_PATH, 'utf8');
    const parsed = JSON.parse(raw) as Partial<StoreData>;
    return {
      newStudents: Array.isArray(parsed.newStudents) ? parsed.newStudents : [],
      existingStudents: Array.isArray(parsed.existingStudents) ? parsed.existingStudents : [],
      tickets: Array.isArray(parsed.tickets) ? parsed.tickets : [],
    };
  } catch {
    return { newStudents: [], existingStudents: [], tickets: [] };
  }
}

function writeStore(data: StoreData): void {
  fs.mkdirSync(DATA_DIR, { recursive: true });
  fs.writeFileSync(STORE_PATH, JSON.stringify(data, null, 2), 'utf8');
}

function signToken(claims: SessionClaims): string {
  const payload = Buffer.from(JSON.stringify(claims), 'utf8').toString('base64url');
  const sig = crypto.createHmac('sha256', SESSION_SECRET).update(payload).digest('base64url');
  return `${payload}.${sig}`;
}

function verifyToken(token: string): SessionClaims | null {
  const parts = token.split('.');
  if (parts.length !== 2) return null;
  const [payload, sig] = parts;
  const expectedSig = crypto.createHmac('sha256', SESSION_SECRET).update(payload).digest('base64url');
  const sigBuf = Buffer.from(sig);
  const expBuf = Buffer.from(expectedSig);
  if (sigBuf.length !== expBuf.length || !crypto.timingSafeEqual(sigBuf, expBuf)) {
    return null;
  }
  try {
    const decoded = JSON.parse(Buffer.from(payload, 'base64url').toString('utf8')) as SessionClaims;
    if (!decoded.exp || Date.now() >= decoded.exp) return null;
    return decoded;
  } catch {
    return null;
  }
}

interface AuthenticatedRequest extends Request {
  student?: SessionClaims;
}

function requireAuth(req: AuthenticatedRequest, res: Response, next: NextFunction): void {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7).trim() : '';
  if (!token) {
    res.status(401).json({ error: 'Unauthorized', message: 'Authentication token is missing.' });
    return;
  }
  const claims = verifyToken(token);
  if (!claims) {
    res.status(401).json({ error: 'SessionExpired', message: 'Your session has expired. Please sign in again.' });
    return;
  }
  req.student = claims;
  next();
}

async function forwardToGoogleSheetsWebhook(eventType: string, payload: Record<string, unknown>): Promise<void> {
  const webhookUrl = process.env.GOOGLE_SHEETS_WEBHOOK || process.env.GOOGLE_SHEETS_WEBHOOK_URL;
  if (!webhookUrl) return;
  try {
    const bodyPayload: Record<string, unknown> = {
      eventType,
      timestamp: new Date().toISOString(),
      ...payload,
    };
    if (process.env.GOOGLE_SHEETS_WEBHOOK_SECRET) {
      bodyPayload.secret = process.env.GOOGLE_SHEETS_WEBHOOK_SECRET;
    }
    const resp = await fetch(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(bodyPayload),
      redirect: 'follow',
    });
    const text = await resp.text();
    if (!resp.ok) {
      console.warn(`Google Sheets webhook HTTP ${resp.status}:`, text.slice(0, 300));
      return;
    }
    try {
      const parsed = JSON.parse(text) as { ok?: boolean; error?: string };
      if (parsed.ok === false) {
        console.warn('Google Sheets webhook returned error:', parsed.error);
      }
    } catch {
      console.warn('Google Sheets webhook returned non-JSON response:', text.slice(0, 200));
    }
  } catch (err) {
    console.warn('Google Sheets webhook sync warning:', err instanceof Error ? err.message : err);
  }
}

function collectAndroidFiles(dirPath: string, baseDir: string): Array<{ path: string; size: number; content?: string }> {
  if (!fs.existsSync(dirPath)) return [];
  const results: Array<{ path: string; size: number; content?: string }> = [];
  const entries = fs.readdirSync(dirPath, { withFileTypes: true });
  for (const entry of entries) {
    if ((entry.name.startsWith('.') && entry.name !== '.github') || entry.name === 'build') continue;
    const full = path.join(dirPath, entry.name);
    const rel = path.relative(baseDir, full);
    if (entry.isDirectory()) {
      results.push(...collectAndroidFiles(full, baseDir));
    } else {
      const stat = fs.statSync(full);
      const isText = /\.(kt|kts|xml|pro|toml|properties|md|ya?ml)$/i.test(entry.name);
      results.push({
        path: rel,
        size: stat.size,
        content: isText && stat.size < 65000 ? fs.readFileSync(full, 'utf8') : undefined,
      });
    }
  }
  return results;
}

function collectRawAndroidPaths(dirPath: string, baseDir: string): Array<{ rel: string; full: string }> {
  if (!fs.existsSync(dirPath)) return [];
  const results: Array<{ rel: string; full: string }> = [];
  for (const entry of fs.readdirSync(dirPath, { withFileTypes: true })) {
    if ((entry.name.startsWith('.') && entry.name !== '.github') || entry.name === 'build') continue;
    const full = path.join(dirPath, entry.name);
    if (entry.isDirectory()) {
      results.push(...collectRawAndroidPaths(full, baseDir));
    } else {
      const rel = path.relative(baseDir, full).split(path.sep).join('/');
      results.push({ rel, full });
    }
  }
  return results;
}

function buildZipBuffer(rootDir: string, prefix = 'anudip-student-care-android'): Buffer {
  const entries = collectRawAndroidPaths(rootDir, rootDir);
  const localParts: Buffer[] = [];
  const centralParts: Buffer[] = [];
  let offset = 0;

  for (const entry of entries) {
    const data = fs.readFileSync(entry.full);
    const compressed = zlib.deflateRawSync(data);
    const useDeflate = compressed.length < data.length;
    const body = useDeflate ? compressed : data;
    const method = useDeflate ? 8 : 0;
    const crc = zlib.crc32(data) >>> 0;
    const nameBuf = Buffer.from(`${prefix}/${entry.rel}`, 'utf8');

    const localHeader = Buffer.alloc(30);
    localHeader.writeUInt32LE(0x04034b50, 0);
    localHeader.writeUInt16LE(20, 4);
    localHeader.writeUInt16LE(0x0800, 6);
    localHeader.writeUInt16LE(method, 8);
    localHeader.writeUInt16LE(0, 10);
    localHeader.writeUInt16LE(0x5421, 12);
    localHeader.writeUInt32LE(crc, 14);
    localHeader.writeUInt32LE(body.length, 18);
    localHeader.writeUInt32LE(data.length, 22);
    localHeader.writeUInt16LE(nameBuf.length, 26);
    localHeader.writeUInt16LE(0, 28);

    const centralHeader = Buffer.alloc(46);
    centralHeader.writeUInt32LE(0x02014b50, 0);
    centralHeader.writeUInt16LE(20, 4);
    centralHeader.writeUInt16LE(20, 6);
    centralHeader.writeUInt16LE(0x0800, 8);
    centralHeader.writeUInt16LE(method, 10);
    centralHeader.writeUInt16LE(0, 12);
    centralHeader.writeUInt16LE(0x5421, 14);
    centralHeader.writeUInt32LE(crc, 16);
    centralHeader.writeUInt32LE(body.length, 20);
    centralHeader.writeUInt32LE(data.length, 24);
    centralHeader.writeUInt16LE(nameBuf.length, 28);
    centralHeader.writeUInt16LE(0, 30);
    centralHeader.writeUInt16LE(0, 32);
    centralHeader.writeUInt16LE(0, 34);
    centralHeader.writeUInt16LE(0, 36);
    centralHeader.writeUInt32LE(0, 38);
    centralHeader.writeUInt32LE(offset, 42);

    localParts.push(localHeader, nameBuf, body);
    centralParts.push(centralHeader, nameBuf);
    offset += localHeader.length + nameBuf.length + body.length;
  }

  const centralDir = Buffer.concat(centralParts);
  const endRecord = Buffer.alloc(22);
  endRecord.writeUInt32LE(0x06054b50, 0);
  endRecord.writeUInt16LE(0, 4);
  endRecord.writeUInt16LE(0, 6);
  endRecord.writeUInt16LE(entries.length, 8);
  endRecord.writeUInt16LE(entries.length, 10);
  endRecord.writeUInt32LE(centralDir.length, 12);
  endRecord.writeUInt32LE(offset, 16);
  endRecord.writeUInt16LE(0, 20);

  return Buffer.concat([...localParts, centralDir, endRecord]);
}

const translationCache = new Map<string, { translatedQuestion: string; translatedAnswer: string }>();

async function startServer() {
  const app = express();
  app.use(express.json({ limit: '8mb' }));

  app.get('/api/health', (_req, res) => {
    res.json({ ok: true, service: 'anudip-student-care-api', timestamp: new Date().toISOString() });
  });

  app.get('/api/pincode/:pin', async (req, res) => {
    const pin = String(req.params.pin || '').trim();
    if (!/^\d{6}$/.test(pin)) {
      res.status(400).json({ error: 'InvalidPinCode', message: 'Pin Code must be 6 digits.' });
      return;
    }

    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 5000);
      const resp = await fetch(`https://api.postalpincode.in/pincode/${pin}`, {
        signal: controller.signal,
      });
      clearTimeout(timeout);
      if (resp.ok) {
        const json = (await resp.json()) as Array<{
          Status?: string;
          PostOffice?: Array<{ State?: string; District?: string }>;
        }>;
        const first = json?.[0];
        const po = first?.PostOffice?.[0];
        if (first?.Status === 'Success' && po?.State) {
          res.json({ pinCode: pin, state: po.State, district: po.District || null });
          return;
        }
      }
    } catch {
      // Fall through to local prefix lookup
    }

    const inferred = inferStateFromPinPrefix(pin);
    if (inferred) {
      res.json({ pinCode: pin, state: inferred, district: null });
      return;
    }
    res.status(404).json({ error: 'NotFound', message: 'Unable to detect State from Pin Code.' });
  });

  app.post('/api/students/new', async (req, res) => {
    const name = String(req.body?.name || '').trim();
    const mobileNumber = String(req.body?.mobileNumber || '').trim();
    const pinCode = String(req.body?.pinCode || '').trim();
    const state = String(req.body?.state || '').trim();

    if (!name || !mobileNumber || !pinCode || !state) {
      res.status(400).json({
        error: 'ValidationError',
        message: 'Please fill in Name, Mobile Number, Pin Code and State.',
      });
      return;
    }
    if (!/^[6-9]\d{9}$/.test(mobileNumber)) {
      res.status(400).json({
        error: 'ValidationError',
        message: 'Please enter a valid 10-digit Indian mobile number.',
      });
      return;
    }
    if (!/^\d{6}$/.test(pinCode)) {
      res.status(400).json({
        error: 'ValidationError',
        message: 'Please enter a valid 6-digit Pin Code (e.g. 600001).',
      });
      return;
    }

    const store = readStore();
    const now = new Date().toISOString();
    const existingIdx = store.newStudents.findIndex((s) => s.mobileNumber === mobileNumber);

    const record: StudentRecord = {
      id: existingIdx >= 0 ? store.newStudents[existingIdx].id : `NEW-${mobileNumber}`,
      studentType: 'NEW_STUDENT',
      name,
      mobileNumber,
      pinCode,
      state,
      createdAt: existingIdx >= 0 ? store.newStudents[existingIdx].createdAt : now,
      updatedAt: now,
    };

    if (existingIdx >= 0) {
      store.newStudents[existingIdx] = record;
    } else {
      store.newStudents.push(record);
    }
    writeStore(store);

    await forwardToGoogleSheetsWebhook('NEW_STUDENT', {
      name,
      mobileNumber,
      pinCode,
      state,
    });

    const expiresAtEpochMs = Date.now() + SESSION_TTL_MS;
    const token = signToken({
      sub: record.id,
      studentType: 'NEW_STUDENT',
      name,
      mobileNumber,
      exp: expiresAtEpochMs,
    });

    res.json({
      success: true,
      token,
      expiresAtEpochMs,
      studentType: 'NEW_STUDENT',
      name,
      mobileNumber,
      pinCode,
      state,
      message: 'New Student verification complete.',
    });
  });

  app.post('/api/students/existing/verify', async (req, res) => {
    const name = String(req.body?.name || '').trim();
    const mobileNumber = req.body?.mobileNumber ? String(req.body.mobileNumber).trim() : '';
    const studentId = String(req.body?.studentId || '').trim().toUpperCase();

    if (!name) {
      res.status(400).json({ error: 'ValidationError', message: 'Please enter your Name.' });
      return;
    }
    if (!studentId) {
      res.status(400).json({ error: 'ValidationError', message: 'Please enter your Student ID.' });
      return;
    }
    if (!studentId.startsWith('AF0') || studentId.length < 5) {
      res.status(400).json({
        error: 'ValidationError',
        message: "Student ID is mandatory and must start with 'AF0' (e.g., AF05319302).",
      });
      return;
    }
    if (mobileNumber && !/^[6-9]\d{9}$/.test(mobileNumber)) {
      res.status(400).json({
        error: 'ValidationError',
        message: 'CMIS Register Mobile Number must be a valid 10-digit mobile number.',
      });
      return;
    }

    const store = readStore();
    const now = new Date().toISOString();
    const existingIdx = store.existingStudents.findIndex((s) => s.studentId === studentId);

    const record: StudentRecord = {
      id: studentId,
      studentType: 'EXISTING_STUDENT',
      name,
      mobileNumber,
      studentId,
      createdAt: existingIdx >= 0 ? store.existingStudents[existingIdx].createdAt : now,
      updatedAt: now,
    };

    if (existingIdx >= 0) {
      store.existingStudents[existingIdx] = record;
    } else {
      store.existingStudents.push(record);
    }
    writeStore(store);

    await forwardToGoogleSheetsWebhook('EXISTING_STUDENT', {
      name,
      mobileNumber,
      studentId,
    });

    const expiresAtEpochMs = Date.now() + SESSION_TTL_MS;
    const token = signToken({
      sub: studentId,
      studentType: 'EXISTING_STUDENT',
      name,
      studentId,
      mobileNumber: mobileNumber || undefined,
      exp: expiresAtEpochMs,
    });

    res.json({
      success: true,
      token,
      expiresAtEpochMs,
      studentType: 'EXISTING_STUDENT',
      name,
      studentId,
      mobileNumber: mobileNumber || null,
      message: 'Existing Student verified successfully.',
    });
  });

  app.get('/api/faqs', (_req, res) => {
    res.json({
      faqs: OFFICIAL_FAQS,
      languages: [...SUPPORTED_LANGUAGES],
      whatsappPhone: WHATSAPP_PHONE,
      whatsappDefaultMessage: WHATSAPP_DEFAULT_MESSAGE,
      chatTiming: CHAT_TIMING,
      reviewUrl: REVIEW_URL,
    });
  });

  app.post('/api/translate', requireAuth, async (req: AuthenticatedRequest, res) => {
    const question = String(req.body?.question || '').trim();
    const answer = String(req.body?.answer || '').trim();
    const targetLanguage = String(req.body?.targetLanguage || 'English').trim();

    if (!question || !answer) {
      res.status(400).json({ error: 'ValidationError', message: 'Question and answer are required.' });
      return;
    }
    if (!SUPPORTED_LANGUAGES.includes(targetLanguage as (typeof SUPPORTED_LANGUAGES)[number])) {
      res.status(400).json({ error: 'UnsupportedLanguage', message: `Unsupported language: ${targetLanguage}` });
      return;
    }
    if (targetLanguage === 'English') {
      res.json({
        targetLanguage: 'English',
        translatedQuestion: question,
        translatedAnswer: answer,
      });
      return;
    }

    const cacheKey = `${targetLanguage}::${question}`;
    const cached = translationCache.get(cacheKey);
    if (cached) {
      res.json({ targetLanguage, ...cached });
      return;
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      res.status(503).json({
        error: 'TranslationUnavailable',
        message: 'Server translation key (GEMINI_API_KEY) is not configured yet.',
      });
      return;
    }

    try {
      const ai = new GoogleGenAI({
        apiKey,
        httpOptions: {
          headers: {
            'User-Agent': 'aistudio-build',
          },
        },
      });
      const response = await ai.models.generateContent({
        model: 'gemini-4-hydrogen',
        contents: `Translate the following student support question and answer accurately and naturally into ${targetLanguage}. Preserve brand names (Anudip, CMIS, LMS, Mettl, CRD), emails, URLs, and phone numbers exactly.\n\nQuestion: ${question}\nAnswer: ${answer}`,
        config: {
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              translatedQuestion: { type: Type.STRING },
              translatedAnswer: { type: Type.STRING },
            },
            required: ['translatedQuestion', 'translatedAnswer'],
          },
        },
      });
      const parsed = JSON.parse(response.text || '{}') as {
        translatedQuestion?: string;
        translatedAnswer?: string;
      };
      if (!parsed.translatedQuestion || !parsed.translatedAnswer) {
        throw new Error('Malformed translation response');
      }
      const result = {
        translatedQuestion: parsed.translatedQuestion,
        translatedAnswer: parsed.translatedAnswer,
      };
      translationCache.set(cacheKey, result);
      res.json({ targetLanguage, ...result });
    } catch (err) {
      console.error('Translation error:', err);
      const detail = err instanceof Error ? err.message : 'Unknown translation error';
      res.status(502).json({
        error: 'TranslationFailed',
        message: `Unable to translate into ${targetLanguage} right now (${detail}). Please retry.`,
      });
    }
  });

  app.post('/api/support/ticket', requireAuth, async (req: AuthenticatedRequest, res) => {
    const subject = String(req.body?.subject || '').trim();
    const message = String(req.body?.message || '').trim();
    const attachmentBase64 = req.body?.attachmentBase64 ? String(req.body.attachmentBase64) : undefined;
    const attachmentMimeType = req.body?.attachmentMimeType ? String(req.body.attachmentMimeType) : undefined;

    if (!subject || !message) {
      res.status(400).json({ error: 'ValidationError', message: 'Subject and message are required.' });
      return;
    }

    const student = req.student!;
    const ticketId = `ASC-${Date.now().toString(36).toUpperCase()}`;
    const store = readStore();
    store.tickets.push({
      ticketId,
      studentKey: student.sub,
      studentName: student.name,
      studentId: student.studentId,
      subject,
      message,
      hasAttachment: Boolean(attachmentBase64),
      attachmentMimeType,
      createdAt: new Date().toISOString(),
    });
    writeStore(store);

    await forwardToGoogleSheetsWebhook('SUPPORT_TICKET', {
      ticketId,
      studentName: student.name,
      studentId: student.studentId || null,
      subject,
      message,
      hasAttachment: Boolean(attachmentBase64),
    });

    res.json({
      success: true,
      ticketId,
      message: 'Your query has been submitted to Anudip Student Care.',
    });
  });

  app.get('/api/android-files', (_req, res) => {
    const androidRoot = path.join(__dirname, 'android-app');
    const files = collectAndroidFiles(androidRoot, androidRoot);
    res.json({ root: 'android-app', count: files.length, files });
  });

  app.get('/api/android-project.zip', (_req, res) => {
    const androidRoot = path.join(__dirname, 'android-app');
    const zipBuffer = buildZipBuffer(androidRoot);
    res.setHeader('Content-Type', 'application/zip');
    res.setHeader('Content-Disposition', 'attachment; filename="anudip-student-care-android.zip"');
    res.send(zipBuffer);
  });

  const httpServer = http.createServer(app);

  if (process.env.NODE_ENV !== 'production') {
    const [{ createServer: createViteServer }, { default: react }, { default: tailwindcss }] = await Promise.all([
      import('vite'),
      import('@vitejs/plugin-react'),
      import('@tailwindcss/vite'),
    ]);
    const vite = await createViteServer({
      configFile: false,
      plugins: [react(), tailwindcss()],
      resolve: {
        alias: {
          '@': __dirname,
        },
      },
      server: {
        middlewareMode: true,
        hmr: false,
        ws: false,
        watch: process.env.DISABLE_HMR === 'true' ? null : {},
      },
      appType: 'spa',
    });

    // Vite 8 still injects /@vite/client even with hmr:false & ws:false, which tries to open ws://...:24678.
    // Serve a clean ESM shim preserving CSS updateStyle/removeStyle, injectQuery, and createHotContext with zero WebSocket traffic.
    app.get('/@vite/client', (_req, res) => {
      res.type('application/javascript').send(`
const sheetsMap = new Map();
const linkSheetsMap = new Map();
if (typeof document !== "undefined") {
  document.querySelectorAll("style[data-vite-dev-id]").forEach((el) => {
    sheetsMap.set(el.getAttribute("data-vite-dev-id"), el);
  });
  document.querySelectorAll('link[rel="stylesheet"][data-vite-dev-id]').forEach((el) => {
    linkSheetsMap.set(el.getAttribute("data-vite-dev-id"), el);
  });
}
let lastInsertedStyle;
export function updateStyle(id, content) {
  if (linkSheetsMap.has(id)) return;
  let style = sheetsMap.get(id);
  if (!style) {
    style = document.createElement("style");
    style.setAttribute("type", "text/css");
    style.setAttribute("data-vite-dev-id", id);
    style.textContent = content;
    if (!lastInsertedStyle) {
      document.head.appendChild(style);
      setTimeout(() => { lastInsertedStyle = void 0; }, 0);
    } else {
      lastInsertedStyle.insertAdjacentElement("afterend", style);
    }
    lastInsertedStyle = style;
  } else if (style.textContent !== content) {
    style.textContent = content;
  }
  sheetsMap.set(id, style);
}
export function removeStyle(id) {
  if (linkSheetsMap.has(id)) {
    document.querySelectorAll('link[rel="stylesheet"][data-vite-dev-id="' + CSS.escape(id) + '"]').forEach((el) => el.remove());
    linkSheetsMap.delete(id);
  }
  const style = sheetsMap.get(id);
  if (style) {
    document.head.removeChild(style);
    sheetsMap.delete(id);
  }
}
const dataMap = new Map();
export function createHotContext(ownerPath) {
  if (!dataMap.has(ownerPath)) dataMap.set(ownerPath, {});
  return {
    get data() { return dataMap.get(ownerPath); },
    accept() {},
    acceptExports() {},
    dispose() {},
    prune() {},
    decline() {},
    invalidate() {},
    on() {},
    off() {},
    send() {},
  };
}
export function injectQuery(url, queryToInject) {
  if (url[0] !== "." && url[0] !== "/") return url;
  const pathname = url.replace(/[?#].*$/, "");
  const { search, hash } = new URL(url, "http://vite.dev");
  return pathname + "?" + queryToInject + (search ? "&" + search.slice(1) : "") + (hash || "");
}
export class ErrorOverlay extends HTMLElement {}
`);
    });

    app.use(vite.middlewares);
  } else {
    const distDir = path.join(__dirname, 'dist');
    app.use(express.static(distDir));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distDir, 'index.html'));
    });
  }

  httpServer.listen(PORT, '0.0.0.0', () => {
    console.log(`Anudip Student Care server listening on http://0.0.0.0:${PORT}`);
  });
}

startServer();
