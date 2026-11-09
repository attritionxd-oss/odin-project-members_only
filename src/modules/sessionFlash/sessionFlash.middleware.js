export const sessionFlash = (req, res, next) => {
  if (!req.session.flash) {
    req.session.flash = {};
  }

  req.flash = (type, msg) => {
    if (msg) {
      req.session.flash[type] = msg;
    } else {
      const message = req.session.flash[type];
      delete req.session.flash[type];
      return message;
    }
  };

  next();
};
