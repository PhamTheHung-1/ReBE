const openBtn = document.getElementById("openRegister");
const overlay = document.getElementById("registerOverlay");
const modal = document.getElementById("registerModal");
const closeBtn = document.getElementById("closeRegister");

openBtn.addEventListener("click", (e) => {
  e.preventDefault();
  overlay.style.display = "block";
  modal.style.display = "block";
});

closeBtn.addEventListener("click", () => {
  overlay.style.display = "none";
  modal.style.display = "none";
});

overlay.addEventListener("click", () => {
  overlay.style.display = "none";
  modal.style.display = "none";
});
