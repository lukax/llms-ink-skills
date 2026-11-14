#!/usr/bin/env node
/**
 * Opt-in Claude Code PreToolUse hook for WebFetch (Node 22+, no dependencies). Off unless you add it to your settings.
 * For public docs, GitHub repositories, PDFs and videos it tells Claude about https://llms.ink/<url>; with --rewrite it
 * fetches that instead. Private, local and signed URLs and llms.ink itself pass through untouched. Never blocks a fetch.
 */
import path from 'node:path';
import { pathToFileURL } from 'node:url';

const PRIVATE_HOST = /(?:^|\.)(?:localhost|local|localdomain|internal|intranet|corp|lan|home|home\.arpa|test|invalid|example)$/i;
const SECRET_PARAM = /[?&][^=&]*(?:token|key|sig|signature|auth|session|secret|password|credential|code)[^=&]*=/i;
const TEXT_FILE = /\.(?:txt|md|markdown|json|ya?ml|xml|csv|rss|atom)$/i;
const DOCS_HOST = /^(?:docs?|developers?|dev|learn|help|support|wiki|api|reference|guides?|manual)\./i;
const DOCS_DOMAIN = /(?:^|\.)(?:readthedocs\.io|readthedocs\.org|gitbook\.io|mintlify\.app|docs\.rs|pkg\.go\.dev|hexdocs\.pm|developer\.mozilla\.org)$/i;
const DOCS_PATH = /\/(?:docs?|documentation|guides?|reference|api-reference|manual|tutorials?|handbook|learn|getting-started|quickstart)(?:\/|$)/i;
const GITHUB_RESERVED = new Set(['settings', 'login', 'logout', 'join', 'orgs', 'organizations', 'users', 'notifications', 'marketplace', 'sponsors', 'features', 'pricing', 'search', 'explore', 'topics', 'collections', 'apps', 'about', 'enterprise', 'security', 'site', 'pulls', 'issues', 'codespaces', 'new']);

function kind(url) {
  const host = url.hostname.replace(/^www\./, ''), parts = url.pathname.split('/').filter(Boolean);
  if (/\.pdf$/i.test(url.pathname)) return 'pdf';
  if ((/(?:^|\.)youtube\.com$/.test(host) && /^\/(?:watch|shorts\/|live\/)/.test(url.pathname)) || host === 'youtu.be' || (host === 'vimeo.com' && /^\d+$/.test(parts[0] ?? '')) || (host === 'loom.com' && parts[0] === 'share')) return 'video';
  if (TEXT_FILE.test(url.pathname)) return null;
  if (host === 'github.com') return parts.length >= 2 && !GITHUB_RESERVED.has(parts[0].toLowerCase()) && (parts.length === 2 || ['tree', 'blob', 'wiki'].includes(parts[2])) ? 'github' : null;
  if (DOCS_HOST.test(host) || DOCS_DOMAIN.test(host) || DOCS_PATH.test(url.pathname)) return 'docs';
  return null;
}

/** The llms.ink address for a public docs/GitHub/PDF/video link, or null to leave the fetch alone. */
export function llmsInkUrl(input) {
  let url;
  try { url = new URL(input); } catch { return null; }
  const host = url.hostname.toLowerCase();
  if (!/^https?:$/.test(url.protocol) || url.username || url.password || url.port) return null;
  if (!host.includes('.') || host.startsWith('[') || /^\d+(?:\.\d+){3}$/.test(host) || PRIVATE_HOST.test(host)) return null;
  if (host === 'llms.ink' || host.endsWith('.llms.ink') || SECRET_PARAM.test(url.search) || !kind(url)) return null;
  url.hash = '';
  return `https://llms.ink/${url.href}`;
}

/** Hook output for one PreToolUse event, or null for no opinion. */
export function decide(event, { rewrite = false } = {}) {
  if (event?.tool_name !== 'WebFetch' || typeof event.tool_input?.url !== 'string') return null;
  const target = llmsInkUrl(event.tool_input.url);
  if (!target) return null;
  const full = target.replace('https://llms.ink/', 'https://llms.ink/full/');
  return {
    hookSpecificOutput: rewrite
      ? { hookEventName: 'PreToolUse', updatedInput: { ...event.tool_input, url: target }, additionalContext: `This fetch was routed through llms.ink (${target}), an llms.txt index of ${event.tool_input.url}. For the full text use ${full}.` }
      : { hookEventName: 'PreToolUse', additionalContext: `A clean text version of ${event.tool_input.url} is available from llms.ink: ${target} (index) or ${full} (full content, transcript for videos). Use it if this page comes back incomplete.` },
  };
}

if (process.argv[1] && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href) {
  let input = '';
  process.stdin.setEncoding('utf8');
  process.stdin.on('data', chunk => { input += chunk; });
  process.stdin.on('end', () => {
    try {
      const output = decide(JSON.parse(input), { rewrite: process.argv.includes('--rewrite') });
      if (output) process.stdout.write(JSON.stringify(output));
    } catch {}
  });
}
