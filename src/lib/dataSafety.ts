import type { BackupSnapshot } from '../types';
import type { StorageAdapter } from './storage';

const BACKUP_DIR = 'backups';
const KEEP_AUTOMATIC_BACKUPS = 10;

function isTauri() {
  return typeof window !== 'undefined' && '__TAURI_INTERNALS__' in window;
}

function safeTimestamp(date = new Date()) {
  return date.toISOString().replace(/[:.]/g, '-');
}

function validateBackup(value: unknown): BackupSnapshot {
  const candidate = value as Partial<BackupSnapshot> | null;
  if (!candidate || ((candidate.app !== 'MyMediaBox' && candidate.app !== 'IMissTVTime')) || (candidate.schemaVersion !== 1 && candidate.schemaVersion !== 2 && candidate.schemaVersion !== 3)) {
    throw new Error('This is not a supported MyMediaBox backup file.');
  }
  if (!Array.isArray(candidate.library) || !Array.isArray(candidate.watchedEpisodes) || !Array.isArray(candidate.watchedMovies)) {
    throw new Error('The backup is missing required viewing data.');
  }
  return candidate as BackupSnapshot;
}

export async function createAutomaticBackup(storage: StorageAdapter, force = false): Promise<string | null> {
  if (!isTauri()) return null;
  const { BaseDirectory, exists, mkdir, readDir, remove, writeTextFile } = await import('@tauri-apps/plugin-fs');
  if (!(await exists(BACKUP_DIR, { baseDir: BaseDirectory.AppData }))) {
    await mkdir(BACKUP_DIR, { baseDir: BaseDirectory.AppData, recursive: true });
  }

  const entries = await readDir(BACKUP_DIR, { baseDir: BaseDirectory.AppData });
  const today = new Date().toISOString().slice(0, 10);
  if (!force && entries.some((entry) => entry.name?.startsWith(`MyMediaBox-backup-${today}`) || entry.name?.startsWith(`IMissTVTime-backup-${today}`))) return null;

  const snapshot = await storage.exportSnapshot();
  const filename = `MyMediaBox-backup-${safeTimestamp()}.json`;
  await writeTextFile(`${BACKUP_DIR}/${filename}`, JSON.stringify(snapshot, null, 2), { baseDir: BaseDirectory.AppData });

  const nextEntries = await readDir(BACKUP_DIR, { baseDir: BaseDirectory.AppData });
  const backups = nextEntries
    .map((entry) => entry.name)
    .filter((name): name is string => Boolean(name && (name.startsWith('MyMediaBox-backup-') || name.startsWith('IMissTVTime-backup-')) && name.endsWith('.json')))
    .sort()
    .reverse();
  for (const old of backups.slice(KEEP_AUTOMATIC_BACKUPS)) {
    await remove(`${BACKUP_DIR}/${old}`, { baseDir: BaseDirectory.AppData });
  }
  return filename;
}

export async function listAutomaticBackups(): Promise<string[]> {
  if (!isTauri()) return [];
  const { BaseDirectory, exists, readDir } = await import('@tauri-apps/plugin-fs');
  if (!(await exists(BACKUP_DIR, { baseDir: BaseDirectory.AppData }))) return [];
  const entries = await readDir(BACKUP_DIR, { baseDir: BaseDirectory.AppData });
  return entries
    .map((entry) => entry.name)
    .filter((name): name is string => Boolean(name && (name.startsWith('MyMediaBox-backup-') || name.startsWith('IMissTVTime-backup-')) && name.endsWith('.json')))
    .sort()
    .reverse();
}

export async function exportBackupFile(storage: StorageAdapter): Promise<boolean> {
  const snapshot = await storage.exportSnapshot();
  const text = JSON.stringify(snapshot, null, 2);
  const filename = `MyMediaBox-export-${new Date().toISOString().slice(0, 10)}.json`;

  if (isTauri()) {
    const { save } = await import('@tauri-apps/plugin-dialog');
    const { writeTextFile } = await import('@tauri-apps/plugin-fs');
    const path = await save({ defaultPath: filename, filters: [{ name: 'MyMediaBox backup', extensions: ['json'] }] });
    if (!path) return false;
    await writeTextFile(path, text);
    return true;
  }

  const blob = new Blob([text], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  URL.revokeObjectURL(url);
  return true;
}

async function browserPickJson(): Promise<string | null> {
  return new Promise((resolve) => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'application/json,.json';
    input.onchange = async () => {
      const file = input.files?.[0];
      resolve(file ? await file.text() : null);
    };
    input.click();
  });
}

export async function importBackupFile(storage: StorageAdapter): Promise<boolean> {
  let text: string | null = null;
  if (isTauri()) {
    const { open } = await import('@tauri-apps/plugin-dialog');
    const { readTextFile } = await import('@tauri-apps/plugin-fs');
    const path = await open({ multiple: false, directory: false, filters: [{ name: 'MyMediaBox backup', extensions: ['json'] }] });
    if (!path || Array.isArray(path)) return false;
    text = await readTextFile(path);
  } else {
    text = await browserPickJson();
  }
  if (!text) return false;
  const backup = validateBackup(JSON.parse(text));
  await storage.restoreSnapshot(backup);
  return true;
}
