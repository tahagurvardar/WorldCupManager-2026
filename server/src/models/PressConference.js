import mongoose from 'mongoose';

const effectSchema = new mongoose.Schema(
  {
    morale: { type: Number, default: 0 },
    chemistry: { type: Number, default: 0 },
    mediaPressure: { type: Number, default: 0 },
    fanConfidence: { type: Number, default: 0 },
    boardConfidence: { type: Number, default: 0 },
  },
  { _id: false },
);

const choiceSchema = new mongoose.Schema(
  {
    stance: { type: String, enum: ['confident', 'balanced', 'defensive'], required: true },
    responseKey: { type: String, required: true },
    reactionKey: { type: String, required: true },
    effects: { type: effectSchema, default: () => ({}) },
  },
  { _id: false },
);

const answerSchema = new mongoose.Schema(
  {
    stance: { type: String, enum: ['confident', 'balanced', 'defensive'], required: true },
    responseKey: { type: String, required: true },
    reactionKey: { type: String, required: true },
    effects: { type: effectSchema, default: () => ({}) },
    answeredAt: { type: Date, default: Date.now },
  },
  { _id: false },
);

const questionSchema = new mongoose.Schema(
  {
    questionId: { type: String, required: true },
    key: { type: String, required: true },
    variables: { type: Object, default: {} },
    context: { type: Object, default: {} },
    choices: [choiceSchema],
    answer: { type: answerSchema, default: null },
  },
  { _id: false },
);

const pressConferenceSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    team: { type: mongoose.Schema.Types.ObjectId, ref: 'NationalTeam', required: true, index: true },
    opponent: { type: mongoose.Schema.Types.ObjectId, ref: 'NationalTeam', required: true },
    match: { type: mongoose.Schema.Types.ObjectId, ref: 'Match', required: true, index: true },
    status: { type: String, enum: ['open', 'completed'], default: 'open', index: true },
    questions: [questionSchema],
    impactTotals: { type: effectSchema, default: () => ({}) },
    generatedContext: { type: Object, default: {} },
    completedAt: { type: Date, default: null },
  },
  { timestamps: true },
);

pressConferenceSchema.index({ user: 1, team: 1, match: 1 }, { unique: true });

export const PressConference = mongoose.model('PressConference', pressConferenceSchema);
