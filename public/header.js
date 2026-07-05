const menuBtn = document.querySelector(".menu-icon");
const sidebar = document.querySelector(".sidebar");
const overlay = document.querySelector(".overlay");

menuBtn.addEventListener("click", () => {
  sidebar.classList.toggle("hidden");
  overlay.classList.toggle("active");
});

menuBtn.addEventListener("click", () => {
  sidebar.classList.toggle("expanded");
});
