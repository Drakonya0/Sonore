const apiKey = "c6b9d9ad368f30cf24c6fc909a750af3";

const username = "Vyrdox";


// ============================
// ELEMENTS
// ============================

const artistElement =
document.getElementById("artist");

const scrobbleElement =
document.getElementById("scrobbles");

const trackElement =
document.getElementById("track");

const recentTracksContainer =
document.getElementById("recentTracks");

const artistsGrid =
document.getElementById("artistsGrid");

const chartCanvas =
document.getElementById("artistChart");

const topArtistsList =
document.getElementById("topArtistsList");

const topTracksList =
document.getElementById("topTracksList");


// ============================
// FALLBACK IMAGE
// ============================

const fallbackImage =
"https://lastfm.freetls.fastly.net/i/u/300x300/4128a6eb29f94943c9d206c08e625904.png";


// ============================
// GET ARTIST IMAGE
// ============================

async function getArtistImage(artistName) {

    const fallback =
    "https://lastfm.freetls.fastly.net/i/u/300x300/4128a6eb29f94943c9d206c08e625904.png";


    // ============================
    // DEEZER (photo artiste)
    // ============================

    try {

        const deezerUrl =
        `https://api.deezer.com/search/artist?q=${encodeURIComponent(artistName)}`;

        const deezerResponse =
        await fetch(
            `https://corsproxy.io/?url=${encodeURIComponent(deezerUrl)}`
        );

        const deezerData =
        await deezerResponse.json();

        if (
            deezerData.data &&
            deezerData.data.length > 0 &&
            deezerData.data[0].picture_xl
        ) {

            return deezerData.data[0].picture_xl;

        }

    } catch(error) {

        console.log(
            "Erreur Deezer :",
            artistName
        );

    }


    // ============================
    // ITUNES FALLBACK
    // ============================

    try {

        const iTunesUrl =
        `https://itunes.apple.com/search?term=${encodeURIComponent(artistName)}&entity=musicArtist&limit=1`;

        const response =
        await fetch(iTunesUrl);

        const iTunesData =
        await response.json();

        if (
            iTunesData.results &&
            iTunesData.results.length > 0
        ) {

            const artistId =
            iTunesData.results[0].artistId;

            const lookupUrl =
            `https://itunes.apple.com/lookup?id=${artistId}&entity=album&limit=5`;

            const lookupResponse =
            await fetch(lookupUrl);

            const lookupData =
            await lookupResponse.json();

            const album = lookupData.results &&
            lookupData.results.find(
                r => r.wrapperType === "collection" &&
                r.artworkUrl100
            );

            if (album) {

                return album.artworkUrl100
                .replace("100x100bb", "600x600bb")
                .replace("100x100", "600x600");

            }

        }

    } catch(error) {

        console.log(
            "Erreur iTunes :",
            artistName
        );

    }

    return fallback;

}


// ============================
// TOTAL SCROBBLES
// ============================

const userInfoUrl =
`https://ws.audioscrobbler.com/2.0/?method=user.getinfo&user=${username}&api_key=${apiKey}&format=json`;

fetch(userInfoUrl)

.then(response => response.json())

.then(data => {

    if (scrobbleElement) {

        scrobbleElement.textContent =
        data.user.playcount;

    }

})

.catch(error => {

    console.log(
        "Erreur User Info :",
        error
    );

});


// ============================
// TOP ARTISTS
// ============================

const topArtistsUrl =
`https://ws.audioscrobbler.com/2.0/?method=user.gettopartists&user=${username}&api_key=${apiKey}&format=json&period=7day&limit=12`;

fetch(topArtistsUrl)

.then(response => response.json())

