import type { VaultEntity, VaultEntityStub, VaultIndex } from '../types';
import { TYPE_VAULT_FOLDER } from '../types';
import { vaultService } from '../vaultService';

const VAULT_OWNER = 'GamerDad29';
const VAULT_REPO = 'mythos-vault';
const VAULT_BRANCH = 'main';
const API_BASE = `https://api.github.com/repos/${VAULT_OWNER}/${VAULT_REPO}/contents`;

function toBase64(content: string): string {
  return btoa(unescape(encodeURIComponent(content)));
}

async function getFileContentAndSha(
  path: string,
  pat: string,
): Promise<{ content: string; sha: string }> {
  const res = await fetch(`${API_BASE}/${path}?ref=${VAULT_BRANCH}`, {
    headers: {
      Authorization: `token ${pat}`,
      Accept: 'application/vnd.github.v3+json',
    },
  });
  if (!res.ok) throw new Error(`GitHub GET failed for ${path}: ${res.status}`);
  const json = await res.json();
  const content = decodeURIComponent(escape(atob(json.content.replace(/\s/g, ''))));
  return { content, sha: json.sha };
}

async function putFile(path: string, content: string, message: string, sha: string, pat: string): Promise<void> {
  const res = await fetch(`${API_BASE}/${path}`, {
    method: 'PUT',
    headers: {
      Authorization: `token ${pat}`,
      Accept: 'application/vnd.github.v3+json',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ message, content: toBase64(content), sha, branch: VAULT_BRANCH }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({})) as { message?: string };
    throw new Error(`GitHub PUT failed for ${path}: ${res.status} ${err.message || ''}`);
  }
}

// Re-fetches the SHA immediately before each attempt — handles concurrent commits landing between GET and PUT.
async function putFileWithRetry(
  path: string,
  buildContent: (existing: string) => string,
  message: string,
  pat: string,
  maxAttempts = 4,
): Promise<void> {
  let lastErr: Error | null = null;
  for (let i = 0; i < maxAttempts; i++) {
    if (i > 0) await new Promise(r => setTimeout(r, 1000 * i));
    try {
      const { content: existing, sha } = await getFileContentAndSha(path, pat);
      const updated = buildContent(existing);
      await putFile(path, updated, message, sha, pat);
      return;
    } catch (err) {
      lastErr = err instanceof Error ? err : new Error(String(err));
      // Only retry on 409 conflict — anything else is a real error
      if (lastErr.message && !lastErr.message.includes('409')) throw lastErr;
    }
  }
  throw lastErr!;
}

export async function pushVaultFile(
  path: string,
  content: string,
  message: string,
  pat: string,
): Promise<void> {
  const { sha } = await getFileContentAndSha(path, pat);
  const res = await fetch(`${API_BASE}/${path}`, {
    method: 'PUT',
    headers: {
      Authorization: `token ${pat}`,
      Accept: 'application/vnd.github.v3+json',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      message,
      content: toBase64(content),
      sha,
      branch: VAULT_BRANCH,
    }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({})) as { message?: string };
    throw new Error(`GitHub PUT failed for ${path}: ${res.status} ${err.message || ''}`);
  }
}

export async function updateEntityImage(
  entity: VaultEntity,
  imageUrl: string,
  pat: string,
): Promise<void> {
  const folder = TYPE_VAULT_FOLDER[entity.type.toUpperCase()] ?? `${entity.type.toLowerCase()}s`;
  const entityPath = `vault/${folder}/${entity.slug}.json`;

  await putFileWithRetry(
    entityPath,
    (raw) => {
      const data: VaultEntity = JSON.parse(raw);
      data.imageUrl = imageUrl;
      return JSON.stringify(data, null, 2);
    },
    `image: regenerate image for ${entity.name}`,
    pat,
  );

  await putFileWithRetry(
    'vault/index.json',
    (raw) => {
      const index: VaultIndex = JSON.parse(raw);
      const stub = index.entities.find(e => e.id === entity.id);
      if (stub) stub.imageUrl = imageUrl;
      return JSON.stringify(index, null, 2);
    },
    `image: update index imageUrl for ${entity.name}`,
    pat,
  );

  vaultService.clearCache();
}

