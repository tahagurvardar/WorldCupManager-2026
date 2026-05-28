import { News } from '../models/News.js';
import { asyncHandler } from '../services/asyncHandler.js';

export const listNews = asyncHandler(async (req, res) => {
  const filter = {};
  if (req.query.team) filter.team = req.query.team;
  if (req.query.category) filter.category = req.query.category;
  if (req.query.match) filter.match = req.query.match;

  const news = await News.find(filter)
    .populate('team', 'nameTR nameEN fifaCode flagEmoji flagCode')
    .populate('match', 'matchNumber stage group status score home away kickoffAt')
    .sort({ publishedAt: -1 })
    .limit(50);
  res.json({ success: true, news });
});
