import { spawnSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

// Never turn registry errors, unsupported JSON or expired exceptions into a clean audit.
const directory = process.argv[2];
if (!['Backend-H', 'Frontend-H'].includes(directory)) throw new Error('Indica Backend-H o Frontend-H');
const exceptions = JSON.parse(readFileSync('.github/security-exceptions.json', 'utf8')).npm;
const lock = JSON.parse(readFileSync(resolve(directory, 'package-lock.json'), 'utf8'));
const result = spawnSync('npm', ['audit', '--json', '--ignore-scripts'], {
  cwd: directory, encoding: 'utf8', maxBuffer: 16 * 1024 * 1024,
});
if (result.error || ![0, 1].includes(result.status)) throw new Error('No se completó npm audit; comprueba el registro y la red');
const report = JSON.parse(result.stdout);
if (report.error || report.auditReportVersion !== 2 || !report.vulnerabilities || !report.metadata) {
  throw new Error('Respuesta de auditoría incompleta o incompatible');
}
const today = new Date().toISOString().slice(0, 10);
const validReviewDate = value => typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value)
  && !Number.isNaN(Date.parse(value)) && new Date(value).toISOString().slice(0, 10) === value;
const notices = new Map();
for (const vulnerability of Object.values(report.vulnerabilities)) {
  for (const advisory of vulnerability.via) {
    // String entries propagate another package's advisory; count each root advisory once.
    if (typeof advisory === 'string') {
      if (!report.vulnerabilities[advisory]) throw new Error(`Advisory transitivo sin origen: ${advisory}`);
      continue;
    }
    notices.set(`${vulnerability.name}:${advisory.url}`, { vulnerability, advisory });
  }
}
let blocked = 0;
for (const { vulnerability, advisory } of notices.values()) {
  const versions = vulnerability.nodes.map(path => lock.packages[path]?.version);
  const exception = exceptions.find(entry => entry.directory === directory
    && entry.package === vulnerability.name && entry.advisory === advisory.url
    && versions.length > 0 && versions.every(version => version === entry.version)
    && validReviewDate(entry.reviewBy) && entry.reviewBy >= today && entry.owner && entry.reason && entry.mitigation);
  if (exception) {
    console.log(`EXCEPCIÓN VISIBLE: ${vulnerability.name} ${versions.join(', ')} ${advisory.url}; responsable: ${exception.owner}; vence: ${exception.reviewBy}`);
  } else {
    // Include low severity too: a new finding requires a fix or a reviewed, expiring exception.
    blocked++;
    console.error(`BLOQUEADO: ${vulnerability.name} (${advisory.severity}) ${advisory.url}`);
  }
}
console.log(`${directory}: ${notices.size} advisories independientes; ${blocked} sin excepción válida.`);
if (Object.keys(report.vulnerabilities).length > 0 && notices.size === 0) throw new Error('Auditoría con vulnerabilidades sin advisory interpretable');
process.exitCode = blocked ? 1 : 0;
