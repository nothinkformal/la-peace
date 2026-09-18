const languageSelector = document.getElementById("language_selector");

const translations = {
    en: {
        mission_title: "Our Mission",

        mission_paragraph_1: "Our mission is to reduce or erase the involvement of AI in the creative industry, or the creative communities in general. AI can be useful for many things mainly involving information, but image, music, writing, animation and designing being assisted or entirely created by AI makes the result \"sloppy\" or low quality.",

    },

    id: {
        story_title: "Grinto",

        story_paragraph_one: "Grinto",
    }
};

function changeLanguage(language) {
    const selectedTranslations = translations[language];

    for (const id in selectedTranslations) {
        document.getElementById(id).textContent = selectedTranslations[id];
    }

    localStorage.setItem("mission_language", language);
}

languageSelector.addEventListener("change", () => {
    changeLanguage(languageSelector.value);
});

const savedLanguage = localStorage.getItem("mission_language") || "en";

languageSelector.value = savedLanguage;
changeLanguage(savedLanguage);