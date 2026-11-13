import { body } from "express-validator";

export const validateMessage = [
  body("message")
    .trim()
    .notEmpty()
    .withMessage("Message must not be empty")
    .if(body("message").trim().notEmpty())
    .isString()
    .withMessage("Message must be a string.")
    .isLength({ min: 1, max: 500 })
    .withMessage("Message must be between 1 and 500 characters.")
    .escape()
    .stripLow(true),
];
