const lightModeButton = document.getElementById("light_mode_button");
const darkModeButton = document.getElementById("dark_mode_button");
const languageSelector = document.getElementById("language_selector");
const loadingScreen = document.getElementById("loadingScreen");
const loadingContent = document.getElementById("loadingContent");
const loadingImage = document.getElementById("loadingImage");
const loadingBar = document.getElementById("loadingBar");

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

        const element = document.getElementById(id);

        if (element) {
            element.textContent = selectedTranslations[id];
        }

    }

    localStorage.setItem("language", language);
}

languageSelector.addEventListener("change", () => {
    changeLanguage(languageSelector.value);
});

const savedLanguage = localStorage.getItem("language") || "en";

languageSelector.value = savedLanguage;
changeLanguage(savedLanguage);

document.addEventListener("DOMContentLoaded", () => {

    const loadingScreen = document.getElementById("loadingScreen");
    const loadingBar = document.getElementById("loadingBar");
    const loadingText = document.getElementById("loadingText");
    const loadingTopText = document.getElementById("loadingTopText");

    if (!loadingScreen || !loadingBar) {
        return;
    }

    const topMessages = [
        "A Door&David Project"
    ];

    const loadingMessages = [
        "the word grinto is very sophisticated",
        "the music lab was our first app",
        "𓀀 𓀁 𓀂 𓀃 𓀄 𓀅 𓀆 𓀇 𓀈 𓀉 𓀊 𓀋 𓀌 𓀍 𓀎 𓀏 𓀐 𓀑 𓀒 𓀓 𓀔 𓀕 𓀖 𓀗 𓀘 𓀙 𓀚 𓀛 𓀜 𓀝 𓀞 𓀟 𓀠 𓀡 𓀢 𓀣 𓀤 𓀥 𓀦 𓀧 𓀨 𓀩 𓀪 𓀫 𓀬 𓀭 𓀮 𓀯 𓀰 𓀱 𓀲 𓀳 𓀴 𓀵 𓀶 𓀷 𓀸 𓀹 𓀺 𓀻 𓀼 𓀽 𓀾 𓀿 𓁀 𓁁 𓁂 𓁃 𓁄𓁈𓂀𓋹𓆣𓁀𓀾",
    ];

    function randomItem(array) {
        return array[Math.floor(Math.random() * array.length)];
    }

    loadingTopText.textContent = randomItem(topMessages);
    loadingText.textContent = randomItem(loadingMessages);

    const loadingDuration = 9000;
    const expansionDelay = 1001;
    const expansionDuration = 1400;

    const startTime = performance.now();

    const textInterval = setInterval(() => {

        loadingText.textContent = randomItem(loadingMessages);

    }, 900);

    function updateLoading(currentTime) {

        const elapsed = currentTime - startTime;

        let progress = elapsed / loadingDuration;

        if (progress >= 1) {

            progress = 1;

            loadingBar.style.width = "100%";

            clearInterval(textInterval);

            loadingText.textContent = "Lemco and Door&David wishes you a productive session";

            setTimeout(() => {

                loadingScreen.classList.add("finished");

                setTimeout(() => {

                    loadingScreen.classList.add("hidden");

                }, expansionDuration);

            }, expansionDelay);

            return;
        }

        loadingBar.style.width = `${progress * 100}%`;

        requestAnimationFrame(updateLoading);
    }

    requestAnimationFrame(updateLoading);

});