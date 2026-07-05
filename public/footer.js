// Footer tab switching
const tabs = document.querySelectorAll('.footer-tabs .tab');
const contents = document.querySelectorAll('.tab-content');

tabs.forEach(tab => {
  tab.addEventListener('click', () => {
    // Bỏ active cũ
    tabs.forEach(t => t.classList.remove('active'));
    contents.forEach(c => c.classList.add('hidden'));

    // Active tab hiện tại
    tab.classList.add('active');
    const tabId = tab.getAttribute('data-tab');
    document.getElementById(tabId).classList.remove('hidden');
  });
});

document.addEventListener("DOMContentLoaded", () => {
  const overlay = document.querySelector(".overlay");
  const popup = document.querySelector(".note-popup");
  const addBtn = document.querySelector(".fa-plus-circle");
  const cancelBtn = document.querySelector(".btn.cancel");

  if (!overlay || !popup) return;

  addBtn?.addEventListener("click", () => {
    overlay.classList.add("active");
    popup.classList.add("active");
  });

  const closePopup = () => {
    overlay.classList.remove("active");
    popup.classList.remove("active");
  };

  overlay.addEventListener("click", closePopup);
  cancelBtn?.addEventListener("click", closePopup);
});


document.addEventListener("DOMContentLoaded", () => {
  const editButtons = document.querySelectorAll(".note-actions a[href*='edit-note']");
  const editOverlay = document.querySelector(".overlay");
  const editPopup = document.querySelector(".edit-popup");
  const editForm = document.querySelector("#editNoteForm");
  const cancelBtn = editPopup.querySelector(".btn.cancel");

  editButtons.forEach((btn) => {
    btn.addEventListener("click", async (e) => {
      e.preventDefault(); //
      const url = btn.getAttribute("href");

      try {
        const res = await fetch(url);
        const data = await res.json();
        const note = data.note;

        // Điền dữ liệu vào form edit
        editForm.noteId.value = note._id;
        editForm.title.value = note.title;
        editForm.content.value = note.content;

        // Gán action POST động
        const bookId = window.location.pathname.split("/book/")[1].split("/")[0];
        editForm.action = `/book/${bookId}/edit-note`;

        // Hiển popup edit
        editPopup.classList.add("active");
        editOverlay.classList.add("active");
      } catch (err) {
        console.error("Không thể tải note:", err);
      }
    });
  });

  // Nút Hủy đóng popup
  cancelBtn?.addEventListener("click", closePopup);
  editOverlay?.addEventListener("click", closePopup);

  function closePopup() {
    editPopup.classList.remove("active");
    editOverlay.classList.remove("active");
  }
});

