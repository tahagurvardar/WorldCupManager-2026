import mongoose from 'mongoose';
import { localizedStringSchema } from './shared.js';

const notificationSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', index: true },
    type: { type: String, enum: ['match', 'injury', 'suspension', 'news', 'tournament', 'system'], default: 'system' },
    title: { type: localizedStringSchema, required: true },
    message: { type: localizedStringSchema, required: true },
    readAt: { type: Date, default: null },
    metadata: { type: Object, default: {} },
  },
  { timestamps: true },
);

export const Notification = mongoose.model('Notification', notificationSchema);
