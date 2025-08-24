'use strict';

const https = require('https');
const { URL } = require('url');

/**
 * Send a JSON payload to a Discord webhook.
 * - No external dependencies.
 * - Supports "content", "username", "avatar_url", and "embeds".
 *
 * @param {string} webhookUrl Full Discord webhook URL
 * @param {Object} payload Discord webhook payload (content, username, avatar_url, embeds)
 * @returns {Promise<Object>} resolves with parsed response body (if JSON) or raw body
 */
async function sendDiscordWebhook(webhookUrl, payload = {}) {
  if (!webhookUrl) {
    throw new Error('Discord webhook URL is required (DISCORD_WEBHOOK_URL).');
  }

  const url = new URL(webhookUrl);
  const data = JSON.stringify(payload);

  const options = {
    hostname: url.hostname,
    path: url.pathname + (url.search || ''),
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Content-Length': Buffer.byteLength(data),
      'User-Agent': 'bitwatch-discord-notifier/1.0'
    }
  };

  return new Promise((resolve, reject) => {
    const req = https.request(options, (res) => {
      let body = '';
      res.setEncoding('utf8');
      res.on('data', (chunk) => (body += chunk));
      res.on('end', () => {
        const contentType = res.headers['content-type'] || '';
        if (contentType.includes('application/json')) {
          try {
            const parsed = JSON.parse(body);
            if (res.statusCode >= 200 && res.statusCode < 300) {
              resolve(parsed);
            } else {
              const err = new Error(`Discord webhook returned ${res.statusCode}`);
              err.response = parsed;
              reject(err);
            }
          } catch (e) {
            if (res.statusCode >= 200 && res.statusCode < 300) {
              resolve(body);
            } else {
              const err = new Error(`Discord webhook returned ${res.statusCode} and non-JSON body`);
              err.body = body;
              reject(err);
            }
          }
        } else {
          if (res.statusCode >= 200 && res.statusCode < 300) {
            resolve(body);
          } else {
            const err = new Error(`Discord webhook returned ${res.statusCode}`);
            err.body = body;
            reject(err);
          }
        }
      });
    });

    req.on('error', (err) => {
      reject(err);
    });

    req.write(data);
    req.end();
  });
}

/**
 * Convenience helper to build a transaction embed and send it.
 * @param {string} webhookUrl
 * @param {Object} opts
 *   - address: monitored address
 *   - txid: transaction id
 *   - valueSats: integer sats moved to/from address (optional)
 *   - direction: 'in'|'out'|'unknown'
 *   - link: optional URL (e.g. mempool.space link)
 *   - extra: optional additional text
 */
async function notifyTransaction(webhookUrl, opts = {}) {
  const { address, txid, valueSats, direction, link, extra } = opts;

  const title = `Transaction ${txid}`;
  const description = [
    address ? `Address: \`${address}\`` : null,
    typeof valueSats === 'number' ? `Value: **${valueSats.toLocaleString()} sats**` : null,
    direction ? `Direction: **${direction}**` : null,
    link ? `[View on mempool.space](${link})` : null,
    extra ? extra : null
  ]
    .filter(Boolean)
    .join('\n');

  const embed = {
    title,
    description,
    color: direction === 'in' ? 0x2ecc71 : direction === 'out' ? 0xe74c3c : 0x3498db,
    timestamp: new Date().toISOString(),
    footer: {
      text: 'bitwatch'
    }
  };

  const payload = {
    username: 'bitwatch',
    embeds: [embed]
  };

  return sendDiscordWebhook(webhookUrl, payload);
}

module.exports = {
  sendDiscordWebhook,
  notifyTransaction
};
