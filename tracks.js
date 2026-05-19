const API_KEY = "TON_API_KEY";
const username = localStorage.getItem("lastfm_user");

async function fetchTopTracks() {

    const response = await fetch(
        `https://ws.audioscrobbler.com/2.0/?method=user.gettoptracks&user=${username}&api_key=${API_KEY}&format=json&period=overall&limit=20`
    );

    const data = await response.json();

    return data.toptracks.track;

}

async function renderTracks() {

    const tracks = await fetchTopTracks();

    const tracksGrid = document.getElementById("tracksGrid");

    const labels = [];
    const plays = [];

    let totalPlays = 0;

    tracks.forEach((track, index) => {

        totalPlays += Number(track.playcount);

        labels.push(track.name);
        plays.push(track.playcount);

        tracksGrid.innerHTML += `
        
        <div class="track-card glass-card">

            <div class="track-rank">
                #${index + 1}
            </div>

            <img
                class="track-cover"
                src="${track.image[3]["#text"] || 'https://placehold.co/300'}"
            >

            <div class="track-info">

                <h3>
                    ${track.name}
                </h3>

                <p>
                    ${track.artist.name}
                </p>

                <div class="track-plays">
                    ${Number(track.playcount).toLocaleString()} plays
                </div>

            </div>

        </div>
        
        `;

    });

    document.getElementById("totalTracks").textContent =
        tracks.length;

    document.getElementById("totalScrobbles").textContent =
        totalPlays.toLocaleString();

    document.getElementById("avgPlays").textContent =
        Math.floor(totalPlays / tracks.length);

    createChart(labels, plays);

}

function createChart(labels, plays) {

    const ctx =
        document.getElementById("tracksChart");

    new Chart(ctx, {

        type: "line",

        data: {

            labels,

            datasets: [{

                label: "Track Plays",

                data: plays,

                borderColor: "#00F0FF",

                backgroundColor: "rgba(0,240,255,0.1)",

                fill: true,

                tension: 0.4,

                pointRadius: 5,

                pointHoverRadius: 8

            }]

        },

        options: {

            responsive: true,

            plugins: {

                legend: {
                    labels: {
                        color: "white"
                    }
                }

            },

            scales: {

                x: {
                    ticks: {
                        color: "white"
                    }
                },

                y: {
                    ticks: {
                        color: "white"
                    }
                }

            }

        }

    });

}

renderTracks();