const dns = require('dns');

const regions = [
  'us-east-1',
  'us-east-2',
  'us-west-1',
  'us-west-2',
  'eu-central-1',
  'eu-west-1',
  'eu-west-2',
  'eu-west-3',
  'ap-southeast-1',
  'ap-southeast-2',
  'ap-northeast-1',
  'ap-northeast-2',
  'sa-east-1'
];

async function check() {
  for (const reg of regions) {
    const host = `aws-0-${reg}.pooler.supabase.com`;
    dns.resolve4(host, (err, addresses) => {
      if (!err) {
        console.log(`RESOLVED: ${host} -> ${addresses.join(', ')}`);
      }
    });
  }
}

check();
