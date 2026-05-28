import mongoose from 'mongoose';

const tacticSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    team: { type: mongoose.Schema.Types.ObjectId, ref: 'NationalTeam', required: true, index: true },
    formation: {
      type: String,
      enum: ['4-3-3', '4-2-3-1', '4-4-2', '3-5-2', '3-4-3', '5-3-2', '4-1-4-1'],
      default: '4-3-3',
    },
    lineup: [
      {
        player: { type: mongoose.Schema.Types.ObjectId, ref: 'Player' },
        slot: String,
        x: Number,
        y: Number,
      },
    ],
    sliders: {
      pressing: { type: Number, min: 0, max: 100, default: 58 },
      tempo: { type: Number, min: 0, max: 100, default: 56 },
      width: { type: Number, min: 0, max: 100, default: 54 },
      defensiveLine: { type: Number, min: 0, max: 100, default: 52 },
      creativity: { type: Number, min: 0, max: 100, default: 55 },
      compactness: { type: Number, min: 0, max: 100, default: 54 },
      counterAttack: { type: Number, min: 0, max: 100, default: 50 },
    },
  },
  { timestamps: true },
);

tacticSchema.index({ user: 1, team: 1 }, { unique: true });

export const Tactic = mongoose.model('Tactic', tacticSchema);
