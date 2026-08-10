const https = require('https');

async function run() {
  const paymentId = "36e54daa-0cf8-46bd-a0c6-1a57f257b4a7";
  const data = JSON.stringify([{
    depositId: paymentId,
    status: "COMPLETED",
    amount: "70.00",
    currency: "CDF",
    payer: {
      type: "MSISDN",
      address: {
        value: "243812345678"
      }
    }
  }]);

  const options = {
    hostname: 'ansella.app',
    port: 443,
    path: '/api/webhooks/pawapay',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Content-Length': data.length
    }
  };

  console.log(`Sending POST to https://ansella.app/api/webhooks/pawapay for paymentId ${paymentId}...`);

  const req = https.request(options, (res) => {
    console.log('Response Status:', res.statusCode);
    
    let body = '';
    res.on('data', (d) => {
      body += d;
    });
    
    res.on('end', () => {
      console.log('Response Body:', body);
    });
  });

  req.on('error', (e) => {
    console.error('Request error:', e.message);
  });

  req.write(data);
  req.end();
}

run();
