const lightModeButton = document.getElementById("light_mode_button");
const darkModeButton = document.getElementById("dark_mode_button");
const languageSelector = document.getElementById("language_selector");

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

const translations = {
    en: {
        page_title: "La Peace Lab",
        credits_link: "Credits",
        mission_link: "Our Mission",
        story_link: "The Story",
        gallery_link: "Gallery",
        music_link: "Music Maker",
        music_title: "Music",
        music_description: "Create your own music"
    },

    id: {
        page_title: "Grinto",
        credits_link: "Grinto",
        mission_link: "Grinto",
        story_link: "Grinto",
        gallery_link: "Grinto",
        music_link: "Grinto",
        music_title: "Grinto",
        music_description: "Grinto"
		
    }
};

const savedTheme = localStorage.getItem("theme") || "light";

setTheme(savedTheme);


function changeLanguage(language) {
    const selectedTranslations = translations[language];

    for (const id in selectedTranslations) {
        document.getElementById(id).textContent = selectedTranslations[id];
    }

    localStorage.setItem("language", language);
}

languageSelector.addEventListener("change", () => {
    changeLanguage(languageSelector.value);
});

const savedLanguage = localStorage.getItem("language") || "en";

languageSelector.value = savedLanguage;
changeLanguage(savedLanguage);