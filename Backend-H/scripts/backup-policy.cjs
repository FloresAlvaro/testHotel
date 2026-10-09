const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const suffixes = ['', '.sha256', '.verified.json'];
const filename = /^hotel-\d{13}-[a-f0-9]{8}\.dump$/;
async function digest(file) {
  const hash = crypto.createHash('sha256');
  for await (const chunk of fs.createReadStream(file)) hash.update(chunk);
  return hash.digest('hex');
}
function keepCount(value = '14') {
  const count = Number(value);
  if (!Number.isSafeInteger(count) || count < 2 || count > 10000)
    throw new Error('BACKUP_KEEP_COUNT debe ser un entero entre 2 y 10000');
  return count;
}
function prune(directory, keep) {
  const complete = fs
    .readdirSync(directory)
    .filter((name) => {
      if (!filename.test(name)) return false;
      const file = path.join(directory, name);
      try {
        if (!suffixes.every((suffix) => fs.lstatSync(file + suffix).isFile())) return false;
        const manifest = JSON.parse(fs.readFileSync(`${file}.verified.json`, 'utf8'));
        return manifest.sha256 === fs.readFileSync(`${file}.sha256`, 'utf8').trim();
      } catch {
        return false;
      }
    })
    .sort()
    .reverse();
  for (const name of complete.slice(keep))
    for (const suffix of suffixes) fs.unlinkSync(path.join(directory, name + suffix));
}
async function finalize(file, keep, mirror) {
  const expected = fs.readFileSync(`${file}.sha256`, 'utf8').trim();
  if (
    (await digest(file)) !== expected ||
    JSON.parse(fs.readFileSync(`${file}.verified.json`, 'utf8')).sha256 !== expected
  )
    throw new Error('No se puede conservar una copia sin verificación válida');
  if (mirror) {
    const destination = path.resolve(mirror);
    if (destination === path.dirname(file))
      throw new Error('BACKUP_MIRROR_DIRECTORY debe ser otra ubicación');
    fs.mkdirSync(destination, { recursive: true });
    const target = path.join(destination, path.basename(file));
    for (const suffix of ['', '.sha256'])
      fs.copyFileSync(file + suffix, target + suffix, fs.constants.COPYFILE_EXCL);
    if ((await digest(target)) !== expected) throw new Error('La copia externa no coincide');
    fs.copyFileSync(`${file}.verified.json`, `${target}.verified.json`, fs.constants.COPYFILE_EXCL);
    prune(destination, keep);
  }
  prune(path.dirname(file), keep);
}
module.exports = { digest, keepCount, prune, finalize };
