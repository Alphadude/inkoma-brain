import Joi from 'joi';

export const createTicketSchema = Joi.object({
  name: Joi.string().trim().min(2).max(100).required(),
  email: Joi.string().email({ tlds: { allow: false } }).required(),
  category: Joi.string()
    .valid('General', 'Storyteller Support', 'Billing & Patronage', 'Technical Bug', 'Lore Preservation')
    .default('General'),
  subject: Joi.string().trim().min(5).max(200).required(),
  message: Joi.string().trim().min(10).max(5000).required(),
  priority: Joi.string().valid('low', 'normal', 'high').default('normal'),
});
