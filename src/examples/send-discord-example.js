'use strict';

/**
 * Example usage:
 * - This file shows how to call the notifier when your code detects a transaction.
 * - Adjust the import path to match where you integrate it in your project.
 *
 * To run (example):
 *   DISCORD_WEBHOOK_URL="https://discord.com/api/webhooks/..." node src/examples/send-discord-example.js
 */

const { notifyTransaction } = require('../notifications/discord');

async function main() {
  const webhook = process.env.DISCORD_WEBHOOK_URL;
  if (!webhook) {
    console.error('Set DISCORD_WEBHOOK_URL in your environment to test');
    process.exit(1);
  }

  try {
    const txid = 'example-txid-000000000000000000000000000000000000000000000000';
    const address = 'bc1q...';
    const link = `https://mempool.space/tx/${txid}`;
    const resp = await notifyTransaction(webhook, {
      address,
      txid,
      valueSats: 123456,
      direction: 'in',
      link,
      extra: 'Detected in mempool'
    });
    console.log('Discord response:', resp);
  } catch (err) {
    console.error('Failed to send Discord notification', err);
    process.exit(2);
  }
}

if (require.main === module) {
  main();
}
