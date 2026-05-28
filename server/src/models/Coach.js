import mongoose from 'mongoose';
import { sourceMetadataSchema } from './shared.js';

const coachSchema = new mongoose.Schema(
  {
    fullName: { type: String, required: true, trim: true, index: true },
    nationality: { type: String, required: true, trim: true },
    team: { type: mongoose.Schema.Types.ObjectId, ref: 'NationalTeam', index: true },
    tacticalStyle: { type: String, default: 'Balanced' },
    reputation: { type: Number, min: 1, max: 100, default: 65 },
    sourceMetadata: { type: sourceMetadataSchema, required: true },
  },
  { timestamps: true },
);

coachSchema.index({ fullName: 'text', nationality: 'text', tacticalStyle: 'text' });

export const Coach = mongoose.model('Coach', coachSchema);
