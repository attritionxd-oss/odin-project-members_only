/* eslint-disable no-undef */
const badgeBtn = document.querySelector(".usermenu__badge-button");
const badgeOvelayMenu = document.querySelector(".usermenu__badge-overlay");

if (badgeBtn && badgeOvelayMenu) {
  badgeBtn.addEventListener("click", (e) => {
    e.stopPropagation();
    badgeOvelayMenu.classList.toggle("is-open");
  });

  document.addEventListener("click", (e) => {
    if (
      badgeOvelayMenu.classList.contains("is-open") &&
      !badgeOvelayMenu.contains(e.target) &&
      !badgeBtn.contains(e.target)
    ) {
      badgeOvelayMenu.classList.remove("is-open");
    }
  });

  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && badgeOvelayMenu.classList.contains("is-open")) {
      badgeOvelayMenu.classList.remove("is-open");
    }
  });
}
