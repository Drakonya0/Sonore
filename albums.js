const apiKey =
"c6b9d9ad368f30cf24c6fc909a750af3";

const username =
"Vyrdox";

const albumsGrid =
document.getElementById("albumsGrid");


// ============================
// PROXY LOCAL
// ============================

const PROXY =
"http://localhost:3001";


// ============================
// NORMALIZE (accents → ASCII)
// ============================

function normalize(str) {
    return str
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}


// ============================
// GET SPOTIFY IMAGE
// ============================

async function getSpotifyImage(albumName, artistName) {

    try {

        const query =
        normalize(albumName) +
        " " +
        normalize(artistName);

        const url =
        `${PROXY}/spotify?q=${encodeURIComponent(query)}`;

        const response =
        await fetch(url);

        const data =
        await response.json();

        if (
            data.albums &&
            data.albums.items &&
            data.albums.items.length > 0
        ) {

            const match =
            data.albums.items.find(a =>
                normalize(a.name)
                .includes(normalize(albumName))
            ) || data.albums.items[0];

            if (
                match.images &&
                match.images.length > 0
            ) {

                return match.images[0].url;

            }

        }

    } catch(error) {

        console.log(
            "Erreur Spotify :",
            error
        );

    }

    return null;

}


// ============================
// TOP ALBUMS
// ============================

const albumsUrl =
`https://ws.audioscrobbler.com/2.0/?method=user.gettopalbums&user=${username}&api_key=${apiKey}&format=json&period=7day&limit=24`;

fetch(albumsUrl)

.then(response => response.json())

.then(async data => {

    const albums =
    data.topalbums.album;

    albumsGrid.innerHTML = "";

    for (const album of albums) {

        const albumCard =
        document.createElement("section");

        albumCard.classList.add("album-card");

        let image = "";


        // ============================
        // 1. SPOTIFY
        // ============================

        const spotifyImage =
        await getSpotifyImage(
            album.name,
            album.artist.name
        );

        if (spotifyImage) {
            image = spotifyImage;
        }


        // ============================
        // 2. LAST.FM
        // ============================

        if (image === "") {

            if (
                album.image &&
                album.image.length > 0
            ) {

                const lastfmImage =
                album.image[
                    album.image.length - 1
                ]["#text"];

                if (
                    lastfmImage &&
                    !lastfmImage.includes("2a96cbd8")
                ) {

                    image = lastfmImage;

                }

            }

        }


        // ============================
        // 3. ITUNES
        // ============================

        if (image === "") {

            try {

                const searchTerm =
                normalize(album.name) +
                " " +
                normalize(album.artist.name);

                const iTunesUrl =
                `https://itunes.apple.com/search?term=${encodeURIComponent(searchTerm)}&entity=album&limit=5&country=fr`;

                const iTunesResponse =
                await fetch(iTunesUrl);

                const iTunesData =
                await iTunesResponse.json();

                if (
                    iTunesData.results &&
                    iTunesData.results.length > 0
                ) {

                    const match =
                    iTunesData.results.find(r =>
                        normalize(r.collectionName || "")
                        .includes(normalize(album.name))
                    ) || iTunesData.results[0];

                    if (match && match.artworkUrl100) {

                        image =
                        match.artworkUrl100
                        .replace("100x100bb", "600x600bb")
                        .replace("100x100", "600x600");

                    }

                }

            } catch(error) {

                console.log(
                    "Erreur iTunes :",
                    error
                );

            }

        }


        // ============================
        // 4. FALLBACK FINAL
        // ============================

        if (image === "") {

            image =
            "https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?q=80&w=1200&auto=format&fit=crop";

        }


        // ============================
        // HTML CARD
        // ============================

        albumCard.innerHTML = `

            <img
                src="${image}"
                alt="${album.name}"
            >

            <div class="album-content">

                <h2>${album.name}</h2>

                <p>${album.artist.name}</p>

                <span>
                    ${album.playcount} scrobbles
                </span>

            </div>

        `;

        albumsGrid.appendChild(
            albumCard
        );

    }

})

.catch(error => {

    console.log(
        "Erreur Albums :",
        error
    );

});