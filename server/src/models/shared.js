import mongoose from 'mongoose';

export const sourceMetadataSchema = new mongoose.Schema(
  {
    sourceName: { type: String, required: true, trim: true },
    sourceUrl: { type: String, required: true, trim: true },
    verificationStatus: {
      type: String,
      enum: ['official', 'provisional', 'estimated'],
      default: 'estimated',
    },
    lastVerifiedAt: { type: Date, default: Date.now },
  },
  { _id: false },
);

export const localizedStringSchema = new mongoose.Schema(
  {
    tr: { type: String, required: true, trim: true },
    en: { type: String, required: true, trim: true },
  },
  { _id: false },
);
