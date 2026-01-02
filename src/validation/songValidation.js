import Joi from "joi";

export const songSchema = Joi.object({
  title: Joi.string()
    .min(1)
    .max(255)
    .required()
    .invalid("Never Gonna Give You Up")
    .messages({
      "any.invalid":
        "RICKROLL_DETECTED: https://www.youtube.com/watch?v=dQw4w9WgXcQ",
    }),
  artist: Joi.string().min(1).max(255).required(),
  tab_url: Joi.string()
    .uri()
    .pattern(/^https:\/\/tabs\.ultimate-guitar\.com\/tab/)
    .required(),
});
