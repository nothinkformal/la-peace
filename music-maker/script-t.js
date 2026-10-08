/* =========================================================
   LEM.CO MUSIC TUTORIAL
   Theme, translation, preferences, and background music
========================================================= */

const lightModeButton = document.getElementById("light_mode_button");
const darkModeButton = document.getElementById("dark_mode_button");
const languageSelector = document.getElementById("language_selector");

const preferencesButton = document.getElementById("preferences_button");
const preferencesMenu = document.getElementById("preferences_menu");

const backgroundMusicToggle = document.getElementById("music_toggle");
const backgroundMusic = document.getElementById("background_music");


/* =========================================================
   THEME
========================================================= */

function setTheme(theme) {
    const dark = theme === "dark";

    document.body.classList.toggle("dark_mode", dark);

    if (lightModeButton) {
        lightModeButton.classList.toggle("active", !dark);
        lightModeButton.setAttribute("aria-pressed", dark ? "false" : "true");
    }

    if (darkModeButton) {
        darkModeButton.classList.toggle("active", dark);
        darkModeButton.setAttribute("aria-pressed", dark ? "true" : "false");
    }

    localStorage.setItem("theme", theme);
}

lightModeButton?.addEventListener("click", () => setTheme("light"));
darkModeButton?.addEventListener("click", () => setTheme("dark"));


/* =========================================================
   TRANSLATIONS
========================================================= */

const translations = {
    en: {
        page_title: "Music Theory — LEM.CO",
        home_link: "Home",
        music_link: "Music Maker",
        drawing_link: "Drawing Lab",
        gallery_link: "Gallery",
        story_link: "The Story",
        mission_link: "Our Mission",
        credits_link: "Credits",
        about_link: "About",
        music_title: "Music",
        music_theory_title: "Music theory",
        music_theory_description: "Learn the foundations behind music.",
        creating_music_title: "Creating Music",
        creating_music_description: "Learn about creating music, the tools available, and how to begin making your own.",
        genres_title: "Genres",
        genres_description: "Explore different musical genres and what makes each one distinct.",
        music_lab_label: "Music Lab",
        background_music_label: "Background music"
    },

    id: {
        page_title: "Grinto",
        home_link: "Grinto",
        music_link: "Grinto",
        drawing_link: "Grinto",
        gallery_link: "Grinto",
        story_link: "Grinto",
        mission_link: "Grinto",
        credits_link: "Grinto",
        about_link: "Grinto",
        music_title: "Grinto",
        music_theory_title: "Grinto",
        music_theory_description: "Grinto",
        creating_music_title: "Grinto",
        creating_music_description: "Grinto",
        genres_title: "Grinto",
        genres_description: "Grinto",
        music_lab_label: "Grinto",
        background_music_label: "Grinto"
    }
};

function changeLanguage(language) {
    const selected = translations[language];
    if (!selected) return;

    for (const id in selected) {
        const element = document.getElementById(id);
        if (element) element.textContent = selected[id];
    }

    document.documentElement.lang = language;
    localStorage.setItem("language", language);
}

languageSelector?.addEventListener("change", () => {
    changeLanguage(languageSelector.value);
});


/* =========================================================
   PREFERENCES
   Only the background music option is included.
========================================================= */

preferencesButton?.addEventListener("click", (event) => {
    event.stopPropagation();

    const isOpen = !preferencesMenu.hasAttribute("hidden");

    if (isOpen) {
        preferencesMenu.setAttribute("hidden", "");
        preferencesButton.setAttribute("aria-expanded", "false");
    } else {
        preferencesMenu.removeAttribute("hidden");
        preferencesButton.setAttribute("aria-expanded", "true");
    }
});

document.addEventListener("click", (event) => {
    if (
        preferencesMenu &&
        !preferencesMenu.contains(event.target) &&
        event.target !== preferencesButton
    ) {
        preferencesMenu.setAttribute("hidden", "");
        preferencesButton?.setAttribute("aria-expanded", "false");
    }
});


/* =========================================================
   BACKGROUND MUSIC
========================================================= */

function setBackgroundMusicEnabled(enabled) {
    if (!backgroundMusic) return;

    if (backgroundMusicToggle) {
        backgroundMusicToggle.checked = enabled;
    }

    localStorage.setItem(
        "backgroundMusic",
        enabled ? "enabled" : "disabled"
    );

    if (!enabled) {
        backgroundMusic.pause();
        return;
    }

    backgroundMusic.play().catch(() => {});
}

backgroundMusicToggle?.addEventListener("change", () => {
    setBackgroundMusicEnabled(backgroundMusicToggle.checked);
});


/*
   If music was previously enabled, browsers may still require
   a user interaction before playback is allowed.
*/

if (backgroundMusic) {
    const startMusicAfterInteraction = () => {
        if (backgroundMusicToggle?.checked) {
            backgroundMusic.play().catch(() => {});
        }
    };

    document.addEventListener("click", startMusicAfterInteraction, { once: true });
    document.addEventListener("keydown", startMusicAfterInteraction, { once: true });
}


/* =========================================================
   INITIALIZATION
========================================================= */

const savedTheme = localStorage.getItem("theme") || "light";
setTheme(savedTheme);

const savedLanguage = localStorage.getItem("language") || "en";

if (languageSelector) {
    languageSelector.value = savedLanguage;
}

changeLanguage(savedLanguage);

const savedBackgroundMusic =
    localStorage.getItem("backgroundMusic") === "enabled";

if (backgroundMusicToggle) {
    backgroundMusicToggle.checked = savedBackgroundMusic;
}

setBackgroundMusicEnabled(savedBackgroundMusic);
