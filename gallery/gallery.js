
(() => {
    'use strict';

    const ARTWORKS = [
        {
            image: "images/artwork1.png",
            title: "techtok",
            artist: "waxnerf",
            year: "2026",
            description: "an expression about technology"
        },
        
        {
            image: "images/artwork2.png",
            title: "Verity",
            artist: "waxnerf",
            year: "2026",
            description: "its just verity"
        },
		
	    {
            image: "images/manhunter.png",
            title: "manhunter",
            artist: "naildoor",
            year: "2026",
            description: "john jones"
        },
		
	    {
            image: "images/space.png",
            title: "space",
            artist: "naildoor",
            year: "2026",
            description: "an artwork depicting an astronaut in space"
        },
		
	    {
            image: "images/album-full.png",
            title: "album cover",
            artist: "naildoor",
            year: "2026",
            description: "an artwork depicting an album cover"
        },
		
    ];

    const $ = id => document.getElementById(id);

    const grid = $('artworkGrid');
    const searchInput = $('searchInput');
    const artworkCount = $('artworkCount');
    const detailDialog = $('detailDialog');

    let selectedArtwork = null;

    function escapeHTML(value) {
        return String(value ?? '').replace(/[&<>"']/g, character => ({
            '&': '&amp;',
            '<': '&lt;',
            '>': '&gt;',
            '"': '&quot;',
            "'": '&#39;'
        }[character]));
    }

    function getSearchableText(artwork) {
        return [
            artwork.title,
            artwork.artist,
            artwork.year,
            artwork.description,
            'painting'
        ].join(' ').toLowerCase();
    }

    // --------------------------------------------------
    // RENDER THE COLLECTION
    // --------------------------------------------------

    function renderGallery() {
        if (!grid) {
            console.error('Gallery element #artworkGrid was not found.');
            return;
        }

        const query = searchInput
            ? searchInput.value.trim().toLowerCase()
            : '';

        const filteredArtworks = ARTWORKS.filter(artwork =>
            getSearchableText(artwork).includes(query)
        );

        if (artworkCount) {
            artworkCount.textContent =
                `${String(filteredArtworks.length).padStart(2, '0')} WORKS`;
        }

        grid.replaceChildren();

        // Empty collection or no search results
        if (filteredArtworks.length === 0) {
            const emptyState = document.createElement('div');

            emptyState.className = 'gallery-empty';

            emptyState.innerHTML = ARTWORKS.length > 0
                ? `
                    <span class="empty-mark">⌕</span>
                    <h3>No matching paintings.</h3>
                    <p>Try another search term.</p>
                `
                : `
                    <span class="empty-mark">✳</span>
                    <h3>The collection is taking shape.</h3>
                    <p>
                        Add paintings to the ARTWORKS array in
                        <strong>gallery.js</strong> to display them here.
                    </p>
                `;

            grid.append(emptyState);
            return;
        }

        // Create a card for every artwork
        filteredArtworks.forEach((artwork, index) => {
            const card = document.createElement('button');

            card.type = 'button';
            card.className = 'artwork-card';

            card.setAttribute(
                'aria-label',
                `View ${artwork.title || 'untitled painting'}`
            );

            card.innerHTML = `
                <span class="artwork-image">
                    <img
                        src="${escapeHTML(artwork.image)}"
                        alt="${escapeHTML(artwork.title || 'Painting')}"
                        loading="lazy"
                    >
                    <span class="artwork-open" aria-hidden="true">↗</span>
                </span>

                <span class="artwork-caption">
                    <span>
                        <strong>${escapeHTML(artwork.title || 'Untitled')}</strong>
                        <small>Painting · ${escapeHTML(artwork.artist || 'LEM.CO')}</small>
                    </span>

                    <span class="artwork-number">
                        ${String(index + 1).padStart(2, '0')}
                    </span>
                </span>
            `;

            const image = card.querySelector('img');

            image.addEventListener('error', () => {
                image.alt = `Image not found: ${artwork.image}`;
                image.style.display = 'none';
                image.parentElement.style.background = '#e4e7d9';
            });

            card.addEventListener('click', () => {
                openArtwork(artwork);
            });

            grid.append(card);
        });
    }

    // --------------------------------------------------
    // ARTWORK DETAILS
    // --------------------------------------------------

    function openArtwork(artwork) {
        if (!detailDialog) {
            console.error('Artwork detail dialog #detailDialog was not found.');
            return;
        }

        selectedArtwork = artwork;

        $('detailImage').src = artwork.image;
        $('detailImage').alt = artwork.title || 'Painting';

        $('detailTitle').textContent =
            artwork.title || 'Untitled';

        $('detailArtist').textContent = artwork.artist
            ? `BY ${artwork.artist.toUpperCase()}`
            : 'BY LEM.CO';

        $('detailCategory').textContent = 'PAINTING';

        $('detailDescription').textContent =
            artwork.description || 'No description available.';

        $('detailYear').textContent = artwork.year || '';

        detailDialog.showModal();
    }

    // --------------------------------------------------
    // SEARCH
    // --------------------------------------------------

    if (searchInput) {
        searchInput.addEventListener('input', renderGallery);
    }

    // --------------------------------------------------
    // CLOSE THE DETAIL DIALOG
    // --------------------------------------------------

    const closeDetailButton = $('closeDetail');

    if (closeDetailButton && detailDialog) {
        closeDetailButton.addEventListener('click', () => {
            detailDialog.close();
        });
    }

    if (detailDialog) {
        detailDialog.addEventListener('click', event => {
            if (event.target === detailDialog) {
                detailDialog.close();
            }
        });
    }

    // --------------------------------------------------
    // DOWNLOAD ARTWORK
    // --------------------------------------------------

    const downloadButton = $('downloadArtwork');

    if (downloadButton) {
        downloadButton.addEventListener('click', () => {
            if (!selectedArtwork) return;

            const link = document.createElement('a');

            link.href = selectedArtwork.image;

            link.download = (
                selectedArtwork.title || 'painting'
            ).trim().replace(/[\\/:*?"<>|]/g, '-');

            document.body.append(link);
            link.click();
            link.remove();
        });
    }

    // --------------------------------------------------
    // INITIALIZE GALLERY
    // --------------------------------------------------

    renderGallery();

})();
