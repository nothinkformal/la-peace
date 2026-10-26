const lightModeButton = document.getElementById("light_mode_button");
const darkModeButton = document.getElementById("dark_mode_button");
const languageSelector = document.getElementById("language_selector");
const loadingScreen = document.getElementById("loadingScreen");
const loadingContent = document.getElementById("loadingContent");
const loadingImage = document.getElementById("loadingImage");
const loadingBar = document.getElementById("loadingBar");


/* =========================================================
   THEME
========================================================= */

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


/* =========================================================
   TRANSLATIONS
========================================================= */

const translations = {

    en: {

        page_title: "Lem.co",

        credits_link: "Credits",

        mission_link: "Our Mission",

        story_link: "The Story",

        gallery_link: "Gallery",

        music_link: "Music Maker",

        music_title: "Music",

        music_description:
            "Create your own music"

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


/* =========================================================
   LOAD SAVED THEME
========================================================= */

const savedTheme =
    localStorage.getItem("theme") || "light";

setTheme(savedTheme);


/* =========================================================
   LANGUAGE
========================================================= */

function changeLanguage(language) {

    const selectedTranslations =
        translations[language];

    for (const id in selectedTranslations) {

        const element =
            document.getElementById(id);

        if (element) {

            element.textContent =
                selectedTranslations[id];

        }

    }

    localStorage.setItem(
        "language",
        language
    );
}

languageSelector.addEventListener(
    "change",
    () => {

        changeLanguage(
            languageSelector.value
        );

    }
);


const savedLanguage =
    localStorage.getItem("language") || "en";

languageSelector.value =
    savedLanguage;

changeLanguage(savedLanguage);



/* =========================================================
   PREFERENCES
========================================================= */

const preferencesButton =
    document.getElementById("preferences_button");

const preferencesMenu =
    document.getElementById("preferences_menu");

const adBarsToggle =
    document.getElementById("ads_toggle");

const backgroundMusicToggle =
    document.getElementById("music_toggle");

const backgroundMusic =
    document.getElementById("background_music");

const sidebarMusicToggle =
    document.getElementById("sidebar_music_toggle");

const adCountIncrease =
    document.getElementById("ad_count_increase");

const adCountValue =
    document.getElementById("ad_count_value");


/* =========================================================
   AD BAR COUNT
========================================================= */

const MAX_AD_BARS = 2;
const MIN_AD_BARS = 1;

let adBarCount = Math.min(
    MAX_AD_BARS,
    Math.max(
        MIN_AD_BARS,
        parseInt(
            localStorage.getItem("adBarCount") || "1",
            10
        ) || 1
    )
);


function updateAdBarLayout() {

    const layout =
        document.getElementById("lab_layout");

    const adBars =
        document.querySelectorAll(".feature_card");

    if (!layout || !adBars.length) {
        return;
    }

    /*
       Keep the selected layout on the BODY.

       The CSS is responsible for the actual grid:
       1 = right ad only
       2 = both ads

       We deliberately do NOT set gridTemplateColumns
       inline here. The CSS controls the ad widths.
    */
    document.body.classList.remove(
        "ad_bars_1",
        "ad_bars_2"
    );

    document.body.classList.add(
        `ad_bars_${adBarCount}`
    );

    /* Let CSS control display, including mobile rules. */
    adBars.forEach((bar) => {
        bar.style.display = "";
    });

    if (adCountValue) {
        adCountValue.textContent = adBarCount;
    }

    if (adCountIncrease) {
        adCountIncrease.disabled = false;
        adCountIncrease.setAttribute(
            "aria-disabled",
            "false"
        );
        adCountIncrease.setAttribute(
            "aria-label",
            adBarCount >= MAX_AD_BARS
                ? "Show one ad bar"
                : "Show two ad bars"
        );
    }
}


function setAdBarCount(count) {

    adBarCount = Math.min(
        MAX_AD_BARS,
        Math.max(
            MIN_AD_BARS,
            count
        )
    );

    localStorage.setItem(
        "adBarCount",
        String(adBarCount)
    );

    updateAdBarLayout();
}


function setAdBarsEnabled(enabled) {

    document.body.classList.toggle(
        "hide_ad_bars",
        !enabled
    );

    localStorage.setItem(
        "adBars",
        enabled ? "enabled" : "disabled"
    );

    const adBars =
        document.querySelectorAll(".feature_card");

    if (!enabled) {

        document.body.classList.remove(
            "ad_bars_1",
            "ad_bars_2"
        );

        adBars.forEach((bar) => {
            bar.style.display = "none";
        });

        if (adCountValue) {
            adCountValue.textContent = adBarCount;
        }

        return;
    }

    updateAdBarLayout();
}


/*
   Cycle the ad count:

   1 -> 2
   2 -> 1
*/
if (adCountIncrease) {

    adCountIncrease.addEventListener(
        "click",
        (event) => {

            event.preventDefault();
            event.stopPropagation();

            const nextCount =
                adBarCount >= MAX_AD_BARS
                    ? MIN_AD_BARS
                    : adBarCount + 1;

            setAdBarCount(nextCount);
        }
    );
}


window.addEventListener(
    "resize",
    () => {

        if (localStorage.getItem("adBars") !== "disabled") {
            updateAdBarLayout();
        }

    }
);


function setBackgroundMusicEnabled(enabled) {

    if (!backgroundMusic) {
        return;
    }


    if (backgroundMusicToggle) {

        backgroundMusicToggle.checked =
            enabled;

    }


    if (sidebarMusicToggle) {

        sidebarMusicToggle.classList.toggle(
            "is_off",
            !enabled
        );

        sidebarMusicToggle.setAttribute(
            "aria-pressed",
            enabled ? "true" : "false"
        );

        sidebarMusicToggle.setAttribute(
            "aria-label",
            enabled
                ? "Disable background music"
                : "Enable background music"
        );

        sidebarMusicToggle.title =
            enabled
                ? "Disable background music"
                : "Enable background music";

    }


    localStorage.setItem(
        "backgroundMusic",
        enabled ? "enabled" : "disabled"
    );


    if (!enabled) {

        backgroundMusic.pause();

        return;
    }


    /*
       Browsers may block autoplay until the
       visitor interacts with the page.
    */

    backgroundMusic.play().catch(
        () => {}
    );

}


if (preferencesButton && preferencesMenu) {

    preferencesButton.addEventListener(
        "click",
        (event) => {

            event.stopPropagation();

            const isOpen = !preferencesMenu.hasAttribute("hidden");

            if (isOpen) {
                preferencesMenu.setAttribute("hidden", "");
                preferencesButton.setAttribute("aria-expanded", "false");
            } else {
                preferencesMenu.removeAttribute("hidden");
                preferencesButton.setAttribute("aria-expanded", "true");
            }

        }
    );


    document.addEventListener(
        "click",
        (event) => {

            if (
                !preferencesMenu.contains(event.target) &&
                event.target !== preferencesButton
            ) {

                preferencesMenu.setAttribute("hidden", "");
                preferencesButton.setAttribute("aria-expanded", "false");

            }

        }
    );

}


const savedAdBars =
    localStorage.getItem("adBars") !== "disabled";


/* Restore the saved ad count before applying the visibility state. */
setAdBarCount(adBarCount);


const savedBackgroundMusic =
    localStorage.getItem("backgroundMusic") === "enabled";


if (adBarsToggle) {

    adBarsToggle.checked =
        savedAdBars;

    setAdBarsEnabled(
        savedAdBars
    );

    adBarsToggle.addEventListener(
        "change",
        () => {

            setAdBarsEnabled(
                adBarsToggle.checked
            );

        }
    );

}


if (backgroundMusicToggle) {

    backgroundMusicToggle.checked =
        savedBackgroundMusic;

    setBackgroundMusicEnabled(
        savedBackgroundMusic
    );

    backgroundMusicToggle.addEventListener(
        "change",
        () => {

            setBackgroundMusicEnabled(
                backgroundMusicToggle.checked
            );

        }
    );

}


/*
   Sidebar music-note button.
   It controls the exact same setting as the
   Background music checkbox in Preferences.
*/
if (sidebarMusicToggle) {

    sidebarMusicToggle.addEventListener(
        "click",
        () => {

            const currentlyEnabled =
                backgroundMusicToggle
                    ? backgroundMusicToggle.checked
                    : localStorage.getItem("backgroundMusic") === "enabled";

            setBackgroundMusicEnabled(
                !currentlyEnabled
            );

        }
    );

}


/*
   If music was enabled previously, wait for the
   visitor's first interaction before attempting
   playback. This avoids browser autoplay blocks.
*/

if (backgroundMusic) {

    const startMusicAfterInteraction =
        () => {

            if (
                backgroundMusicToggle &&
                backgroundMusicToggle.checked
            ) {

                backgroundMusic.play().catch(
                    () => {}
                );

            }

            document.removeEventListener(
                "click",
                startMusicAfterInteraction
            );

            document.removeEventListener(
                "keydown",
                startMusicAfterInteraction
            );

        };


    document.addEventListener(
        "click",
        startMusicAfterInteraction,
        { once: true }
    );


    document.addEventListener(
        "keydown",
        startMusicAfterInteraction,
        { once: true }
    );

}


/* =========================================================
   PAGE INITIALIZATION
========================================================= */

document.addEventListener(
    "DOMContentLoaded",
    () => {


        /* =================================================
           LOADING SCREEN
        ================================================= */

        const loadingScreen =
            document.getElementById(
                "loadingScreen"
            );

        const loadingBar =
            document.getElementById(
                "loadingBar"
            );

        const loadingText =
            document.getElementById(
                "loadingText"
            );

        const loadingTopText =
            document.getElementById(
                "loadingTopText"
            );


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
			
			"Hi lol",
			
			"bitzies boys are back again"
			
        ];


        function randomItem(array) {

            return array[
                Math.floor(
                    Math.random() *
                    array.length
                )
            ];

        }


        loadingTopText.textContent =
            randomItem(topMessages);

        loadingText.textContent =
            randomItem(loadingMessages);


        const loadingDuration = 5000;

        const expansionDelay = 1001;

        const expansionDuration = 1400;


        const startTime =
            performance.now();


        const textInterval =
            setInterval(
                () => {

                    loadingText.textContent =
                        randomItem(
                            loadingMessages
                        );

                },
                900
            );


        function updateLoading(currentTime) {

            const elapsed =
                currentTime - startTime;


            let progress =
                elapsed / loadingDuration;


            if (progress >= 1) {

                progress = 1;

                loadingBar.style.width =
                    "100%";


                clearInterval(
                    textInterval
                );


                loadingText.textContent =
                    "Lemco and Door&David wishes you a productive session";


                setTimeout(
                    () => {

                        loadingScreen.classList.add(
                            "finished"
                        );


                        setTimeout(
                            () => {

                                loadingScreen.classList.add(
                                    "hidden"
                                );

                            },
                            expansionDuration
                        );

                    },
                    expansionDelay
                );


                return;
            }


            loadingBar.style.width =
                `${progress * 100}%`;


            requestAnimationFrame(
                updateLoading
            );
        }


        requestAnimationFrame(
            updateLoading
        );


        /* =================================================
           LEM.CO BROADCAST TICKER
        ================================================= */

        const ticker =
            document.getElementById(
                "ticker_content"
            );

        const tickerText =
            document.getElementById(
                "info_text"
            );


        if (!ticker || !tickerText) {
            return;
        }


        const tickerMessages = [
		"LEM.CO, Art for All",
		"Message from our founder: you're doing great!",
		"LEM.CO, Promoting Human Art",
        ];


        let lastTickerMessage = null;


        function getRandomTickerMessage() {

            let message;


            do {

                message =
                    tickerMessages[
                        Math.floor(
                            Math.random() *
                            tickerMessages.length
                        )
                    ];

            }
            while (
                tickerMessages.length > 1 &&
                message === lastTickerMessage
            );


            lastTickerMessage =
                message;


            return message;
        }


        function updateTickerDistance() {

            const tickerWindow =
                ticker.parentElement;


            if (!tickerWindow) {
                return;
            }


            const windowWidth =
                tickerWindow.clientWidth;


            const tickerWidth =
                ticker.getBoundingClientRect().width;


            ticker.style.setProperty(
                "--ticker-start",
                `${-tickerWidth - 20}px`
            );


            ticker.style.setProperty(
                "--ticker-end",
                `${windowWidth + 20}px`
            );
        }


        function playTickerMessage(message) {

            tickerText.textContent =
                message;


            /*
			calc
            */

            ticker.classList.remove(
                "ticker_running"
            );


            updateTickerDistance();


            /*
			animation reset
            */

            void ticker.offsetWidth;


            ticker.classList.add(
                "ticker_running"
            );
        }


        /*
		marquee effect
        */

        ticker.addEventListener(
            "animationend",
            () => {

                playTickerMessage(
                    getRandomTickerMessage()
                );

            }
        );


        /*
            Recalculate the movement distance
            if the browser is resized.
        */

        window.addEventListener(
            "resize",
            updateTickerDistance
        );


        /*
            First message.
        */

        tickerText.textContent =
            "LEM.CO, Art for all";


        lastTickerMessage =
            "LEM.CO, Art for all";


        updateTickerDistance();


        ticker.classList.add(
            "ticker_running"
        );

    }
);

/* =========================================================
   FEATURED ARTWORK ROTATION
========================================================= */

/*
   TABLE
*/

const featuredArtworks = [

    {
        image: "art/space.png",

        creator: "Naildoor",

        socials: {
            instagram: "https://www.instagram.com/naildoority/",
            x: "#",
            other: "#"
        },

        description:
            "an artwork depicting an astronaut in space"
    },

    {
        image: "art/album-full.png",

        creator: "Naildoor",

        socials: {
            instagram: "https://www.instagram.com/naildoority/",
            x: "#",
            other: "#"
        },

        description:
            "an artwork based on an album"
    },

    {
        image: "art/manhunter.png",

        creator: "Naildoor",

        socials: {
            instagram: "https://www.instagram.com/naildoority/",
            x: "#",
            other: "#"
        },

        description:
            "john jones"
    }

];


/*
SHUFFLE
*/
function shuffleFeaturedArtworks(artworks) {

    const shuffled = [...artworks];

    for (
        let i = shuffled.length - 1;
        i > 0;
        i--
    ) {

        const j = Math.floor(
            Math.random() * (i + 1)
        );

        [shuffled[i], shuffled[j]] =
            [shuffled[j], shuffled[i]];

    }

    return shuffled;
}


function renderFeaturedArtwork(artwork, card) {

    if (!artwork || !card) {
        return;
    }

    const image =
        card.querySelector(".feature_artwork img");

    const creator =
        card.querySelector(".feature_creator");

    const description =
        card.querySelector(".feature_description span");

    const socialLinks =
        card.querySelectorAll(".feature_socials a");


    if (image && artwork.image) {

        image.src = artwork.image;

        image.alt =
            `${artwork.creator || "Featured"} artwork`;

    }


    if (creator) {

        creator.textContent =
            artwork.creator || "Creator's Name";

    }


    if (description) {

        description.textContent =
            artwork.description || "";

    }


    if (socialLinks.length > 0) {

        socialLinks[0].href =
            artwork.socials?.instagram || "#";

    }


    if (socialLinks.length > 1) {

        socialLinks[1].href =
            artwork.socials?.x || "#";

    }


    if (socialLinks.length > 2) {

        socialLinks[2].href =
            artwork.socials?.other || "#";

    }

}


function randomizeFeaturedArtworks() {

    const cards =
        document.querySelectorAll(".feature_card");

    if (!cards.length || !featuredArtworks.length) {
        return;
    }

    const shuffled =
        shuffleFeaturedArtworks(featuredArtworks);


    /*
	ASSIGNMENT OF ARTWORK
    */
    cards.forEach((card, index) => {

        if (!shuffled.length) {
            return;
        }

        const artwork =
            shuffled[index % shuffled.length];

        renderFeaturedArtwork(
            artwork,
            card
        );

    });

}


/*
RANDOM SHUFFLE
*/
randomizeFeaturedArtworks();

setInterval(
    randomizeFeaturedArtworks,
    60 * 1000
);
