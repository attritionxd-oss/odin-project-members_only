export const renderWithLayout = (res, view, options = {}, status = 200) => {
  /*
  (method) Response<any, Record<string, any>, number>.render(
    view: string, 
    options?: object | undefined, 
    callback?: ((err: Error, html: string) => void) | undefined
  ): void (+1 overload)
  */

  res.render(view, options, (err, bodyHtml) => {
    if (err)
      return res.status(500).send(err.message || "Internal Server Error");

    res.status(status).render("layouts/main", {
      ...options,
      body: bodyHtml,
    });
  });
};
