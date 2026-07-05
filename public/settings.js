const tabs = document.querySelectorAll(".tab-item");
const contents = document.querySelectorAll(".tab-content");

tabs.forEach(tab => {
  tab.addEventListener("click", () => {
    tabs.forEach(t => t.classList.remove("active"));
    contents.forEach(c => c.classList.remove("active"));
    tab.classList.add("active");
    const target = tab.getAttribute("data-tab");
    document.getElementById(target).classList.add("active");
  });
});

function togglePassword(btn) {
  const cell = btn.closest(".password-cell");
  const span = cell.querySelector(".password-text");
  const icon = btn.querySelector("i");

  if (span.textContent.includes("*")) {
    // Hiện mật khẩu
    span.textContent = span.dataset.password;
    icon.classList.remove("fa-eye-slash");
    icon.classList.add("fa-eye");
  } else {
    // Ẩn lại
    span.textContent = "********";
    icon.classList.remove("fa-eye");
    icon.classList.add("fa-eye-slash");
  }
}

