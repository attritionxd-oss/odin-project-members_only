import userService from "./user.service.js";
import { renderWithLayout } from "#modules/renderer/renderHelper.js";
import { formatTimestamp } from "#utils/formatTimestamp.js";
import userHistoryService from "#modules/userHistory/userHistory.service.js";
import { hashPassword, verifyPassword } from "#utils/passwordUtils.js";
import { matchedData } from "express-validator";

export const userController = {
  showRegister: (req, res) => {
    renderWithLayout(res, "outlets/users/register", {
      title: "Sign up",
      fields: {},
      error: null,
    });
  },

  register: async (req, res, next) => {
    const validationErrors = req.validationErrors;

    if (validationErrors?.length > 0) {
      return renderWithLayout(res, "outlets/users/register", {
        title: "Sign up",
        fields: req.body,
        error: validationErrors,
      });
    }

    try {
      const { username, first_name, last_name, password } = matchedData(req);

      const { hash, salt } = await hashPassword(password);

      const newUser = await userService.create({
        username,
        first_name,
        last_name,
        hash,
        salt,
      });

      if (!newUser) {
        const error = new Error("Internal Server Error");
        error.statusCode = 500;

        console.error(`[userController.register]
          User could not be created.
          Path ${req.path};
          Body: ${{ username, first_name, last_name }}
        `);
        return next(error);
      }

      delete newUser.hash;
      delete newUser.salt;

      return renderWithLayout(res, "outlets/users/register-success", {
        title: "Registration successful!",
        user: newUser,
        showSuccessHeader: true,
        error: null,
      });
    } catch (error) {
      next(error);
    }
  },

  showSelfActivation: async (req, res, next) => {
    try {
      const newUser = await userService.getById(req.user.id);
      if (!newUser) {
        const error = new Error("Internal Server Error");
        error.statusCode = 500;

        console.error(`[userController.showSelfActivation]
          User could not found.
          Path ${req.path}
        `);
        return next(error);
      }
      return renderWithLayout(res, "outlets/users/register-success", {
        title: "Account activation",
        user: newUser,
        showSuccessHeader: false,
        error: null,
      });
    } catch (error) {
      next(error);
    }
  },

  selfActivation: async (req, res, next) => {
    try {
      const validationErrors = req.validationErrors;

      if (validationErrors?.length > 0) {
        return renderWithLayout(res, "outlets/users/register-success", {
          title: "Account activation",
          user: req.user,
          showSuccessHeader: false,
          error: validationErrors,
        });
      }

      const { secretcode } = matchedData(req);

      const codeMatch = process.env.ACTIVATION_SECRET_CODE === secretcode;

      if (!codeMatch) {
        return renderWithLayout(res, "outlets/users/register-success", {
          title: "Account activation",
          user: req.user,
          showSuccessHeader: false,
          error: [
            {
              type: "custom",
              value: "redacted",
              msg: "Secret code is incorrect.",
              path: "secretcode",
              location: "body",
            },
          ],
        });
      }

      const activatedUser = await userService.selfActivate(req.user.id);
      if (!activatedUser) {
        const error = new Error(`User #${req.user.id} was not found.`);
        error.statusCode = 404;
        return next(error);
      }

      return renderWithLayout(res, "outlets/users/activate-success", {
        title: "Activation successful",
        user: req.user,
      });
    } catch (error) {
      next(error);
    }
  },

  showOwnProfile: (req, res) => {
    const user = req.user;

    return renderWithLayout(res, "outlets/users/profile", {
      title: "Edit Profile",
      notification: null,
      fields: user,
      error: null,
    });
  },

  updateOwnProfile: async (req, res, next) => {
    const validationErrors = req.validationErrors;

    if (validationErrors?.length > 0) {
      return renderWithLayout(res, "outlets/users/profile", {
        title: "Edit Profile",
        notification: null,
        fields: { ...req.body, username: req.user.username },
        error: validationErrors,
      });
    }

    try {
      const { first_name, last_name } = matchedData(req);

      const updatedUser = await userService.updateProfile(req.user.id, {
        first_name,
        last_name,
      });
      if (!updatedUser) {
        const error = new Error("Internal Server Error");
        error.statusCode = 500;

        console.error(`[userController.updateOwnProfile]
          User could not be created. Try again later. 
          Path ${req.path};
          Body: ${req.body}
        `);
        return next(error);
      }

      return renderWithLayout(res, "outlets/users/profile", {
        title: "Edit Profile",
        notification: [{ msg: "Profile has been updated." }],
        fields: { first_name, last_name, username: req.user.username },
        error: null,
      });
    } catch (error) {
      next(error);
    }
  },

  showPasswordChange: (req, res) => {
    return renderWithLayout(res, "outlets/users/password-change", {
      title: "Change Password",
      notification: null,
      error: null,
    });
  },

  passwordChange: async (req, res, next) => {
    const validationErrors = req.validationErrors;

    if (validationErrors?.length > 0) {
      return renderWithLayout(res, "outlets/users/password-change", {
        title: "Change Password",
        notification: null,
        error: validationErrors,
      });
    }

    try {
      const { current_password, new_password } = matchedData(req);

      const storedUser = await userService.getById(req.user.id);
      if (!storedUser) {
        const error = new Error("Internal Server Error");
        error.statusCode = 500;

        console.error(`[userController.passwordChange > get storedUser]
          User's password could not be updated.
          Path ${req.path};
        `);
        return next(error);
      }

      const passwordMatch = await verifyPassword(
        current_password,
        storedUser.hash,
        storedUser.salt,
      );
      if (!passwordMatch) {
        const passwordMatchError = [
          {
            type: "field",
            value: "",
            msg: "Current Password is incorrect.",
            path: "current_password",
            location: "body",
          },
        ];

        return renderWithLayout(res, "outlets/users/password-change", {
          title: "Change Password",
          notification: null,
          error: passwordMatchError,
        });
      }
      const { hash, salt } = await hashPassword(new_password);

      const updatedUser = await userService.changePassword(req.user.id, {
        hash,
        salt,
      });
      if (!updatedUser) {
        const error = new Error("Internal Server Error");
        error.statusCode = 500;

        console.error(`[userController.passwordChange > changePassword]
          User's password could not be updated.
          Path ${req.path};
        `);
        return next(error);
      }

      return renderWithLayout(res, "outlets/users/password-change", {
        title: "Change Password",
        notification: [{ msg: "Password has been updated." }],
        error: null,
      });
    } catch (error) {
      next(error);
    }
  },

  manageUsers: async (req, res, next) => {
    try {
      const users = await userService.getAll({ includeDeleted: true });
      if (!users) {
        const error = new Error("Internal Server Error");
        error.statusCode = 500;

        console.error(`[userController.manageUsers]
          Users could not be loaded.
          Path ${req.path};
        `);
        return next(error);
      }

      const usersWithFormatting = users.map((user) => {
        delete user.hash;
        delete user.salt;
        return {
          ...user,
          status: user.status.toLowerCase().replaceAll("_", " "),
          role: user.role.toLowerCase(),
          created_at__formatted: !user.created_at
            ? ""
            : formatTimestamp(user.created_at, { variant: "medium" }),
          updated_at__formatted: !user.updated_at
            ? ""
            : formatTimestamp(user.updated_at, { variant: "medium" }),
          deleted_at__formatted: !user.deleted_at
            ? ""
            : formatTimestamp(user.deleted_at, { variant: "medium" }),
        };
      });

      renderWithLayout(res, "outlets/admin/manage-users", {
        title: "User management",
        users: usersWithFormatting,
      });
    } catch (error) {
      next(error);
    }
  },

  activateUser: async (req, res, next) => {
    try {
      const user_id = req.params[0];
      if (!user_id) {
        const error = new Error(`User #${user_id} was not found.`);
        error.statusCode = 404;
        return next(error);
      }

      const user = await userService.getById(user_id);
      if (!user) {
        const error = new Error(`User #${user_id} was not found.`);
        error.statusCode = 404;
        return next(error);
      }

      if (req.user.role !== "ADMIN") {
        const error = new Error("Internal Server Error");
        error.statusCode = 500;

        console.error(`[userController.activateUser > admin role check]
          User is not an admin.
          Path ${req.path};
        `);
        return next(error);
      }
      const admin_id = req.user.id;

      const activatedUser = await userService.adminActivate(
        user_id,
        admin_id,
        "Administrator: User activation",
      );
      if (!activatedUser) {
        const error = new Error("Internal Server Error");
        error.statusCode = 500;

        console.error(`[userController.terminateUser > adminTerminate]
          User #${user_id} does not exist or was deleted.
          Path ${req.path};
        `);
        return next(error);
      }

      res.redirect("/users/manage");
    } catch (error) {
      next(error);
    }
  },

  terminateUser: async (req, res, next) => {
    try {
      const user_id = req.params[0];
      if (!user_id) {
        const error = new Error(`User #${user_id} was not found.`);
        error.statusCode = 404;
        return next(error);
      }

      const user = await userService.getById(user_id);
      if (!user) {
        const error = new Error(`User #${user_id} was not found.`);
        error.statusCode = 404;
        return next(error);
      }

      if (req.user.role !== "ADMIN") {
        const error = new Error("Internal Server Error");
        error.statusCode = 500;

        console.error(`[userController.terminateUser > admin role check]
          User is not an admin.
          Path ${req.path};
        `);
        return next(error);
      }
      const admin_id = req.user.id;

      const terminatedUser = await userService.adminTerminate(
        user_id,
        admin_id,
      );
      if (!terminatedUser) {
        const error = new Error("Internal Server Error");
        error.statusCode = 500;

        console.error(`[userController.terminateUser > adminTerminate]
          User #${user_id} does not exist or was deleted.
          Path ${req.path};
        `);
        return next(error);
      }

      res.redirect("/users/manage");
    } catch (error) {
      next(error);
    }
  },

  restoreUser: async (req, res, next) => {
    try {
      const user_id = req.params[0];
      if (!user_id) {
        const error = new Error(`User #${user_id} was not found.`);
        error.statusCode = 404;
        return next(error);
      }

      const user = await userService.getById(user_id);
      if (!user) {
        const error = new Error(`User #${user_id} was not found.`);
        error.statusCode = 404;
        return next(error);
      }

      if (req.user.role !== "ADMIN") {
        const error = new Error("Internal Server Error");
        error.statusCode = 500;

        console.error(`[userController.restoreUser > admin role check]
          User is not an admin.
          Path ${req.path};
        `);
        return next(error);
      }
      const admin_id = req.user.id;

      const restoredUser = await userService.adminActivate(
        user_id,
        admin_id,
        "User reactivation",
      );
      if (!restoredUser) {
        const error = new Error("Internal Server Error");
        error.statusCode = 500;

        console.error(`[userController.restoreUser > adminActivate]
          User #${user_id} does not exist or was deleted.
          Path ${req.path};
        `);
        return next(error);
      }

      res.redirect("/users/manage");
    } catch (error) {
      next(error);
    }
  },

  showUserLogs: async (req, res, next) => {
    try {
      const user_id = req.params[0];
      if (!user_id) {
        const error = new Error(`User #${user_id} was not found.`);
        error.statusCode = 404;
        return next(error);
      }

      const userRaw = await userService.getById(user_id);
      if (!userRaw) {
        const error = new Error(`User #${user_id} was not found.`);
        error.statusCode = 404;
        return next(error);
      }

      delete userRaw.hash;
      delete userRaw.salt;

      const user = {
        ...userRaw,
        status: userRaw.status.toLowerCase().replaceAll("_", " "),
        role: userRaw.role.toLowerCase(),
        created_at__formatted: !userRaw.created_at
          ? ""
          : formatTimestamp(userRaw.created_at, { variant: "medium" }),
        updated_at__formatted: !userRaw.updated_at
          ? ""
          : formatTimestamp(userRaw.updated_at, { variant: "medium" }),
        deleted_at__formatted: !userRaw.deleted_at
          ? ""
          : formatTimestamp(userRaw.deleted_at, { variant: "medium" }),
      };

      const userHistoryRaw = await userHistoryService.getHistoryByUserId(
        user.id,
      );
      if (!userHistoryRaw) {
        const error = new Error(
          `User history for user #${user_id} was not found.`,
        );
        error.statusCode = 404;
        return next(error);
      }
      const userHistory = userHistoryRaw.map((record) => {
        delete record.snapshot.hash;
        delete record.snapshot.salt;
        return {
          ...record,
          created_at__formatted: !record.created_at
            ? ""
            : formatTimestamp(record.created_at, { variant: "medium" }),
          snapshot: {
            ...record.snapshot,
            created_at__formatted: !record.snapshot.created_at
              ? ""
              : formatTimestamp(record.snapshot.created_at),
            updated_at__formatted: !record.snapshot.updated_at
              ? ""
              : formatTimestamp(record.snapshot.updated_at, {
                  variant: "medium",
                }),
            deleted_at__formatted: !record.snapshot.deleted_at
              ? ""
              : formatTimestamp(record.snapshot.deleted_at, {
                  variant: "medium",
                }),
          },
        };
      });

      renderWithLayout(res, "outlets/admin/manage-user", {
        title: `User ${user.username} (User ID: ${user_id}) History`,
        user,
        userHistory,
      });
    } catch (error) {
      next(error);
    }
  },
};
