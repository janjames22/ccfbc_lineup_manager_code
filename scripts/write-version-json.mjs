import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const projectRoot = resolve(__dirname, '..');
const packageJson = JSON.parse(readFileSync(resolve(projectRoot, 'package.json'), 'utf8'));

const buildTime = process.env.VITE_BUILD_TIME || new Date().toISOString();
const commitSha =
  process.env.VERCEL_GIT_COMMIT_SHA ||
  process.env.GITHUB_SHA ||
  process.env.COMMIT_SHA ||
  '';
const commitLabel = commitSha ? commitSha.slice(0, 12) : '';
const timestampLabel = buildTime.replace(/[-:.TZ]/g, '').slice(0, 14);
const buildLabel = process.env.VITE_BUILD_ID || commitLabel || timestampLabel;
const appVersion = process.env.VITE_APP_VERSION || `${packageJson.version}-${buildLabel}`;
const serviceWorkerVersion = process.env.VITE_SERVICE_WORKER_VERSION || `sw-${appVersion}`;

const versionInfo = {
  version: appVersion,
  buildTime,
  serviceWorkerVersion,
  commit: commitSha,
};

writeFileSync(
  resolve(projectRoot, 'public/version.json'),
  `${JSON.stringify(versionInfo, null, 2)}\n`
);

console.log(`[version] ${versionInfo.version} (${versionInfo.serviceWorkerVersion})`);
