import Joi from 'joi';

export const createCommentSchema = Joi.object({
  content: Joi.string().trim().min(1).max(1000).required(),
  chapterNumber: Joi.number().integer().min(1).optional(),
  nodeId: Joi.string().trim().max(100).optional(),
  parentCommentId: Joi.string().trim().hex().length(24).optional(),
});
