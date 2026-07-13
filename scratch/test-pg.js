try {
  const pg = require('pg');
  console.log('pg is installed!');
} catch (e) {
  console.log('pg is not installed:', e.message);
}
