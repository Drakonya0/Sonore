const http = require("http");
const https = require("https");

const PORT = 3001;

const SPOTIFY_CLIENT_ID =
"f35b3ee6de2d4df0ba5df61027564f55";

const SPOTIFY_CLIENT_SECRET =
"c74860a72bc746b5b0753ed859506a52";

let spotifyToken = null;
let tokenExpiry = 0;


// ============================
// GET SPOTIFY TOKEN
// ============================

async function getSpotifyToken() {

    if (spotifyToken && Date.now() < tokenExpiry) {
        return spotifyToken;
    }

    return new Promise((resolve, reject) => {

        const credentials = Buffer.from(
            SPOTIFY_CLIENT_ID +
            ":" +
            SPOTIFY_CLIENT_SECRET
        ).toString("base64");

        const body =
        "grant_type=client_credentials";

        const options = {
            hostname: "accounts.spotify.com",
            path: "/api/token",
            method: "POST",
            headers: {
                "Authorization": "Basic " + credentials,
                "Content-Type": "application/x-www-form-urlencoded",
                "Content-Length": Buffer.byteLength(body)
            }
        };

        const req = https.request(options, res => {

            let data = "";

            res.on("data", chunk => data += chunk);

            res.on("end", () => {

                const json = JSON.parse(data);

                spotifyToken = json.access_token;

                tokenExpiry =
                Date.now() +
                (json.expires_in - 60) * 1000;

                resolve(spotifyToken);

            });

        });

        req.on("error", reject);
        req.write(body);
        req.end();

    });

}


// ============================
// PROXY SERVER
// ============================

const server = http.createServer(async (req, res) => {

    // CORS headers
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
    res.setHeader("Access-Control-Allow-Headers", "*");

    if (req.method === "OPTIONS") {
        res.writeHead(204);
        res.end();
        return;
    }

    // Route : /spotify?q=...
    if (req.url.startsWith("/spotify")) {

        try {

            const params =
            new URLSearchParams(
                req.url.split("?")[1]
            );

            const query = params.get("q");

            const token =
            await getSpotifyToken();

            const spotifyPath =
            `/v1/search?q=${encodeURIComponent(query)}&type=album&limit=5&market=FR`;

            const options = {
                hostname: "api.spotify.com",
                path: spotifyPath,
                method: "GET",
                headers: {
                    "Authorization": "Bearer " + token
                }
            };

            const spotifyReq =
            https.request(options, spotifyRes => {

                let data = "";

                spotifyRes.on(
                    "data",
                    chunk => data += chunk
                );

                spotifyRes.on("end", () => {

                    res.writeHead(200, {
                        "Content-Type": "application/json"
                    });

                    res.end(data);

                });

            });

            spotifyReq.on("error", err => {

                res.writeHead(500);
                res.end(JSON.stringify({ error: err.message }));

            });

            spotifyReq.end();

        } catch(error) {

            res.writeHead(500);
            res.end(JSON.stringify({ error: error.message }));

        }

    } else {

        res.writeHead(404);
        res.end("Not found");

    }

});

server.listen(PORT, () => {
    console.log(`✅ Proxy Spotify lancé sur http://localhost:${PORT}`);
    console.log(`   Exemple : http://localhost:${PORT}/spotify?q=la+tempete+ysos`);
});
