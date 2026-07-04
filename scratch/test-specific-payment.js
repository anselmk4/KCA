// scratch/test-specific-payment.js
// Utility to trigger the webhook locally for a specific payment ID from the UI.

const dns = require('dns');

// Force using IPv4 for localhost calls
dns.setDefaultResultOrder('ipv4first');

const args = process.argv.slice(2);
const paymentId = args[0];
const type = args[1] || 'student'; // 'student' or 'instructor'
const status = args[2] || 'Successful';

if (!paymentId) {
  console.error('Error: Please provide a payment ID.');
  console.log('Usage: node scratch/test-specific-payment.js <payment_id> [student|instructor] [Successful|Failed]');
  process.exit(1);
}

const prefix = type.toLowerCase() === 'instructor' ? 'ins_plan_' : 'std_pay_';
const reference = `${prefix}${paymentId}`;

async function run() {
  console.log(`Simulating webhook callback for reference: ${reference} (${status})...`);
  const webhookUrl = 'http://localhost:3000/api/webhooks/mobile-money';

  try {
    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        reference: reference,
        status: status
      })
    });

    const responseText = await response.text();
    console.log(`\nResponse Status: ${response.status}`);
    console.log('Response Body:', responseText);
    
    if (response.ok) {
      console.log('\n✅ Webhook simulated successfully. Check your browser/database to verify the activation!');
    } else {
      console.error('\n❌ Webhook returned an error.');
    }
  } catch (err) {
    console.error('\n❌ Error sending request to webhook:', err.message);
    console.log('Make sure your local Next.js dev server is running on http://localhost:3000');
  }
}

run();
