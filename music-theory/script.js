(() => {
    "use strict";

    const pages = [

        // =====================================
        // PAGE 1 - MUSIC THEORY
        // =====================================

        {
            title: "I. Music theory",
            content: [
                {
                    text: "Music theory is the foundation on which all music is created. It is the study of the elements and structures that create music. Music theory originated back in ancient civilizations such as in Greece where they developed a system of scales and modes as time moved on, in the middle ages, music theory was further refined and musical notation was introduced. Throughout history prominent musicians and theorists have contributed to the evolution of music theory."
                },
                {
                    text: "To better understand Music theory we have to look at the important components of Music theory:"
                },
                {
                    heading: "Notes and Scales",
                    text: "Music begins with organization of sounds into notes. These notes follow specific patterns known as scales. The most common scale is the diatonic scale, it is comprised of seven notes which are arranged in a specific order. Understanding these scales is crucial for making melodies and harmonies."
                },
                {
                    heading: "Chords",
                    text: "Chords are a group of notes that are played at the same time. They form the backbone of harmonies and can convey different emotions based on their arrangement. Musicians use chords to build the harmonic structure of a piece of music"
                },
                {
                    heading: "Rhythm",
                    text: "Rhythm is the timing and duration of notes and rests in music. Musicians use time signatures and tempo to create different rhythmic patterns that give music its characteristic feel."
                },
                {
                    heading: "Harmony",
                    text: "Harmony includes the combination of different musical elements to create a pleasant and unified sound. Musicians use harmony to add depth to their compositions and it is an essential element in most music genres."
                },
                {
                    heading: "Form",
                    text: "The form of a musical composition refers to its structure and organizations."
                },
                {
                    heading: "Notation",
                    text: "Musicians use a system of notations such as sheet music or tablature to communicate their music visually. Understanding and learning how to read and write musical notation is an essential skill for anyone pursuing a career in music."
                },
                {
                    heading: "Dynamics and Expressions",
                    text: "Dynamics refer to the variations in loudness and intensity in a piece of music."
                }
            ]
        },


        // =====================================
        // PAGE 2 - MUSIC INDUSTRY
        // =====================================

        {
            title: "II. Connection between Music Theory and Music Industry",
            content: [
                {
                    text: "Music theory is the toolbox that empowers composers, song writers and musicians to create original pieces. A deep understanding of the theory allows them to make informed choices about melody, harmony and form, allowing them to craft music that appeals with their audience."
                },
                {
                    text: "Examples of how musicians use music theory are as follows:"
                },
                {
                    text: "Musicians who perform rely on their knowledge of music theory to interpret and perform music accurately."
                },
                {
                    text: "Arrangers and orchestrators are musicians who adapt music for different ensembles and instrumentations various ensembles and instrumentations. The music theory helps them to make decisions about which instruments to use, how to voice chords, and how to structure the arrangement."
                },
                {
                    text: "Music educators, such as teachers and professors, rely heavily on music theory to teach their students. It provides the base for explaining and demonstrating musical concepts, making it an important tool for nurturing the next generation of musicians."
                },
                {
                    text: "In the studio recording engineers and producers use the music theory to communicate with musicians effectively."
                },
                {
                    text: "Musicologists study the history and cultural context of music. A strong foundation in music theory helps them analyze and interpret music from various eras and time periods, providing insight into the development of musical styles and trends."
                },
                {
                    text: "Therefore we can say that music theory is connected to the music industry as it provides knowledge that musicians use in their work."
                },
                {
                    heading: "How music theory apply to parts of the music business"
                },
                {
                    heading: "In melody creation:",
                    text: "Understanding scales and notes is essential for crafting engaging melodies. Composers use their knowledge of scales to create emotional resonant tunes."
                },
                {
                    heading: "In harmonic progression:",
                    text: "Composers use elements such as chords and harmony to construct the foundation of a piece of music, ensuring that it conveys the intended mood or emotion"
                },
                {
                    heading: "Arranging:",
                    text: "Musicians who are skilled in music theory can create intricate and beautiful arrangements that bring compositions to life"
                },
                {
                    heading: "Innovation:",
                    text: "Music theory also provides a base for experimentation and innovation. By understanding the rules, musicians can choose when and how to create unique and unexpected sounds"
                }
            ]
        },


        // =====================================
        // PAGE 3 - EDUCATION
        // =====================================

        {
            title: "Music Theory in Education and Teaching",
            content: [
                {
                    text: "People who are interested in teaching music must have a strong foundation in music theory."
                },
                {
                    text: "Music teachers use music theory to guide their students in learning and playing the principles of music. They help their students develop the skills which are necessary to become good and able musicians. Educational institutions and private music schools most of the time, create music programs that include the music theory's components."
                },
                {
                    text: "A good music teacher knows that every student is unique and how to adapt their teaching methods to suit individual learning styles. A strong understanding of the music theory allows them to do this very thing effectively."
                },
                {
                    text: "Music teachers also encourage their students to express themselves through music. Understanding music theory allows them to guide their students in their creative endeavors through composition."
                }
            ]
        },


        // =====================================
        // PAGE 4 - DIGITAL AGE
        // =====================================

        {
            title: "Music Theory in the Digital Age",
            content: [
                {
                    text: "As technology continues to evolve, the music industry advance along side it also evolves the music industry through the new tools and techniques created by modern digital technology causing music theory to become even more relevant"
                },
                {
                    text: "Software and digital audio workstations allow composers to create music using virtual instruments and effects. An understanding of music theory is essential for using these tools effectively. Producers who shape the final sounds of recording, rely on music theory to make decisions about arrangement, instrumentation and mixing."
                },
                {
                    text: "The internet has made music theory resources more accessible. Online courses, tutorials, and interactive learning platforms provide musicians with a wide range of information."
                }
            ]
        }

    ];


    // =====================================
    // ELEMENTS
    // =====================================

    const contentContainer = document.getElementById("story_content");
    const pageLabel = document.getElementById("story_page_label");
    const pageIndicator = document.getElementById("page_indicator");
    const previousButton = document.getElementById("previous_page");
    const nextButton = document.getElementById("next_page");
    const scrollContainer = document.querySelector(".content");


    // =====================================
    // PAGE TRACKING
    // =====================================

    let currentPage = 0;


    // =====================================
    // DISPLAY PAGE
    // =====================================

    function displayPage() {
        const page = pages[currentPage];
        const fragment = document.createDocumentFragment();

        const title = document.createElement("h2");
        title.className = "story_page_title";
        title.textContent = page.title;
        fragment.appendChild(title);

        page.content.forEach((section) => {
            if (section.heading) {
                const heading = document.createElement("h3");
                heading.className = "story_section_heading";
                heading.textContent = section.heading;
                fragment.appendChild(heading);
            }

            if (section.text) {
                const paragraph = document.createElement("p");
                paragraph.textContent = section.text;
                fragment.appendChild(paragraph);
            }
        });

        contentContainer.replaceChildren(fragment);

        pageLabel.textContent = `PAGE ${currentPage + 1} OF ${pages.length}`;
        pageIndicator.textContent = `${currentPage + 1} / ${pages.length}`;

        previousButton.disabled = currentPage === 0;
        nextButton.disabled = currentPage === pages.length - 1;

        if (scrollContainer) {
            scrollContainer.scrollTop = 0;
        }
    }


    // =====================================
    // NAVIGATION
    // =====================================

    previousButton.addEventListener("click", () => {
        if (currentPage > 0) {
            currentPage--;
            displayPage();
        }
    });

    nextButton.addEventListener("click", () => {
        if (currentPage < pages.length - 1) {
            currentPage++;
            displayPage();
        }
    });


    // =====================================
    // INITIALIZE
    // =====================================

    displayPage();

})();
