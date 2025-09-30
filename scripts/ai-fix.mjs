#!/usr/bin/env node
// Minimal AI-assisted fixer for GitHub Actions
// - Reads TASK, PROVIDER, INCLUDE_GLOBS, DRY_RUN from env
// - Calls OpenAI or Anthropic via fetch (no extra deps)
// - Expects JSON output: { changes: [{ path, content }] }
// - Writes files accordingly

import { execSync } from 'node:child_process';
import { readFileSync, writeFileSync } from 'node:fs';
import { existsSync } from 'node:fs';
import { resolve } from 'node:path';

const PROVIDER = (process.env.PROVIDER || 'openai').toLowerCase();
const TASK = process.env.TASK || '';
const INCLUDE_GLOBS = (process.env.INCLUDE_GLOBS || '').split(',').map((s) => s.trim()).filter(Boolean);
const DRY_RUN = /^true$/i.test(process.env.DRY_RUN || 'false');

if (!TASK) {
  console.error('TASK is required.');
  process.exit(1);
}

function globToRegExp(glob) {
  // Very small glob -> RegExp: supports **, *, ?, and path separators
  let re = glob
    .replace(/[.+^${}()|[\]\\]/g, '\\$&') // escape regex chars
    .replace(/\*\*/g, '::DOUBLE_STAR::')
    .replace(/\*/g, '[^/]*')
    .replace(/\?/g, '[^/]')
    .replace(/::DOUBLE_STAR::/g, '.*');
  return new RegExp('^' + re + '$');
}

const includeRegexes = INCLUDE_GLOBS.length
  ? INCLUDE_GLOBS.map(globToRegExp)
  : [/.*/];

function include(path) {
  return includeRegexes.some((r) => r.test(path));
}

function git(cmd) {
  return execSync(cmd, { encoding: 'utf8' }).trim();
}

function listFiles() {
  const out = git('git ls-files');
  const files = out.split('\n').filter((f) => include(f));
  return files;
}

function collectContext(maxFiles = 40, maxBytes = 400_000) {
  const files = listFiles();
  const selected = [];
  let used = 0;
  for (const f of files) {
    const abs = resolve(f);
    try {
      const content = readFileSync(abs, 'utf8');
      if (used + content.length > maxBytes) break;
      selected.push({ path: f, content });
      used += content.length;
      if (selected.length >= maxFiles) break;
    } catch (_) {
      // skip binary/unreadable
    }
  }
  return selected;
}

async function callOpenAI(prompt) {
  const key = process.env.OPENAI_API_KEY;
  if (!key) throw new Error('OPENAI_API_KEY is required for provider=openai');
  const res = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${key}`,
    },
    body: JSON.stringify({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content:
            'You are an expert code assistant. Return only valid JSON with shape {"changes":[{"path":"relative/path","content":"full file content"}]} and nothing else.',
        },
        { role: 'user', content: prompt },
      ],
      temperature: 0,
    }),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`OpenAI API error: ${res.status} ${text}`);
  }
  const data = await res.json();
  const msg = data.choices?.[0]?.message?.content?.trim?.();
  return msg || '';
}

async function callAnthropic(prompt) {
  const key = process.env.ANTHROPIC_API_KEY;
  if (!key) throw new Error('ANTHROPIC_API_KEY is required for provider=anthropic');
  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': key,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: 'claude-3-5-sonnet-latest',
      max_tokens: 2000,
      system:
        'You are an expert code assistant. Return only valid JSON with shape {"changes":[{"path":"relative/path","content":"full file content"}]} and nothing else.',
      messages: [{ role: 'user', content: prompt }],
    }),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Anthropic API error: ${res.status} ${text}`);
  }
  const data = await res.json();
  const msg = data.content?.[0]?.text?.trim?.();
  return msg || '';
}

function buildPrompt(task, ctxFiles) {
  const header = `Task:\n${task}\n\nFiles (subset of repo for context):\n`;
  const list = ctxFiles
    .map((f) => `--- ${f.path} ---\n${f.content.substring(0, 8000)}\n`)
    .join('\n');
  const instruction = `\nConstraints:\n- Only modify files that clearly relate to the task.\n- Return JSON only: {"changes":[{"path":"<relative path>","content":"<full new content>"}]}\n- Do not include code fences or comments outside JSON.\n`;
  return header + list + instruction;
}

async function main() {
  const ctx = collectContext();
  const prompt = buildPrompt(TASK, ctx);

  let raw = '';
  if (PROVIDER === 'openai') raw = await callOpenAI(prompt);
  else if (PROVIDER === 'anthropic') raw = await callAnthropic(prompt);
  else throw new Error(`Unsupported provider: ${PROVIDER}`);

  let parsed;
  try {
    parsed = JSON.parse(raw);
  } catch (e) {
    console.error('AI did not return valid JSON. Raw output:');
    console.error(raw);
    throw e;
  }

  const changes = Array.isArray(parsed?.changes) ? parsed.changes : [];
  if (changes.length === 0) {
    console.log('No changes suggested by AI.');
    return;
  }

  for (const c of changes) {
    if (!c?.path || typeof c.content !== 'string') continue;
    if (!include(c.path)) {
      console.log(`Skip (not in include_globs): ${c.path}`);
      continue;
    }
    const abs = resolve(c.path);
    console.log(`${DRY_RUN ? 'Would write' : 'Writing'}: ${c.path}`);
    if (!DRY_RUN) {
      // ensure parent exists is omitted for simplicity; assume tracked files
      writeFileSync(abs, c.content, 'utf8');
    }
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});

