import Joi from "joi";

export const playlistSchema = Joi.object({
  title: Joi.string().min(3).max(255).required(),
  description: Joi.string().min(3).max(255).required(),
});
