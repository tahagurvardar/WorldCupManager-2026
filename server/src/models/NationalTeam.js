import mongoose from 'mongoose';
import { sourceMetadataSchema } from './shared.js';

const nationalTeamSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true, index: true },
    nameTR: { type: String, required: true, trim: true },
    nameEN: { type: String, required: true, trim: true },
    slug: { type: String, required: true, unique: true, index: true },
    fifaCode: { type: String, required: true, unique: true, uppercase: true, trim: true },
    confederation: {
      type: String,
      required: true,
      enum: ['AFC', 'CAF', 'CONCACAF', 'CONMEBOL', 'OFC', 'UEFA'],
      index: true,
    },
    worldRanking: { type: Number, min: 1, max: 210, default: 100 },
    group: { type: String, required: true, match: /^[A-L]$/, index: true },
    coach: { type: mongoose.Schema.Types.ObjectId, ref: 'Coach' },
    morale: { type: Number, min: 0, max: 100, default: 52 },
    chemistry: { type: Number, min: 0, max: 100, default: 51 },
    fatigue: { type: Number, min: 0, max: 100, default: 18 },
    flagEmoji: { type: String, default: '🏳️' },
    flagCode: { type: String, default: '', trim: true },
    tournamentStatus: {
      type: String,
      enum: ['group_stage', 'round_of_32', 'round_of_16', 'quarter_final', 'semi_final', 'third_place', 'final', 'champion', 'eliminated'],
      default: 'group_stage',
    },
    sourceMetadata: { type: sourceMetadataSchema, required: true },
  },
  { timestamps: true },
);

nationalTeamSchema.index({ name: 'text', nameTR: 'text', nameEN: 'text', fifaCode: 'text' });

export const NationalTeam = mongoose.model('NationalTeam', nationalTeamSchema);
