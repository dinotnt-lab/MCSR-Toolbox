document.addEventListener("DOMContentLoaded", () => {
    document.querySelectorAll(".tool").forEach(tool => {
        const title = tool.querySelector(".tooltitle");
        const hiddenSection = tool.querySelector(".hidden");
        if (!title || !hiddenSection) return;

        title.addEventListener("click", () => {
            hiddenSection.style.display = hiddenSection.style.display === "block" ? "none" : "block";
        });
    });
});