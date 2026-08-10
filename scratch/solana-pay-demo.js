/**
 * Kuettu Crypto Academy - Solana Pay Integration Script
 * Demonstrates generating a Solana Pay Request URL for USDC payments and verifying the transaction on-chain.
 * 
 * Dependencies to install:
 * npm install @solana/web3.js @solana/pay bignumber.js
 */

const { Connection, PublicKey, Keypair } = require('@solana/web3.js');
const { encodeURL, findReference, validateTransfer } = require('@solana/pay');
const BigNumber = require('bignumber.js');

// 1. CONFIGURATION
// Use Solana Devnet for testing, change to mainnet-beta for production
const SOLANA_RPC_URL = 'https://api.devnet.solana.com';
const connection = new Connection(SOLANA_RPC_URL, 'confirmed');

// Merchant account receiving USDC
const MERCHANT_WALLET = new PublicKey('AnsLA11111111111111111111111111111111111111'); 

// USDC Mint Address (Devnet USDC, change to 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v' for Mainnet USDC)
const USDC_MINT = new PublicKey('Gh9ZwEmdLJ8DscKNTMSSRGtiXZHxRR6CctvMSHP6mWvX'); 

/**
 * Generates a Solana Pay transaction Request URL.
 * 
 * @param {number} amountInUsdc - Fixed amount of USDC to pay.
 * @param {string} orderId - Merchant order ID for tracking.
 * @returns {Object} { url: string, reference: string }
 */
function generateSolanaPayUrl(amountInUsdc, orderId) {
  // Generate a unique reference Keypair. The public key is embedded in the transaction as a read-only account.
  // We use this public key on-chain to locate and track this specific transaction.
  const referenceKeypair = Keypair.generate();
  const reference = referenceKeypair.publicKey;

  const amount = new BigNumber(amountInUsdc);
  const label = 'Ansella Academy';
  const message = `Paiement Formation - Commande #${orderId}`;
  const memo = `ANS-${orderId}`; // Will be embedded on-chain in the Solana Memo Program

  // Generate the solana: transaction URL
  const url = encodeURL({
    recipient: MERCHANT_WALLET,
    amount,
    splToken: USDC_MINT,
    reference,
    label,
    message,
    memo,
  });

  return {
    url: url.toString(),
    reference: reference.toBase58(),
  };
}

/**
 * Polls the Solana network to find and validate the payment transaction.
 * 
 * @param {string} referenceBase58 - The reference public key as base58 string.
 * @param {number} expectedAmountInUsdc - The expected USDC amount.
 * @param {number} maxAttempts - Number of polling cycles before timeout.
 */
async function verifyPayment(referenceBase58, expectedAmountInUsdc, maxAttempts = 30) {
  const reference = new PublicKey(referenceBase58);
  const amount = new BigNumber(expectedAmountInUsdc);

  console.log(`\nRecherche de la transaction pour la référence: ${referenceBase58}...`);
  
  let attempt = 0;
  while (attempt < maxAttempts) {
    attempt++;
    console.log(`Tentative ${attempt}/${maxAttempts}...`);

    try {
      // Find the transaction signature containing the reference on-chain
      const signatureInfo = await findReference(connection, reference, { finality: 'confirmed' });
      const signature = signatureInfo.signature;
      console.log(`✔ Transaction trouvée ! Signature: ${signature}`);
      
      console.log(`Validation du transfert en cours...`);
      // Validate that the transaction matches the expected parameters
      // (recipient, amount, SPL token mint, and reference account)
      const validatedTx = await validateTransfer(connection, signature, {
        recipient: MERCHANT_WALLET,
        amount,
        splToken: USDC_MINT,
        reference,
      });

      console.log('🎉 PAIEMENT VALIDÉ AVEC SUCCÈS !');
      console.log('Détails de la transaction validée:', {
        signature,
        slot: validatedTx.slot,
        amount: expectedAmountInUsdc + ' USDC',
      });
      return true;

    } catch (error) {
      // Handle known Solana Pay errors
      if (error.name === 'FindReferenceError') {
        // Transaction not found yet on-chain, poll again in next iteration
        await new Promise((resolve) => setTimeout(resolve, 2000));
        continue;
      }

      // Handle validation errors (amount mismatch, wrong token, wrong recipient, etc.)
      console.error('❌ Échec de la validation du paiement:', error.message);
      throw error;
    }
  }

  throw new Error('Timeout: Le paiement n\'a pas été validé dans le délai imparti.');
}

// 2. DEMO USAGE
async function demo() {
  try {
    const orderId = '987654';
    const amount = 49.99; // 49.99 USDC

    // Generate payment link (typically converted to QR code for user to scan in Phantom/Solflare)
    const { url, reference } = generateSolanaPayUrl(amount, orderId);
    console.log('=== Solana Pay Link Generated ===');
    console.log('URL de Paiement:', url);
    console.log('Référence unique pour suivi:', reference);
    
    // Simulate payment validation polling (async)
    // Note: Since this is a demo, it will timeout unless you send actual Devnet USDC to MERCHANT_WALLET
    // containing the reference key in the transaction accounts.
    console.log('\n=== Simulation de vérification ===');
    await verifyPayment(reference, amount, 3);

  } catch (error) {
    console.error('\n=== Erreur Démo ===');
    console.error(error.message);
  }
}

if (require.main === module) {
  demo();
}