.then(async data => {

    const artists =
    data.topartists.artist;

    const top5 =
    artists.slice(0, 5);


    // ============================
    // TOP ARTIST CARD
    // ============================

    if (
        artistElement &&
        top5.length > 0
    ) {

        artistElement.textContent =
        top5[0].name;

    }


    // ============================
    // TOP 5 ARTISTS LIST
    // ============================

    if (topArtistsList) {

        topArtistsList.innerHTML = "";

        top5.forEach((artist, index) => {

            const item =
            document.createElement("div");

            item.classList.add("leaderboard-item");

            item.innerHTML = `

                <span class="leaderboard-rank">
                    #${index + 1}
                </span>

                <span class="leaderboard-name">
                    ${artist.name}
                </span>

                <span class="leaderboard-value">
                    ${artist.playcount}
                </span>

            `;

            topArtistsList.appendChild(item);

        });

    }


    // ============================
    // CHART
    // ============================

    if (chartCanvas) {

        const artistNames =
        top5.map(artist => artist.name);

        const artistScrobbles =
        top5.map(artist => artist.playcount);

        new Chart(chartCanvas, {

            type: "doughnut",

            data: {

                labels: artistNames,

                datasets: [{

                    data: artistScrobbles,

                    backgroundColor: [

                        "#8b5cf6",
                        "#ec4899",
                        "#3b82f6",
                        "#14b8a6",
                        "#f97316"

                    ],

                    borderWidth: 0,

                    hoverOffset: 15

                }]

            },

            options: {

                responsive: true,

                maintainAspectRatio: true,

                aspectRatio: 1,

                cutout: "65%",

                plugins: {

                    legend: {

                        position: "bottom",

                        labels: {

                            color: "white",

                            padding: 20,

                            font: {

                                size: 14

                            }

                        }

                    }

                }

            }

        });

    }


    // ============================
    // ARTISTS PAGE
    // ============================

    if (artistsGrid) {

        artistsGrid.innerHTML = "";


        // FETCH EN PARALLÈLE

        const artistCards =
        await Promise.all(

            artists.map(async artist => {

                const image =
                await getArtistImage(artist.name);

                const idx = artists.indexOf(artist);
                return `
                    <section class="artist-card">
                        <img 
                            src="${image}" 
                            alt="${artist.name}"
                            loading="lazy"
                        >
                        <div class="artist-rank-badge">#${idx + 1}</div>
                        <div class="artist-card-overlay">
                            <h2>${artist.name}</h2>
                            <p>${artist.playcount} écoutes</p>
                        </div>
                    </section>
                `;

            })

        );

        artistsGrid.innerHTML =
        artistCards.join("");

    }

})

.catch(error => {

    console.log(
        "Erreur Top Artists :",
        error
    );

});


// ============================
// TOP TRACKS
// ============================

const topTracksUrl =
`https://ws.audioscrobbler.com/2.0/?method=user.gettoptracks&user=${username}&api_key=${apiKey}&format=json&period=7day&limit=5`;

fetch(topTracksUrl)

.then(response => response.json())

.then(data => {

    const tracks =
    data.toptracks.track;


    // ============================
    // TOP TRACK CARD
    // ============================

    if (
        trackElement &&
        tracks.length > 0
    ) {

        trackElement.textContent =
        tracks[0].name;

    }


    // ============================
    // TOP TRACKS LIST
    // ============================

    if (topTracksList) {

        topTracksList.innerHTML = "";

        tracks.forEach((track, index) => {

            const item =
            document.createElement("div");

            item.classList.add("leaderboard-item");

            item.innerHTML = `

                <span class="leaderboard-rank">
                    #${index + 1}
                </span>

                <span class="leaderboard-name">
                    ${track.name}
                </span>

                <span class="leaderboard-value">
                    ${track.playcount}
                </span>

            `;

            topTracksList.appendChild(item);

        });

    }

})

.catch(error => {

    console.log(
        "Erreur Top Tracks :",
        error
    );

});


// ============================
// RECENT TRACKS
// ============================

if (recentTracksContainer) {

    const recentTracksUrl =
    `https://ws.audioscrobbler.com/2.0/?method=user.getrecenttracks&user=${username}&api_key=${apiKey}&format=json&limit=10`;

    fetch(recentTracksUrl)

    .then(response => response.json())

    .then(data => {

        const tracks =
        data.recenttracks.track;

        recentTracksContainer.innerHTML = "";

        tracks.forEach(track => {

            const trackDiv =
            document.createElement("div");

            trackDiv.classList.add("track");

            let image =
            track.image[3]["#text"];

            if (
                !image ||
                image === ""
            ) {

                image =
                fallbackImage;

            }

            const artist =
            track.artist["#text"];

            trackDiv.innerHTML = `

                <div class="track-left">

                    <img 
                        src="${image}" 
                        alt="${track.name}"
                        loading="lazy"
                    >

                    <div>

                        <h3>${track.name}</h3>

                        <p>${artist}</p>

                    </div>

                </div>

            `;

            recentTracksContainer.appendChild(trackDiv);

        });

    })

    .catch(error => {

        console.log(
            "Erreur Recent Tracks :",
            error
        );

    });

}