export async function updateImagePosition(
  entity: VaultEntity,
  imagePosition: string,
  pat: string,
): Promise<void> {
  const folder = TYPE_VAULT_FOLDER[entity.type.toUpperCase()] ?? `${entity.type.toLowerCase()}s`;
  const entityPath = `vault/${folder}/${entity.slug}.json`;

  await putFileWithRetry(
    entityPath,
    (raw) => {
      const data: VaultEntity = JSON.parse(raw);
      data.imagePosition = imagePosition;
      return JSON.stringify(data, null, 2);
    },
    `frame: update portrait position for ${entity.name}`,
    pat,
  );

  await putFileWithRetry(
    'vault/index.json',
    (raw) => {
      const index: VaultIndex = JSON.parse(raw);
      const stub = index.entities.find(e => e.id === entity.id);
      if (stub) stub.imagePosition = imagePosition;
      return JSON.stringify(index, null, 2);
    },
    `frame: update index imagePosition for ${entity.name}`,
    pat,
  );

  vaultService.clearCache();
}

export async function updateSessionImagePosition(
  sessionSlug: string,
  imagePosition: string,
  pat: string,
): Promise<void> {
  await putFileWithRetry(
    'vault/sessions/index.json',
    (raw) => {
      const index = JSON.parse(raw);
      const entry = index.sessions?.find((s: { slug: string }) => s.slug === sessionSlug);
      if (entry) entry.imagePosition = imagePosition;
      return JSON.stringify(index, null, 2);
    },
    `frame: update hero position for session ${sessionSlug}`,
    pat,
  );
  vaultService.clearCache();
}

export async function toggleEntityHidden(
  stub: VaultEntityStub,
  hidden: boolean,
  pat: string,
): Promise<void> {
  const folder = TYPE_VAULT_FOLDER[stub.type.toUpperCase()] ?? `${stub.type.toLowerCase()}s`;
  const entityPath = `vault/${folder}/${stub.slug}.json`;
  const label = hidden ? 'Hide' : 'Reveal';

  let entityName = stub.name;

  await putFileWithRetry(
    entityPath,
    (raw) => {
      const data: VaultEntity = JSON.parse(raw);
      entityName = data.name;
      data.hidden = hidden;
      return JSON.stringify(data, null, 2);
    },
    `${label} ${entityName}`,
    pat,
  );

  await putFileWithRetry(
    'vault/index.json',
    (raw) => {
      const index: VaultIndex = JSON.parse(raw);
      const entry = index.entities.find(e => e.id === stub.id);
      if (entry) entry.hidden = hidden;
      return JSON.stringify(index, null, 2);
    },
    `${label} ${entityName} in index`,
    pat,
  );

  vaultService.clearCache();
}

function hideSection(content: string, sectionTitle: string): string {
  const lines = content.split('\n');
  const startIdx = lines.findIndex(l => l.trim() === `## ${sectionTitle}`);
  if (startIdx === -1) return content;

  let endIdx = lines.length;
  for (let i = startIdx + 1; i < lines.length; i++) {
    if (lines[i].startsWith('## ')) {
      endIdx = i;
      break;
    }
  }

  const section = lines.slice(startIdx, endIdx);
  // Trim trailing blank lines inside the section
  while (section.length > 0 && section[section.length - 1].trim() === '') section.pop();

  return [
    ...lines.slice(0, startIdx),
    '[HIDDEN]',
    ...section,
    '[/HIDDEN]',
    ...lines.slice(endIdx),
  ].join('\n');
}

function revealSection(content: string, sectionTitle: string): string {
  const escaped = sectionTitle.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const regex = new RegExp(
    `\\[HIDDEN\\]\\s*\\n(## ${escaped}[\\s\\S]*?)\\n?\\[/HIDDEN\\]\\n?`,
    'i',
  );
  return content.replace(regex, '$1\n');
}

export async function toggleSectionHidden(
  entity: VaultEntity,
  sectionTitle: string,
  hide: boolean,
  pat: string,
): Promise<string> {
  const folder = TYPE_VAULT_FOLDER[entity.type.toUpperCase()] ?? `${entity.type.toLowerCase()}s`;
  const entityPath = `vault/${folder}/${entity.slug}.json`;

  const { content: rawEntity } = await getFileContentAndSha(entityPath, pat);
  const entityData: VaultEntity = JSON.parse(rawEntity);

  const updatedContent = hide
    ? hideSection(entityData.content, sectionTitle)
    : revealSection(entityData.content, sectionTitle);

  entityData.content = updatedContent;

  await pushVaultFile(
    entityPath,
    JSON.stringify(entityData, null, 2),
    `${hide ? 'Hide' : 'Reveal'} section "${sectionTitle}" in ${entity.name}`,
    pat,
  );

  vaultService.clearCache();
  return updatedContent;
}
