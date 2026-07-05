document.getElementById("coverInput").addEventListener("change", function (e) {
  const file = e.target.files[0];
  if (file) {
    const preview = document.getElementById("preview");
    preview.src = URL.createObjectURL(file);
  }
});
