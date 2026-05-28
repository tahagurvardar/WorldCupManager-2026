import mongoose from 'mongoose';
import { sourceMetadataSchema } from './shared.js';

const attributesSchema = new mongoose.Schema(
  {
    pace: { type: Number, min: 1, max: 99, default: 65 },
    shooting: { type: Number, min: 1, max: 99, default: 62 },
    passing: { type: Number, min: 1, max: 99, default: 62 },
    dribbling: { type: Number, min: 1, max: 99, default: 62 },
    defending: { type: Number, min: 1, max: 99, default: 62 },
    physical: { type: Number, min: 1, max: 99, default: 62 },
  },
  { _id: false },
);

const dynamicSchema = new mongoose.Schema(
  {
    morale: { type: Number, min: 0, max: 100, default: 52 },
    form: { type: Number, min: 0, max: 100, default: 55 },
    fitness: { type: Number, min: 0, max: 100, default: 88 },
    fatigue: { type: Number, min: 0, max: 100, default: 18 },
  },
  { _id: false },
);

const tournamentStatsSchema = new mongoose.Schema(
  {
    goals: { type: Number, default: 0 },
    assists: { type: Number, default: 0 },
    appearances: { type: Number, default: 0 },
    yellowCards: { type: Number, default: 0 },
    redCards: { type: Number, default: 0 },
    avgRating: { type: Number, min: 0, max: 10, default: 6.5 },
    cleanSheets: { type: Number, default: 0 },
  },
  { _id: false },
);

const injurySchema = new mongoose.Schema(
  {
    injuryStatus: { type: String, enum: ['fit', 'minor', 'injured'], default: 'fit' },
    injuryType: { type: String, default: '' },
    injuryDays: { type: Number, min: 0, default: 0 },
  },
  { _id: false },
);

const playerSchema = new mongoose.Schema(
  {
    fullName: { type: String, required: true, trim: true, index: true },
    country: { type: mongoose.Schema.Types.ObjectId, ref: 'NationalTeam', required: true, index: true },
    club: { type: String, required: true, trim: true },
    age: { type: Number, min: 16, max: 45, required: true },
    primaryPosition: {
      type: String,
      required: true,
      enum: ['GK', 'RB', 'CB', 'LB', 'RWB', 'LWB', 'CDM', 'CM', 'CAM', 'RM', 'LM', 'RW', 'LW', 'ST'],
      index: true,
    },
    secondaryPositions: [{ type: String }],
    overall: { type: Number, min: 1, max: 99, required: true, index: true },
    potential: { type: Number, min: 1, max: 99, required: true },
    attributes: { type: attributesSchema, default: () => ({}) },
    dynamic: { type: dynamicSchema, default: () => ({}) },
    tournamentStats: { type: tournamentStatsSchema, default: () => ({}) },
    nationalTeamStatus: {
      type: String,
      enum: ['candidate', 'provisional', 'final'],
      default: 'candidate',
      index: true,
    },
    injury: { type: injurySchema, default: () => ({}) },
    sourceMetadata: { type: sourceMetadataSchema, required: true },
  },
  { timestamps: true },
);

playerSchema.index({ fullName: 'text', club: 'text', primaryPosition: 'text' });

export const Player = mongoose.model('Player', playerSchema);
