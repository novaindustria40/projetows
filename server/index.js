
require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const multer = require('multer');
const bcrypt = require('bcrypt');
const { body, validationResult } = require('express-validator');
const { User, Campaign, ContactList, Message, MessageTemplate } = require('./models');
const whatsappService = require('./services/whatsapp');

const app = express();
const PORT = process.env.PORT || 80;

// Middleware
app.use(cors());
app.use(express.json());

// Request Logger
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
  next();
});

// Database Connection
const MONGODB_URI = process.env.MONGODB_URI;

mongoose.connect(MONGODB_URI)
  .then(() => console.log('Connected to MongoDB'))
  .catch(err => console.error('MongoDB connection error:', err));

// --- Event Listeners for Real-time Analytics ---
whatsappService.on('message_ack', async ({ msg, ack }) => {
  try {
    const messageRecord = await Message.findOne({ whatsappMessageId: msg.id._serialized });
    
    if (messageRecord) {
      let status = messageRecord.status;
      let updateFields = {};
      let incrementField = '';

      if (ack === 1 && status !== 'sent') {
        status = 'sent';
      } else if (ack === 2 && status !== 'delivered' && status !== 'read') {
        status = 'delivered';
        updateFields.updatedAt = new Date();
        incrementField = 'deliveredCount';
      } else if (ack === 3 && status !== 'read') {
        status = 'read';
        updateFields.updatedAt = new Date();
        incrementField = 'readCount';
      }

      if (status !== messageRecord.status) {
        messageRecord.status = status;
        messageRecord.updatedAt = new Date();
        await messageRecord.save();

        if (incrementField && messageRecord.campaignId) {
          await Campaign.findByIdAndUpdate(messageRecord.campaignId, {
            $inc: { [incrementField]: 1 }
          });
        }
      }
    }
  } catch (error) {
    console.error('Error processing ACK:', error);
  }
});

// --- API Routes ---
const apiRouter = express.Router();

// --- Auth Routes ---
const authRouter = express.Router();

// POST /api/auth/register
authRouter.post(
  '/register',
  [
    body('email').isEmail().withMessage('Please enter a valid email'),
    body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters long'),
    body('name').not().isEmpty().withMessage('Name is required'),
    body('companyName').not().isEmpty().withMessage('Company name is required'),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { email, password, name, companyName } = req.body;

    try {
      let user = await User.findOne({ email });
      if (user) {
        return res.status(400).json({ errors: [{ msg: 'User already exists' }] });
      }

      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(password, salt);

      user = new User({
        name,
        email,
        companyName,
        password: hashedPassword,
      });

      await user.save();
      
      const userResponse = user.toObject();
      delete userResponse.password;

      res.status(201).json(userResponse);

    } catch (err) {
      console.error(err.message);
      res.status(500).send('Server error');
    }
  }
);

// POST /api/auth/login
authRouter.post(
  '/login',
  [
    body('email').isEmail().withMessage('Please enter a valid email'),
    body('password').exists().withMessage('Password is required'),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { email, password } = req.body;

    try {
      const user = await User.findOne({ email });
      if (!user) {
        return res.status(400).json({ errors: [{ msg: 'Invalid credentials' }] });
      }

      const isMatch = await bcrypt.compare(password, user.password);
      if (!isMatch) {
        return res.status(400).json({ errors: [{ msg: 'Invalid credentials' }] });
      }
      
      const userResponse = user.toObject();
      delete userResponse.password;

      res.json(userResponse);

    } catch (err) {
      console.error(err.message);
      res.status(500).send('Server error');
    }
  }
);

apiRouter.use('/auth', authRouter);
// --- End Auth Routes ---

// Setup uploads directory
const uploadDir = path.resolve(__dirname, '..', 'uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    const name = `${Date.now()}-${Math.floor(Math.random()*1e9)}${ext}`;
    cb(null, name);
  }
});
const upload = multer({ storage });

// API Health Check
apiRouter.get('/ping', (req, res) => {
  res.json({ status: 'ok', message: 'ZapScale API is running' });
});

// 1. Dashboard Stats
apiRouter.get('/dashboard/stats', async (req, res) => {
  try {
    const campaigns = await Campaign.find().sort({ createdAt: -1 }).limit(5);
    
    const totals = await Campaign.aggregate([
      {
        $group: {
          _id: null,
          totalSent: { $sum: "$sentCount" },
          totalDelivered: { $sum: "$deliveredCount" },
          totalRead: { $sum: "$readCount" },
          totalFailed: { $sum: "$failedCount" }
        }
      }
    ]);

    const stats = totals[0] || { totalSent: 0, totalDelivered: 0, totalRead: 0, totalFailed: 0 };

    const chartData = campaigns.map(c => ({
      name: c.name.substring(0, 15),
      sent: c.sentCount || 0,
      failed: c.failedCount || 0
    })).reverse();

    res.json({
      totalSent: stats.totalSent,
      totalDelivered: stats.totalDelivered,
      totalRead: stats.totalRead,
      totalFailed: stats.totalFailed,
      recentActivity: campaigns,
      chartData
    });
  } catch (error) {
    console.error('Dashboard stats error:', error);
    res.status(500).json({ error: error.message });
  }
});



