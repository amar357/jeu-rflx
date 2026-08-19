/* =====================================================
   SUPABASE
===================================================== */

const SUPABASE_URL =
    "https://hcdnezijiolfycmstrhb.supabase.co";

const SUPABASE_KEY ="sb_publishable_F8vz7zIXUcIAsJxtH0HKSw_xh0fSBw9";


const supabaseClient =
    window.supabase.createClient(
        SUPABASE_URL,
        SUPABASE_KEY
    );


/* =====================================================
   ELEMENTS HTML
===================================================== */

const reactionBox =
    document.getElementById("reactionBox");

const startBtn =
    document.getElementById("startBtn");

const message =
    document.getElementById("message");

const result =
    document.getElementById("result");

const bestDisplay =
    document.getElementById("best");

const usernameInput =
    document.getElementById("username");

const leaderboardList =
    document.getElementById("leaderboardList");


/* =====================================================
   VARIABLES
===================================================== */

let startTime = 0;

let timeout = null;

let gameStarted = false;

let waiting = false;


/* =====================================================
   CHARGER LE PSEUDO
===================================================== */

const savedUsername =
    localStorage.getItem("arenaUsername");


if (savedUsername) {

    usernameInput.value =
        savedUsername;
}


/* =====================================================
   CHARGER MEILLEUR SCORE
===================================================== */

const savedBest =
    localStorage.getItem("arenaBest");


if (savedBest) {

    bestDisplay.textContent =
        savedBest + " ms";
}


/* =====================================================
   SAUVEGARDER LE PSEUDO
===================================================== */

usernameInput.addEventListener(
    "input",
    () => {

        const username =
            usernameInput.value.trim();

        if (username) {

            localStorage.setItem(
                "arenaUsername",
                username
            );
        }

    }
);


/* =====================================================
   START
===================================================== */

startBtn.addEventListener(
    "click",
    startGame
);


function startGame() {

    const username =
        usernameInput.value.trim();


    /* Vérifier le pseudo */

    if (!username) {

        result.textContent =
            "⚠️ Écris ton pseudo avant de jouer A NEMI.";

        usernameInput.focus();

        return;
    }


    if (gameStarted) {

        return;
    }


    gameStarted = true;

    waiting = true;

    result.textContent = "";

    startBtn.disabled = true;


    reactionBox.classList.remove("go");

    reactionBox.classList.add("ready");

    message.textContent =
        "ATTENDS...";


    /*
        Temps aléatoire :
        entre 2 et 5 secondes
    */

    const randomTime =
        Math.floor(
            Math.random() * 3000
        ) + 2000;


    timeout = setTimeout(
        reactionReady,
        randomTime
    );
}


/* =====================================================
   LE JEU EST PRÊT
===================================================== */

function reactionReady() {

    waiting = false;


    reactionBox.classList.remove(
        "ready"
    );

    reactionBox.classList.add(
        "go"
    );


    message.textContent =
        "CLIQUE !";


    startTime =
        performance.now();
}


/* =====================================================
   CLIQUER SUR LA ZONE
===================================================== */

reactionBox.addEventListener(
    "click",
    () => {

        if (!gameStarted) {

            return;
        }


        /* =========================
           TROP TÔT
        ========================= */

        if (waiting) {

            clearTimeout(timeout);


            result.textContent =
                "❌ SLAQL ASID !";


            resetGame();

            return;
        }


        /* =========================
           CALCUL DU SCORE
        ========================= */

        const endTime =
            performance.now();


        const reactionTime =
            Math.round(
                endTime - startTime
            );


        result.textContent =
            `⚡ ${reactionTime} ms`;


        /* =========================
           MEILLEUR SCORE LOCAL
        ========================= */

        updateBest(
            reactionTime
        );


        /* =========================
           SUPABASE
        ========================= */

        const username =
            usernameInput.value.trim();


        saveScore(
            username,
            reactionTime
        );


        resetGame();

    }
);


/* =====================================================
   RESET
===================================================== */

function resetGame() {

    gameStarted = false;

    waiting = false;

    startBtn.disabled = false;


    reactionBox.classList.remove(
        "ready"
    );

    reactionBox.classList.remove(
        "go"
    );


    message.textContent =
        "Clique sur START";
}


/* =====================================================
   MEILLEUR SCORE LOCAL
===================================================== */

function updateBest(score) {

    const currentBest =
        localStorage.getItem(
            "arenaBest"
        );


    if (
        !currentBest ||
        score < Number(currentBest)
    ) {

        localStorage.setItem(
            "arenaBest",
            score
        );


        bestDisplay.textContent =
            score + " ms";
    }
}


/* =====================================================
   ENREGISTRER SCORE SUPABASE
===================================================== */

async function saveScore(
    username,
    score
) {

    const {
        error
    } = await supabaseClient
        .from("scores")
        .insert({
            username: username,
            score: score
        });


    if (error) {

        console.error(
            "Erreur Supabase :",
            error
        );

        return;
    }


    console.log(
        "✅ Score enregistré !"
    );


    /* Actualiser le classement */

    loadLeaderboard();
}


/* =====================================================
   CHARGER LE CLASSEMENT
===================================================== */

async function loadLeaderboard() {

    leaderboardList.innerHTML =
        `<div class="loading">
            Chargement...
        </div>`;


    const {
        data,
        error
    } = await supabaseClient
        .from("scores")
        .select("username, score")
        .order("score", {
            ascending: true
        })
        .limit(10);


    if (error) {

        console.error(
            "Erreur classement :",
            error
        );


        leaderboardList.innerHTML =
            `<div class="error">
                Impossible de charger le classement.
            </div>`;

        return;
    }


    /* Aucun score */

    if (!data || data.length === 0) {

        leaderboardList.innerHTML =
            `<div class="loading">
                Aucun score pour le moment.
                <br>
                Sois le premier !
            </div>`;

        return;
    }


    /* Construire le classement */

    leaderboardList.innerHTML =
        "";


    data.forEach(
        (player, index) => {

            const div =
                document.createElement(
                    "div"
                );


            div.className =
                "player";


            div.innerHTML = `

                <div class="player-left">

                    <span class="rank">
                        #${index + 1}
                    </span>

                    <span class="player-name">
                        ${escapeHTML(
                            player.username
                        )}
                    </span>

                </div>

                <span class="player-score">
                    ${player.score} ms
                </span>

            `;


            leaderboardList.appendChild(
                div
            );

        }
    );
}


/* =====================================================
   PROTECTION AFFICHAGE PSEUDO
===================================================== */

function escapeHTML(text) {

    const div =
        document.createElement(
            "div"
        );

    div.textContent =
        text;

    return div.innerHTML;
}


/* =====================================================
   LANCER LE CLASSEMENT
===================================================== */

loadLeaderboard();
