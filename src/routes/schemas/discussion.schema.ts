import Joi from 'joi';

export const createDiscussionSchema = Joi.object({
  title: Joi.string().trim().min(5).max(200).required(),
  content: Joi.string().trim().min(10).max(5000).required(),
  tradition: Joi.string().trim().max(100).default('General Lore'),
  tags: Joi.array().items(Joi.string().trim().max(50)).default([]),
});

export const addReplySchema = Joi.object({
  content: Joi.string().trim().min(1).max(2000).required(),
});
