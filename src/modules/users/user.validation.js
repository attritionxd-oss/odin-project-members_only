import { body } from "express-validator";
import userService from "./user.service.js";

const PASSWORD_CHAR_MIN = process.env.PASSWORD_CHAR_MIN || 8;
const PASSWORD_CHAR_MAX = process.env.PASSWORD_CHAR_MAX || 128;

const emptyErr = "is required.";
const stringErr = "must be a string.";
const lengthErr = ({ min, max }) => {
  return `must be between ${min} and ${max} characters.`;
};

export const validateSignup = [
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
    )
    .custom(async (value) => {
      const existingUsernames = await userService.getAllUsernames();

      if (existingUsernames.includes(value)) {
        throw new Error("This username is not available.");
      }
    }),

  body("first_name")
    .trim()
    .notEmpty()
    .withMessage(`First name ${emptyErr}`)
    .if(body("first_name").trim().notEmpty())
    .isString()
    .withMessage(`First name ${stringErr}`)
    .isLength({ min: 3, max: 30 })
    .withMessage(`First name ${lengthErr({ min: 3, max: 30 })}`)
    .matches(/^\p{L}[\p{L}\s'-]*$/u)
    .withMessage(
      "First name must start with a letter and can only contain letters, spaces, hyphens, and apostrophes.",
    ),

  body("last_name")
    .trim()
    .notEmpty()
    .withMessage(`Last name ${emptyErr}`)
    .if(body("last_name").trim().notEmpty())
    .isString()
    .withMessage(`Last name ${stringErr}`)
    .isLength({ min: 3, max: 30 })
    .withMessage(`Last name ${lengthErr({ min: 3, max: 30 })}`)
    .matches(/^\p{L}[\p{L}\s'-]*$/u)
    .withMessage(
      "Last name must start with a letter and can only contain letters, spaces, hyphens, and apostrophes.",
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

  body("confirm_password")
    .trim()
    .notEmpty()
    .withMessage("Please confirm your password.")
    .if(body("confirm_password").trim().notEmpty())
    .custom((value, { req }) => {
      if (value !== req.body.password) {
        throw new Error("Passwords do not match.");
      }
      return true;
    }),
];

export const validateProfile = [
  body("first_name")
    .trim()
    .notEmpty()
    .withMessage(`First name ${emptyErr}`)
    .if(body("first_name").trim().notEmpty())
    .isString()
    .withMessage(`First name ${stringErr}`)
    .isLength({ min: 3, max: 30 })
    .withMessage(`First name ${lengthErr({ min: 3, max: 30 })}`)
    .matches(/^\p{L}[\p{L}\s'-]*$/u)
    .withMessage(
      "First name must start with a letter and can only contain letters, spaces, hyphens, and apostrophes.",
    ),

  body("last_name")
    .trim()
    .notEmpty()
    .withMessage(`Last name ${emptyErr}`)
    .if(body("last_name").trim().notEmpty())
    .isString()
    .withMessage(`Last name ${stringErr}`)
    .isLength({ min: 3, max: 30 })
    .withMessage(`Last name ${lengthErr({ min: 3, max: 30 })}`)
    .matches(/^\p{L}[\p{L}\s'-]*$/u)
    .withMessage(
      "Last name must start with a letter and can only contain letters, spaces, hyphens, and apostrophes.",
    ),
];

export const validatePassword = [
  body("current_password")
    .trim()
    .notEmpty()
    .withMessage(`Current Password ${emptyErr}`)
    .if(body("current_password").trim().notEmpty())
    .isLength({ min: PASSWORD_CHAR_MIN, max: PASSWORD_CHAR_MAX })
    .withMessage(
      `Current Password ${lengthErr({ min: PASSWORD_CHAR_MIN, max: PASSWORD_CHAR_MAX })}`,
    )
    .matches(/^[a-zA-Z0-9_\-!@#$%^&*()+]+$/)
    // eslint: backslash unnecessary: `.matches(/^[a-zA-Z0-9_\-\!@#\$%\^&\*\(\)\+]+$/)`
    .withMessage("Password contains invalid characters."),

  body("new_password")
    .trim()
    .notEmpty()
    .withMessage(`Password ${emptyErr}`)
    .if(body("new_password").trim().notEmpty())
    .isLength({ min: PASSWORD_CHAR_MIN, max: PASSWORD_CHAR_MAX })
    .withMessage(
      `New Password ${lengthErr({ min: PASSWORD_CHAR_MIN, max: PASSWORD_CHAR_MAX })}`,
    )
    .matches(/^[a-zA-Z0-9_\-!@#$%^&*()+]+$/)
    // eslint: backslash unnecessary: `.matches(/^[a-zA-Z0-9_\-\!@#\$%\^&\*\(\)\+]+$/)`
    .withMessage("Password contains invalid characters."),

  body("confirm_new_password")
    .trim()
    .notEmpty()
    .withMessage("Please confirm your password.")
    .if(body("confirm_new_password").trim().notEmpty())
    .custom((value, { req }) => {
      if (value !== req.body.new_password) {
        throw new Error("New Passwords do not match.");
      }
      return true;
    }),
];

export const validateSecretCode = [
  body("secretcode")
    .trim()
    .notEmpty()
    .withMessage(`Code ${emptyErr}`)
    .if(body("secretcode").trim().notEmpty())
    .isLength({ min: PASSWORD_CHAR_MIN, max: PASSWORD_CHAR_MAX })
    .withMessage(`Code must have a valid length.`)
    .isAlphanumeric()
    .withMessage("Code contains invalid characters."),
];
