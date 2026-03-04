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

export async function toggleEntityHidden(
  stub: VaultEntityStub,
  hidden: boolean,
  pat: string,
): Promise<void> {
  const folder = TYPE_VAULT_FOLDER[stub.type.toUpperCase()] ?? `${stub.type.toLowerCase()}s`;
  const entityPath = `vault/${folder}/${stub.slug}.json`;
  const indexPath = 'vault/index.json';

  // Update entity file
  const { content: rawEntity } = await getFileContentAndSha(entityPath, pat);
  const entityData: VaultEntity = JSON.parse(rawEntity);
  entityData.hidden = hidden;
  await pushVaultFile(
    entityPath,
    JSON.stringify(entityData, null, 2),
    `${hidden ? 'Hide' : 'Reveal'} ${entityData.name}`,
    pat,
  );

  // Update index.json
  const { content: rawIndex } = await getFileContentAndSha(indexPath, pat);
  const indexData: VaultIndex = JSON.parse(rawIndex);
  const stubEntry = indexData.entities.find(e => e.id === stub.id);
  if (stubEntry) stubEntry.hidden = hidden;
  await pushVaultFile(
    indexPath,
    JSON.stringify(indexData, null, 2),
    `${hidden ? 'Hide' : 'Reveal'} ${entityData.name} in index`,
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