// 2. WhatsApp Connection Routes
apiRouter.get('/whatsapp/status', (req, res) => {
  const status = whatsappService.getStatus();
  console.log('Status requested:', status.status);
  res.json(status);
});

apiRouter.post('/whatsapp/connect', (req, res) => {
  console.log('Received connect request');
  try {
    whatsappService.initialize();
    res.json({ message: 'Initialization started' });
  } catch (error) {
    console.error('Failed to initialize WhatsApp:', error);
    res.status(500).json({ error: 'Failed to start connection' });
  }
});

apiRouter.post('/whatsapp/logout', async (req, res) => {
  await whatsappService.logout();
  res.json({ message: 'Logged out' });
});

// Novo endpoint: listar contatos do WhatsApp conectado
apiRouter.get('/whatsapp/contacts', async (req, res) => {
  try {
    if (!whatsappService.client || whatsappService.status !== 'connected') {
      return res.json([]);
    }
    const chats = await whatsappService.client.getChats();
    const contacts = chats
      .filter(chat => !chat.isGroup && chat.id.user && chat.name)
      .map(chat => ({
        id: chat.id._serialized,
        name: chat.name,
        phone: chat.id.user
      }));
    res.json(contacts);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

apiRouter.get('/whatsapp/groups', async (req, res) => {
  try {
    const groups = await whatsappService.getGroups();
    res.json(groups);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// NOVO ENDPOINT: Envio de mensagem via WhatsApp
apiRouter.post('/whatsapp/send', async (req, res) => {
  const { to, content, mediaUrl } = req.body;
  if (!to || !content) {
    return res.status(400).json({ error: 'Parâmetros obrigatórios: to, content' });
  }
  try {
    const result = await whatsappService.sendMessage(to, content, mediaUrl);
    res.json({ success: true, result });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Upload de arquivos de mídia (usado ao salvar modelos)
apiRouter.post('/upload', upload.single('file'), (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'Arquivo não enviado' });
    const fileUrl = `/uploads/${req.file.filename}`;
    res.json({ url: fileUrl });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Message Templates CRUD
apiRouter.get('/messages', async (req, res) => {
  try {
    const templates = await MessageTemplate.find().sort({ createdAt: -1 });
    res.json(templates);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

apiRouter.post('/messages', async (req, res) => {
  try {
    const { name, content, mediaUrl, mediaType } = req.body;
    if (!name) return res.status(400).json({ error: 'Nome da mensagem é obrigatório' });
    const tpl = new MessageTemplate({ name, content, mediaUrl, mediaType });
    await tpl.save();
    res.json(tpl);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

apiRouter.put('/messages/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { name, content, mediaUrl, mediaType } = req.body;
    const tpl = await MessageTemplate.findByIdAndUpdate(id, { name, content, mediaUrl, mediaType, updatedAt: new Date() }, { new: true });
    res.json(tpl);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

apiRouter.delete('/messages/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const tpl = await MessageTemplate.findByIdAndDelete(id);
    if (!tpl) return res.status(404).json({ error: 'Template not found' });
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 3. Campaign Routes
apiRouter.get('/campaigns', async (req, res) => {
  try {
    const campaigns = await Campaign.find().sort({ createdAt: -1 });
    res.json(campaigns);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

apiRouter.get('/campaigns/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const campaign = await Campaign.findById(id);
    if (!campaign) return res.status(404).json({ error: 'Campaign not found' });
    res.json(campaign);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

apiRouter.post('/campaigns', async (req, res) => {
  try {
    const { name, messageContent, mediaUrl, targetType, targetId, targetName, targetCount, schedules, status } = req.body;

    console.log('POST /api/campaigns payload:', { name, status, schedules, mediaUrl });

    // Basic validation: if status is 'scheduled' ensure schedules array is provided
    if (status === 'scheduled' && (!Array.isArray(schedules) || schedules.length === 0)) {
      return res.status(400).json({ error: 'Scheduled campaigns must include at least one schedule datetime' });
    }

    const campaign = new Campaign({
      name,
      messageContent,
      mediaUrl,
      targetType,
      targetId,
      targetName,
      targetCount,
      schedules: Array.isArray(schedules) ? schedules : [],
      status: status || 'draft',
      sentCount: 0,
      deliveredCount: 0,
      readCount: 0,
      failedCount: 0
    });

    await campaign.save();
    res.json(campaign);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

apiRouter.put('/campaigns/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const update = req.body;
    // ensure schedules is an array if provided
    if (update.schedules && !Array.isArray(update.schedules)) update.schedules = [];
    const updated = await Campaign.findByIdAndUpdate(id, update, { new: true });
    if (!updated) return res.status(404).json({ error: 'Campaign not found' });
    res.json(updated);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

apiRouter.delete('/campaigns/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const removed = await Campaign.findByIdAndDelete(id);
    if (!removed) return res.status(404).json({ error: 'Campaign not found' });
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Debug endpoint: run scheduler immediately (useful for testing)
apiRouter.post('/_run-scheduler', async (req, res) => {
  try {
    const result = await runSchedulerTick();
    res.json({ success: true, result });
  } catch (err) {
    console.error('Manual scheduler run error:', err);
    res.status(500).json({ error: err.message });
  }
});

// 4. Contact Routes
apiRouter.get('/contacts', async (req, res) => {
  try {
    const lists = await ContactList.find().sort({ createdAt: -1 });
    res.json(lists);
  } catch (error) {
     res.status(500).json({ error: error.message });
  }
});

apiRouter.post('/contacts', async (req, res) => {
  try {
    const list = new ContactList(req.body);
    await list.save();
    res.json(list);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// API 404 Handler (Specific to /api to avoid HTML responses)
apiRouter.use((req, res) => {
  console.warn(`API 404: ${req.method} ${req.originalUrl}`);
  res.status(404).json({ error: 'API endpoint not found' });
});

// IMPORTANT: Mount API router BEFORE static files
app.use('/api', apiRouter);

// Cloud Run Health Check
app.get('/health', (req, res) => {
  res.status(200).send('OK');
});

// --- Static Files & SPA Fallback ---
const rootDir = path.resolve(__dirname, '..');
const distDir = path.join(rootDir, 'dist');

// If a production build exists in `dist`, serve it. Otherwise fall back to project root.
if (fs.existsSync(distDir)) {
  app.use(express.static(distDir));
} else {
  app.use(express.static(rootDir));
}

// Serve uploaded media files (always from uploads folder)
app.use('/uploads', express.static(uploadDir));

// SPA Fallback - MUST be last
app.get('*', (req, res) => {
  // If the request expects JSON (API call that missed the router), return JSON 404
  if (req.headers.accept && req.headers.accept.includes('application/json')) {
    return res.status(404).json({ error: 'Not Found' });
  }

  const indexPath = fs.existsSync(distDir)
    ? path.join(distDir, 'index.html')
    : path.join(rootDir, 'index.html');

  res.sendFile(indexPath);
});

// --- Scheduler ---
async function runSchedulerTick() {
  const now = new Date();
  const lookahead = new Date(now.getTime() + 60000);
  try {
    const campaigns = await Campaign.find({
      status: 'scheduled',
      schedules: { $elemMatch: { $lte: lookahead } }
    });

    if (!campaigns.length) return { processed: 0 };

    console.log(`Scheduler tick: found ${campaigns.length} campaign(s) with scheduled items <= ${lookahead.toISOString()}`);

    for (const campaign of campaigns) {
      console.log(`Processing campaign: ${campaign.name} (schedules: ${JSON.stringify(campaign.schedules)})`);
      const wsStatus = whatsappService.getStatus();
      if (!whatsappService.client || wsStatus.status !== 'connected') {
        console.warn(`Skipping campaign ${campaign.name} - WhatsApp not connected`);
        continue;
      }

      const dueSchedules = campaign.schedules.filter(s => new Date(s) <= lookahead);
      const futureSchedules = campaign.schedules.filter(s => new Date(s) > lookahead);

      if (dueSchedules.length === 0) {
        console.log(`No due schedules for campaign ${campaign.name}`);
        continue;
      }

      campaign.status = 'running';
      await campaign.save();

      let targets = [];
      if (campaign.targetType === 'group') {
        targets = [{ phone: campaign.targetId, isGroup: true }];
      } else {
        const list = await ContactList.findById(campaign.targetId);
        if (list && list.contacts) {
          targets = list.contacts.map(c => ({ phone: c.phone, isGroup: false }));
        }
      }

      let sent = 0;
      let failed = 0;

      for (const _due of dueSchedules) {
        for (const target of targets) {
          try {
            const msgObj = await whatsappService.sendMessage(target.phone, campaign.messageContent, campaign.mediaUrl);

            await Message.create({
              campaignId: campaign._id,
              whatsappMessageId: msgObj?.id?._serialized || `sent_${Date.now()}_${Math.random()}`,
              recipient: target.phone,
              status: 'sent',
              sentAt: new Date()
            });

            sent++;
            await new Promise(resolve => setTimeout(resolve, 2000 + Math.random() * 3000));
          } catch (err) {
            console.error(`Failed to send to ${target.phone}`, err);
            await Message.create({
              campaignId: campaign._id,
              whatsappMessageId: `failed_${Date.now()}_${Math.random()}`,
              recipient: target.phone,
              status: 'failed',
              sentAt: new Date()
            });
            failed++;
          }
        }
      }

      campaign.sentCount = (campaign.sentCount || 0) + sent;
      campaign.failedCount = (campaign.failedCount || 0) + failed;

      if (futureSchedules.length > 0) {
        campaign.status = 'scheduled';
        campaign.schedules = futureSchedules;
      } else {
        campaign.status = 'completed';
        campaign.schedules = [];
      }

      await campaign.save();
    }

    return { processed: campaigns.length };
  } catch (error) {
    console.error('Scheduler error:', error);
    throw error;
  }
}

// run every minute
setInterval(() => {
  runSchedulerTick().catch(err => console.error('Scheduler tick failed:', err));
}, 60000);

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
