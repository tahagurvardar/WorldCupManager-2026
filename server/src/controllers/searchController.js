import { NationalTeam } from '../models/NationalTeam.js';
import { Player } from '../models/Player.js';
import { Match } from '../models/Match.js';
import { asyncHandler } from '../services/asyncHandler.js';

export const globalSearch = asyncHandler(async (req, res) => {
  const query = String(req.query.q || '').trim();
  if (query.length < 2) {
    return res.json({ success: true, teams: [], players: [], matches: [] });
  }

  const regex = new RegExp(query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
  const [teams, players, matches] = await Promise.all([
    NationalTeam.find({ $or: [{ nameTR: regex }, { nameEN: regex }, { fifaCode: regex }] }).limit(8),
    Player.find({ $or: [{ fullName: regex }, { club: regex }, { primaryPosition: regex }] }).populate('country', 'nameTR nameEN fifaCode flagEmoji flagCode').limit(8),
    Match.find({ $or: [{ venue: regex }, { group: regex }, { 'home.nameTR': regex }, { 'away.nameTR': regex }, { 'home.nameEN': regex }, { 'away.nameEN': regex }] }).limit(8),
  ]);

  return res.json({ success: true, teams, players, matches });
});
