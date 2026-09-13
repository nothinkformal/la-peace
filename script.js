const lightModeButton = document.getElementById("light_mode_button");
const darkModeButton = document.getElementById("dark_mode_button");

function setTheme(theme) {

    const dark = theme === "dark";

    document.body.classList.toggle("dark_mode", dark);

    lightModeButton.classList.toggle("active", !dark);
    darkModeButton.classList.toggle("active", dark);

    localStorage.setItem("theme", theme);
}

lightModeButton.addEventListener("click", () => {
    setTheme("light");
});

darkModeButton.addEventListener("click", () => {
    setTheme("dark");
});

const savedTheme = localStorage.getItem("theme") || "light";

setTheme(savedTheme);