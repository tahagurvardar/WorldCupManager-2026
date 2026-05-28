import mongoose from 'mongoose';
import { localizedStringSchema } from './shared.js';

const teamSnapshotSchema = new mongoose.Schema(
  {
    team: { type: mongoose.Schema.Types.ObjectId, ref: 'NationalTeam', required: true },
    nameTR: String,
    nameEN: String,
    fifaCode: String,
    flagEmoji: String,
    flagCode: String,
  },
  { _id: false },
);

const matchStatsSchema = new mongoose.Schema(
  {
    possession: { type: Number, min: 0, max: 100, default: 50 },
    xG: { type: Number, min: 0, default: 0 },
    shots: { type: Number, min: 0, default: 0 },
    shotsOnTarget: { type: Number, min: 0, default: 0 },
    corners: { type: Number, min: 0, default: 0 },
    fouls: { type: Number, min: 0, default: 0 },
    yellowCards: { type: Number, min: 0, default: 0 },
    redCards: { type: Number, min: 0, default: 0 },
    saves: { type: Number, min: 0, default: 0 },
  },
  { _id: false },
);

const playerRatingSchema = new mongoose.Schema(
  {
    player: { type: mongoose.Schema.Types.ObjectId, ref: 'Player' },
    name: String,
    teamCode: String,
    position: String,
    rating: Number,
    goals: { type: Number, default: 0 },
    assists: { type: Number, default: 0 },
  },
  { _id: false },
);

const eventSchema = new mongoose.Schema(
  {
    minute: { type: Number, min: 1, max: 130, required: true },
    type: {
      type: String,
      enum: ['goal', 'assist', 'shot', 'save', 'woodwork', 'corner', 'foul', 'yellow_card', 'red_card', 'injury', 'substitution', 'offside', 'var', 'penalty', 'penalty_missed'],
      required: true,
    },
    team: { type: mongoose.Schema.Types.ObjectId, ref: 'NationalTeam' },
    player: { type: mongoose.Schema.Types.ObjectId, ref: 'Player' },
    relatedPlayer: { type: mongoose.Schema.Types.ObjectId, ref: 'Player' },
    playerName: String,
    relatedPlayerName: String,
    score: {
      home: { type: Number, default: 0 },
      away: { type: Number, default: 0 },
    },
    description: { type: localizedStringSchema, required: true },
  },
  { _id: false },
);

const matchSchema = new mongoose.Schema(
  {
    matchNumber: { type: Number, required: true, unique: true },
    stage: {
      type: String,
      enum: ['group', 'round_of_32', 'round_of_16', 'quarter_final', 'semi_final', 'third_place', 'final'],
      default: 'group',
      index: true,
    },
    group: { type: String, match: /^[A-L]$/ },
    status: { type: String, enum: ['scheduled', 'live', 'completed'], default: 'scheduled', index: true },
    kickoffAt: { type: Date, required: true },
    venue: { type: String, required: true },
    home: { type: teamSnapshotSchema, required: true },
    away: { type: teamSnapshotSchema, required: true },
    score: {
      home: { type: Number, default: 0 },
      away: { type: Number, default: 0 },
    },
    extraTimeScore: {
      home: { type: Number, default: 0 },
      away: { type: Number, default: 0 },
    },
    penalties: {
      home: { type: Number, default: null },
      away: { type: Number, default: null },
    },
    winner: { type: mongoose.Schema.Types.ObjectId, ref: 'NationalTeam' },
    stats: {
      home: { type: matchStatsSchema, default: () => ({}) },
      away: { type: matchStatsSchema, default: () => ({}) },
    },
    momentum: [{ minute: Number, home: Number, away: Number }],
    events: [eventSchema],
    playerRatings: [playerRatingSchema],
    tacticalContext: {
      home: { type: Object, default: {} },
      away: { type: Object, default: {} },
    },
  },
  { timestamps: true },
);

matchSchema.index({ 'home.team': 1, 'away.team': 1, kickoffAt: 1 });
matchSchema.index({ venue: 'text', group: 'text', stage: 'text' });

export const Match = mongoose.model('Match', matchSchema);
