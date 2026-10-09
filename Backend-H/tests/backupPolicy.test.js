const fs = require('node:fs');
const path = require('node:path');
const os = require('node:os');
const policy = require('../scripts/backup-policy.cjs');
describe('Retención de copias verificadas', () => {
  let directory;
  beforeEach(() => {
    directory = fs.mkdtempSync(path.join(os.tmpdir(), 'hotel-backup-policy-'));
  });
  afterEach(() => {
    // Solo se elimina el directorio temporal creado por esta prueba.
    if (
      path.dirname(directory) !== os.tmpdir() ||
      !path.basename(directory).startsWith('hotel-backup-policy-')
    )
      throw new Error('Destino inválido');
    fs.rmSync(directory, { recursive: true });
  });
  const create = async (index, content = 'archive') => {
    const file = path.join(directory, `hotel-${1700000000000 + index}-aabbccdd.dump`);
    fs.writeFileSync(file, content);
    const hash = await policy.digest(file);
    fs.writeFileSync(`${file}.sha256`, hash);
    fs.writeFileSync(`${file}.verified.json`, JSON.stringify({ sha256: hash }));
    return file;
  };
  test('conserva las últimas copias, archivos ajenos y archivos incompletos', async () => {
    const first = await create(1);
    await create(2);
    const last = await create(3);
    fs.writeFileSync(path.join(directory, 'other.dump'), 'keep');
    fs.writeFileSync(path.join(directory, 'hotel-1600000000000-aabbccdd.dump'), 'incomplete');
    await policy.finalize(last, 2);
    expect(fs.existsSync(first)).toBe(false);
    expect(fs.existsSync(last)).toBe(true);
    expect(fs.existsSync(path.join(directory, 'other.dump'))).toBe(true);
    expect(fs.existsSync(path.join(directory, 'hotel-1600000000000-aabbccdd.dump'))).toBe(true);
  });
  test('verifica la copia externa antes de aplicar retención', async () => {
    const file = await create(1);
    const mirror = path.join(directory, 'mirror');
    await policy.finalize(file, 2, mirror);
    expect(await policy.digest(path.join(mirror, path.basename(file)))).toBe(
      await policy.digest(file),
    );
    expect(fs.existsSync(path.join(mirror, `${path.basename(file)}.verified.json`))).toBe(true);
  });
  test('una copia corrupta no permite borrar las anteriores', async () => {
    const first = await create(1);
    await create(2);
    const last = await create(3);
    fs.appendFileSync(last, 'corrupt');
    await expect(policy.finalize(last, 2)).rejects.toThrow();
    expect(fs.existsSync(first)).toBe(true);
  });
});
