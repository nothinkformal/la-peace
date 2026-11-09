/* Genre selector. The introduction has no expand/retract behavior. */
(() => {
    "use strict";
    const genres = {
        pop: ["Pop", "music-note.svg", "Pop music is built to connect with a broad audience. It often features memorable melodies, clear song structures, catchy hooks, and polished production. Pop draws ideas from many other genres, so its sound changes with the times.", "Catchy hooks · memorable melodies · verse-and-chorus structure"],
        rock: ["Rock", "guitar.svg", "Rock commonly centres on electric guitars, bass, drums, and a strong rhythmic pulse. It ranges from energetic songs to experimental styles, often emphasising live performance and distinctive guitar sounds.", "Guitar-led arrangements · strong beat · energetic performance"],
        rap: ["Rap", "microphone.svg", "Rap places rhythmic, spoken or chanted vocals at the centre of a track. Rappers use rhyme, flow, wordplay, storytelling, and delivery over beats drawn from many musical traditions.", "Rhythmic vocals · rhyme and wordplay · flow over a beat"],
        hiphop: ["Hip-hop", "turntable.svg", "Hip-hop is a broad cultural and musical tradition, with rap as one of its best-known musical forms. Production often uses beats, sampling, looping, DJ techniques, and creative approaches to rhythm and sound.", "Beat-making · sampling · DJ culture · rap"],
        indie: ["Indie", "spark.svg", "Indie originally referred to music made independently of major record labels. Today, it also describes a wide range of sounds associated with personal songwriting, experimentation, and a less conventional approach.", "Independent spirit · distinctive songwriting · experimentation"],
        jazz: ["Jazz", "saxophone.svg", "Jazz is known for improvisation, expressive phrasing, syncopated rhythms, and interaction between musicians. Its styles range from small acoustic ensembles to big bands and modern fusions.", "Improvisation · syncopation · musical interplay"]
    };
    const buttons = document.querySelectorAll(".genre_button");
    const title = document.getElementById("genre_detail_title");
    const icon = document.getElementById("genre_detail_icon");
    const description = document.getElementById("genre_detail_description");
    const features = document.getElementById("genre_detail_features");
    buttons.forEach(button => button.addEventListener("click", () => {
        const genre = genres[button.dataset.genre];
        if (!genre) return;
        buttons.forEach(item => {
            const selected = item === button;
            item.classList.toggle("active", selected);
            item.setAttribute("aria-pressed", String(selected));
        });
        if (title) title.textContent = genre[0];
        if (icon && icon.tagName.toLowerCase() === "img") {
            icon.src = genre[1];
            icon.alt = "";
        }
        if (description) description.textContent = genre[2];
        if (features) features.textContent = genre[3];
    }));
})();
