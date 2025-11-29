
const { Client, LocalAuth, MessageMedia } = require('whatsapp-web.js');
const qrcode = require('qrcode-terminal');
const EventEmitter = require('events');
const fs = require('fs');
const path = require('path');
const http = require('http');
const https = require('https');

class WhatsAppService extends EventEmitter {
  constructor() {
    super();
    this.client = null;
    this.status = 'disconnected'; // disconnected, scanning, connected
    this.qrCodeData = null;
    this.userId = 'default-user'; 
  }

  initialize() {
    if (this.client) {
      console.log('[whatsappService] Client is already initialized.');
      return;
    }

    console.log('[whatsappService] Starting initialization...');
    this.status = 'initializing';
    this.emit('status', this.status);

    try {
      console.log('[whatsappService] Creating new Client...');
      this.client = new Client({
        authStrategy: new LocalAuth({ 
          clientId: this.userId,
        }),
        puppeteer: {
          headless: true,
          executablePath: '/usr/bin/chromium',
          args: [
            '--no-sandbox',
            '--disable-setuid-sandbox',
            '--disable-dev-shm-usage',
            '--disable-accelerated-2d-canvas',
            '--no-first-run',
            '--no-zygote',
            '--single-process',
            '--disable-gpu'
          ],
        },
      });
      console.log('[whatsappService] Client created.');

      console.log('[whatsappService] Attaching event listeners...');
      this.client.on('qr', (qr) => {
        console.log('[whatsappService] QR code received.');
        this.status = 'scanning';
        this.qrCodeData = qr;
        // qrcode.generate(qr, { small: true }); // Avoid logging to console, send to frontend
        this.emit('qr', qr);
        this.emit('status', this.status);
      });

      this.client.on('ready', () => {
        console.log('[whatsappService] Client is ready!');
        this.status = 'connected';
        this.qrCodeData = null;
        this.emit('ready');
        this.emit('status', this.status);
      });

      this.client.on('authenticated', () => {
        console.log('[whatsappService] Client is authenticated!');
        this.status = 'connected';
        this.qrCodeData = null;
        this.emit('authenticated');
        this.emit('status', this.status);
      });

      this.client.on('auth_failure', (msg) => {
        console.error('[whatsappService] Authentication failure:', msg);
        this.status = 'disconnected';
        this.emit('status', this.status);
        this.destroy();
      });

      this.client.on('disconnected', (reason) => {
        console.log('[whatsappService] Client disconnected:', reason);
        this.status = 'disconnected';
        this.emit('status', this.status);
        this.destroy();
      });

      this.client.on('message_ack', (msg, ack) => {
        this.emit('message_ack', { msg, ack });
      });
      console.log('[whatsappService] Event listeners attached.');

      console.log('[whatsappService] Calling client.initialize()...');
      this.client.initialize().catch(err => {
        console.error('[whatsappService] client.initialize() failed:', err);
        this.destroy();
      });
      console.log('[whatsappService] client.initialize() called.');

    } catch (err) {
      console.error('[whatsappService] Error during client instantiation:', err);
      this.destroy();
    }
  }

  async logout() {
    if (this.client) {
      console.log('Logging out WhatsApp client...');
      try {
        await this.client.logout();
      } catch (err) {
        console.error('Error during logout:', err);
      } finally {
        this.destroy();
      }
    }
  }
  
  destroy() {
    if (this.client) {
      this.client.destroy().catch(err => console.error('Error destroying client:', err));
    }
    this.client = null;
    this.status = 'disconnected';
    this.qrCodeData = null;
    this.emit('disconnected');
  }

  getStatus() {
    return {
      status: this.status,
      qrCode: this.qrCodeData
    };
  }

  async sendMessage(to, content, mediaUrl = null) {
    if (this.status !== 'connected') {
      throw new Error('WhatsApp client is not connected.');
    }

    const chatId = to.includes('@') ? to : `${to}@c.us`;

    try {
      // If mediaUrl is provided, try to send media with optional caption
      if (mediaUrl) {
        let media = null;

        const inferMime = (ext) => {
          ext = ext.toLowerCase();
          if (ext === '.jpg' || ext === '.jpeg') return 'image/jpeg';
          if (ext === '.png') return 'image/png';
          if (ext === '.gif') return 'image/gif';
          if (ext === '.mp4') return 'video/mp4';
          if (ext === '.webp') return 'image/webp';
          return 'application/octet-stream';
        };

        // Helper to download remote URL into Buffer
        const downloadToBuffer = (url) => new Promise((resolve, reject) => {
          try {
            const client = url.startsWith('https') ? https : http;
            client.get(url, (res) => {
              if (res.statusCode >= 400) return reject(new Error(`Request failed with status ${res.statusCode}`));
              const chunks = [];
              res.on('data', (chunk) => chunks.push(chunk));
              res.on('end', () => resolve(Buffer.concat(chunks)));
            }).on('error', reject);
          } catch (err) { reject(err); }
        });

        try {
          if (mediaUrl.startsWith('/uploads') || mediaUrl.startsWith('uploads')) {
            // Local file served by Express uploads folder
            const abs = path.resolve(__dirname, '..', '..', mediaUrl.replace(/^\/*/, ''));
            const data = fs.readFileSync(abs);
            const mime = inferMime(path.extname(abs));
            media = new MessageMedia(mime, data.toString('base64'), path.basename(abs));
          } else if (mediaUrl.startsWith('http://') || mediaUrl.startsWith('https://')) {
            const buffer = await downloadToBuffer(mediaUrl);
            const ext = path.extname(new URL(mediaUrl).pathname) || '';
            const mime = inferMime(ext);
            media = new MessageMedia(mime, buffer.toString('base64'), path.basename(new URL(mediaUrl).pathname));
          }

          if (media) {
            const msg = await this.client.sendMessage(chatId, media, { caption: content || '' });
            return msg;
          }
        } catch (err) {
          console.error('Failed to prepare/send media, falling back to text:', err);
          // fall through to send text message
        }
      }

      const msg = await this.client.sendMessage(chatId, content);
      return msg;
    } catch (error) {
      console.error(`Failed to send message to ${to}:`, error);
      throw error;
    }
  }

  async getGroups() {
    if (this.status !== 'connected') {
      return [];
    }

    try {
      const chats = await this.client.getChats();
      return chats
        .filter(chat => chat.isGroup)
        .map(group => ({
          id: group.id._serialized,
          name: group.name,
          participants: group.participants.length
        }));
    } catch (err) {
      console.error('Error fetching groups:', err);
      return [];
    }
  }
}

module.exports = new WhatsAppService();
