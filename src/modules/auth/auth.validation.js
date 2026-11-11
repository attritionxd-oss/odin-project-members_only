import { body } from "express-validator";

const PASSWORD_CHAR_MIN = process.env.PASSWORD_CHAR_MIN || 8;
const PASSWORD_CHAR_MAX = process.env.PASSWORD_CHAR_MAX || 128;

const emptyErr = "is required.";
const stringErr = "must be a string.";
const lengthErr = ({ min, max }) => {
  return `must be between ${min} and ${max} characters.`;
};

export const validateLogin = [
  body("username")
    .trim()
    .notEmpty()
    .withMessage(`Username ${emptyErr}`)
    .if(body("username").trim().notEmpty())
    .isString()
    .withMessage(`Username ${stringErr}`)
    .isLength({ min: 3, max: 30 })
    .withMessage(`Username ${lengthErr({ min: 3, max: 30 })}`)
    .matches(/^[a-zA-Z0-9_-]+$/)
    .withMessage(
      "Username can only contain letters, numbers, underscores, and dashes.",
    ),
  body("password")
    .trim()
    .notEmpty()
    .withMessage(`Password ${emptyErr}`)
    .if(body("password").trim().notEmpty())
    .isLength({ min: PASSWORD_CHAR_MIN, max: PASSWORD_CHAR_MAX })
    .withMessage(
      `Password ${lengthErr({ min: PASSWORD_CHAR_MIN, max: PASSWORD_CHAR_MAX })}`,
    )
    .matches(/^[a-zA-Z0-9_\-!@#$%^&*()+]+$/)
    // eslint: backslash unnecessary: `.matches(/^[a-zA-Z0-9_\-\!@#\$%\^&\*\(\)\+]+$/)`
    .withMessage("Password contains invalid characters."),
  body("redirectTo").optional().trim(),
];
