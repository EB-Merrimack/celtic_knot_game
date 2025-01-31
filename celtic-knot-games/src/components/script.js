/* Menu toggle script */
document.addEventListener("DOMContentLoaded", function() {
  const menuToggle = document.getElementById("menu-toggle");
  const menu = document.getElementById("menu");
  const closeMenu = document.getElementById("close-menu");

  menuToggle.addEventListener("click", function() {
    menu.classList.toggle("show");
  });
  /* Close the menu when close is clicked */

  closeMenu.addEventListener("click", function() {
    menu.classList.remove("show");
  });
});
document.addEventListener("DOMContentLoaded", function() {
  const closeMenu = document.getElementById("close-menu");
  const menu = document.getElementById("menu");

  closeMenu.addEventListener("click", function() {
    menu.classList.remove("show");
  });
});