import fs from 'node:fs';

const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
const tauriConfig = JSON.parse(fs.readFileSync('src-tauri/tauri.conf.json', 'utf8'));
const cargoToml = fs.readFileSync('src-tauri/Cargo.toml', 'utf8');
const types = fs.readFileSync('src/types.ts', 'utf8');

const cargoVersion = cargoToml.match(/^version\s*=\s*"([^"]+)"/m)?.[1];
const appVersion = types.match(/APP_VERSION\s*=\s*'([^']+)'/)?.[1];
const versions = {
  'package.json': packageJson.version,
  'src-tauri/tauri.conf.json': tauriConfig.version,
  'src-tauri/Cargo.toml': cargoVersion,
  'src/types.ts': appVersion,
};

const expected = packageJson.version;
const mismatches = Object.entries(versions).filter(([, version]) => version !== expected);

if (!/^\d+\.\d+\.\d+(?:[-+][0-9A-Za-z.-]+)?$/.test(expected)) {
  console.error(`Invalid release version: ${expected}`);
  process.exit(1);
}

if (mismatches.length) {
  console.error('Version mismatch:');
  for (const [file, version] of Object.entries(versions)) {
    console.error(`  ${file}: ${version ?? 'missing'}`);
  }
  process.exit(1);
}

console.log(`Version check passed: ${expected}`);
