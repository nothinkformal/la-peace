const languageSelector = document.getElementById("language_selector");

const translations = {
    en: {
        mission_title: "Our Mission",

        mission_paragraph_1: "Our mission is to reduce or erase the involvement of AI in the creative industry, or the creative communities in general. AI can be useful for many things mainly involving information, but image, music, writing, animation and designing being assisted or entirely created by AI makes the result \"sloppy\" or low quality.",

        mission_paragraph_2: "According to a lot of people and us included, art is created with hardwork and soul, not a prompt that took you 5 minutes to write. Because of that, our mission is to reduce the involvement of AI in the creation of art as a whole. Instead, using the tools or information provided from this website to make an introduction to any of the 4 art forms displayed on the website more accessible and easier.",

        mission_signature: "-nalatheblox, DL"
    },

    id: {
        mission_title: "Grinto",

        mission_paragraph_1: "Grinto",

        mission_paragraph_2: "Grinto",

        mission_signature: "Grintos"
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