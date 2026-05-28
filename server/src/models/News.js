import mongoose from 'mongoose';
import { localizedStringSchema } from './shared.js';

const newsSchema = new mongoose.Schema(
  {
    category: { type: String, enum: ['tournament', 'team', 'injury', 'media', 'result'], default: 'tournament', index: true },
    title: { type: localizedStringSchema, required: true },
    body: { type: localizedStringSchema, required: true },
    team: { type: mongoose.Schema.Types.ObjectId, ref: 'NationalTeam' },
    match: { type: mongoose.Schema.Types.ObjectId, ref: 'Match' },
    pressureLevel: { type: Number, min: 0, max: 100, default: 45 },
    publishedAt: { type: Date, default: Date.now },
  },
  { timestamps: true },
);

newsSchema.index({ 'title.tr': 'text', 'title.en': 'text', 'body.tr': 'text', 'body.en': 'text' });

export const News = mongoose.model('News', newsSchema);
