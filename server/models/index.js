
const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
  name: String,
  email: { type: String, unique: true },
  password: String, // In production, hash this!
  companyName: String,
  categories: [String],
  settings: {
    theme: String,
    webhookUrl: String
  }
});

const CampaignSchema = new mongoose.Schema({
  userId: mongoose.Schema.Types.ObjectId,
  name: String,
  status: { type: String, enum: ['draft', 'scheduled', 'running', 'completed', 'failed'], default: 'draft' },
  messageContent: String,
  mediaUrl: String,
  mediaType: { type: String, enum: ['text', 'image', 'video'], default: 'text' },
  
  // Target Config
  targetType: { type: String, enum: ['list', 'group'] },
  targetId: String,
  
  // Snapshot fields for historical display
  targetName: String, 
  targetCount: Number,

  schedules: [Date], 
  
  // Real metrics
  sentCount: { type: Number, default: 0 },
  deliveredCount: { type: Number, default: 0 },
  readCount: { type: Number, default: 0 },
  failedCount: { type: Number, default: 0 },
  
  createdAt: { type: Date, default: Date.now }
});

const ContactListSchema = new mongoose.Schema({
  userId: mongoose.Schema.Types.ObjectId,
  name: String,
  contacts: [{
    phone: String,
    name: String
  }],
  createdAt: { type: Date, default: Date.now }
});

// New Model to track individual message status for accurate analytics
const MessageSchema = new mongoose.Schema({
  campaignId: { type: mongoose.Schema.Types.ObjectId, ref: 'Campaign' },
  whatsappMessageId: { type: String, index: true }, // The serialized ID from WhatsApp
  recipient: String,
  status: { type: String, enum: ['pending', 'sent', 'delivered', 'read', 'failed'], default: 'pending' },
  sentAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

// Template / Saved Message schema
const MessageTemplateSchema = new mongoose.Schema({
  userId: mongoose.Schema.Types.ObjectId,
  name: { type: String, required: true },
  content: String,
  mediaUrl: String,
  mediaType: { type: String, enum: ['text', 'image', 'video'], default: 'text' },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

module.exports = {
  User: mongoose.model('User', UserSchema),
  Campaign: mongoose.model('Campaign', CampaignSchema),
  ContactList: mongoose.model('ContactList', ContactListSchema),
  Message: mongoose.model('Message', MessageSchema),
  MessageTemplate: mongoose.model('MessageTemplate', MessageTemplateSchema)
};
