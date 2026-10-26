import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, mkdirSync, copyFileSync, writeFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve, delimiter } from 'node:path';
import { spawnSync } from 'node:child_process';

function auditFixture({ report, exception, version = '1.4.0', exit = 1 }) {
  const root = mkdtempSync(join(tmpdir(), 'hotel-audit-gate-'));
  try {
    for (const folder of ['.github', 'Frontend-H', 'bin']) mkdirSync(join(root, folder));
    copyFileSync(resolve('scripts/security/audit-dependencies.mjs'), join(root, 'audit.mjs'));
    writeFileSync(join(root, '.github/security-exceptions.json'), JSON.stringify({ npm: exception ? [exception] : [] }));
    writeFileSync(join(root, 'Frontend-H/package-lock.json'), JSON.stringify({ packages: { 'node_modules/node-forge': { version } } }));
    writeFileSync(join(root, 'bin/npm'), `#!/bin/sh\ncat '${join(root, 'report.json')}'\nexit ${exit}\n`, { mode: 0o700 });
    writeFileSync(join(root, 'report.json'), typeof report === 'string' ? report : JSON.stringify(report));
    return spawnSync(process.execPath, ['audit.mjs', 'Frontend-H'], {
      cwd: root, encoding: 'utf8', env: { ...process.env, PATH: `${join(root, 'bin')}${delimiter}${process.env.PATH}` },
    });
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
}
const advisory = { url: 'https://github.com/advisories/GHSA-86w9-cpqp-85rv', severity: 'high' };
const report = {
  auditReportVersion: 2, metadata: {}, vulnerabilities: {
    'node-forge': { name: 'node-forge', nodes: ['node_modules/node-forge'], via: [advisory] },
    listhen: { name: 'listhen', nodes: ['node_modules/listhen'], via: ['node-forge'] },
  },
};
const exception = {
  directory: 'Frontend-H', package: 'node-forge', version: '1.4.0', advisory: advisory.url,
  reviewBy: '2999-01-01', owner: 'Security reviewer', reason: 'Fixture', mitigation: 'Fixture',
};
test('permite solo advisory y versión exceptuados; conserva aviso visible sin duplicar padres', () => {
  const result = auditFixture({ report, exception });
  assert.equal(result.status, 0, result.stderr);
  assert.match(result.stdout, /EXCEPCIÓN VISIBLE/);
  assert.match(result.stdout, /1 advisories independientes/);
});
test('bloquea nueva vulnerabilidad, versión distinta y excepción vencida', () => {
  assert.equal(auditFixture({ report }).status, 1);
  assert.equal(auditFixture({ report, exception, version: '1.4.1' }).status, 1);
  assert.equal(auditFixture({ report, exception: { ...exception, reviewBy: '2000-01-01' } }).status, 1);
  assert.equal(auditFixture({ report, exception: { ...exception, reviewBy: 'forever' } }).status, 1);
  assert.equal(auditFixture({ report, exception: { ...exception, reviewBy: '2999-02-31' } }).status, 1);
});
test('no acepta error de registro, respuesta inválida ni fallo de proceso como limpio', () => {
  assert.equal(auditFixture({ report: { error: { code: 'ENOTFOUND' } } }).status, 1);
  assert.equal(auditFixture({ report: 'not-json' }).status, 1);
  assert.equal(auditFixture({ report, exit: 2 }).status, 1);
});
test('acepta auditoría válida vacía', () => {
  assert.equal(auditFixture({ report: { auditReportVersion: 2, metadata: {}, vulnerabilities: {} }, exit: 0 }).status, 0);
});
