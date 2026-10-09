const database = require('../src/config/database');
require('../src/config/migrate')()
  .then(() => console.log('Migraciones aplicadas'))
  .catch((error) => {
    console.error(error.message);
    process.exitCode = 1;
  })
  .finally(() => database.close());
