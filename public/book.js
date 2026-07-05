document.addEventListener("DOMContentLoaded", () => {
  const searchInput = document.getElementById("searchInput");
  const grid = document.querySelector(".books-grid");
  const sortBtn = document.getElementById("sortBtn");
  const sortMenu = document.getElementById("sortMenu");

  let timeout = null;

  /* =============================
     🔍 TÌM KIẾM SÁCH (AJAX)
  ============================= */
  if (searchInput) {
    searchInput.addEventListener("input", () => {
      clearTimeout(timeout);
      timeout = setTimeout(async () => {
        const q = searchInput.value.trim();
        const res = await fetch(`/api/books/search?q=${encodeURIComponent(q)}`);
        const books = await res.json();

        grid.innerHTML = "";

        if (books.length === 0) {
          grid.innerHTML = `<p style="color:#999;text-align:center;width:100%">Không tìm thấy sách nào.</p>`;
          return;
        }

        books.forEach(book => {
          const card = document.createElement("div");
          card.className = "book-card";
          card.dataset.created = book.createdAt || Date.now();
          card.innerHTML = `
            <div class="book-cover">
              <a href="/book/${book._id}">
                <img src="${book.image || '/default.jpg'}" alt="${book.title}">
              </a>
            </div>
            <div class="book-title">${book.title}</div>
            <p class="book-author">${book.author || ""}</p>
          `;
          grid.appendChild(card);
        });
      }, 300);
    });
  }

  /* =============================
     🔽 SORT MENU (SẮP XẾP)
  ============================= */
  if (sortBtn && sortMenu) {
    // Hiện/ẩn menu
    sortBtn.addEventListener("click", (e) => {
      e.stopPropagation();
      sortMenu.classList.toggle("hide");

      const icon = sortBtn.querySelector("i");
      icon.style.transition = "transform 0.25s ease";
      icon.style.transform = sortMenu.classList.contains("hide")
        ? "rotate(0deg)"
        : "rotate(180deg)";
    });

    // Ẩn menu khi click ra ngoài
    document.addEventListener("click", () => {
      sortMenu.classList.add("hide");
      const icon = sortBtn.querySelector("i");
      icon.style.transform = "rotate(0deg)";
    });

    // Sort khi chọn
    sortMenu.addEventListener("click", (e) => {
      const li = e.target.closest("li");
      if (!li) return;

      const value = li.dataset.sort;
      const cards = Array.from(grid.children);

      cards.sort((a, b) => {
        const titleA = a.querySelector(".book-title").textContent.trim().toLowerCase();
        const titleB = b.querySelector(".book-title").textContent.trim().toLowerCase();
        const authorA = a.querySelector(".book-author")?.textContent.trim().toLowerCase() || "";
        const authorB = b.querySelector(".book-author")?.textContent.trim().toLowerCase() || "";
        const dateA = Number(a.dataset.created || 0);
        const dateB = Number(b.dataset.created || 0);

        switch (value) {
          case "title-asc": return titleA.localeCompare(titleB);
          case "title-desc": return titleB.localeCompare(titleA);
          case "author-asc": return authorA.localeCompare(authorB);
          case "author-desc": return authorB.localeCompare(authorA);
          case "newest": return dateB - dateA;
          case "oldest": return dateA - dateB;
          default: return 0;
        }
      });

      // render lại
      grid.innerHTML = "";
      cards.forEach(c => grid.appendChild(c));

      sortMenu.classList.add("hide");
    });
  }
});
