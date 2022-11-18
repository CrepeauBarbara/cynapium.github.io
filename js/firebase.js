// Import the functions you need from the SDKs you need
import { initializeApp } from "https://www.gstatic.com/firebasejs/9.14.0/firebase-app.js";
import { getAnalytics } from "https://www.gstatic.com/firebasejs/9.14.0/firebase-analytics.js";

// SDKs for Firebase products that you want to use
// See: https://firebase.google.com/docs/web/setup#available-libraries
import { getDatabase, get, child, ref, push, update, set } from 'https://www.gstatic.com/firebasejs/9.14.0/firebase-database.js';

// Replace the following with your app's Firebase project configuration
// See: https://firebase.google.com/docs/web/learn-more#config-object
const firebaseConfig = {
    apiKey: "AIzaSyAAM1pLt_5Cl-B3dkXxo2-80DlpACs5ciU",
    authDomain: "memory-athlete-trainer.firebaseapp.com",
    databaseURL: "https://memory-athlete-trainer-default-rtdb.europe-west1.firebasedatabase.app",
    projectId: "memory-athlete-trainer",
    storageBucket: "memory-athlete-trainer.appspot.com",
    messagingSenderId: "141674837704",
    appId: "1:141674837704:web:bf5006b1c8f7a964ea57fd",
    measurementId: "G-4N7TFSKQT7"
};

var all_users = [];

// Initialize Firebase
const app = initializeApp(firebaseConfig);

export function updateUser(user_name, user_email, score, gameKey) {
    const db = getDatabase();

    var user_key = writeNewUser(user_name, user_email, score);

    const updates = {};
    //updates['/users/' + user_uuid + '/email'] = user_email;
    //updates['/users/' + user_uuid + '/name'] = user_name;
    updates['/game/' + gameKey + '/user'] = user_key;

    getAllScores();
    return update(ref(db), updates);
}

export function getAllScores(current_score, best_score_user) {
    const games = getAllGames();

    let p = new Promise(resolve => {
        setTimeout(() => {
            var scores = Array(16).fill(0);
            for(var i = 0 ; i < games.length ; i++) {
                scores[games[i].score]++;
            }

            console.log(scores);
            populateScoreChart(scores, current_score, best_score_user);
        }, 500);
        resolve(games);
    });
}

function populateScoreChart(scores, score_user, best_score_user) {
    var tester = document.getElementById('score_chart');

    var labels = Array.from(Array(16).keys());
    console.log(scores);
    var preset_scores = Array(16).fill(0);
    //preset_scores = [0, 10, 45, 73, 178, 259, 341, 274, 214, 152, 73, 49, 27, 10, 4, 1];
    var bar_colors = Array(16).fill("rgba(27, 100, 154, 0.7)");
    bar_colors[best_score_user] = "rgba(27, 100, 154, 1)";
    bar_colors[score_user] = "#008708";

    var stats_scores = preset_scores.map(function (num, idx) {
        return num + scores[idx];
    });

    var trace1 = {
        type: 'bar',
        x: labels,
        y: stats_scores,
        text: stats_scores.map(String),

        marker: {
            color: bar_colors,
            line: {
                color: "rgba(27, 100, 154, 1)",
                width: 1
            }
        },
    };

    var window_width = window.innerWidth;
    console.log("WW: " + window_width);
    var chart_width = 600;
    var chart_height = 300;
    if (window_width < 575) {
        chart_width = 400;
        chart_height = 300;
    } else if (window_width < 767) {
        chart_width = 500;
        chart_height = 300;
    } else if (window_width < 990) {
        chart_width = 500;
        chart_height = 300;
    }

    var data = [ trace1 ];
    var layout = {
        font: {size: 16},
        width: chart_width,
        height: chart_height,

        xaxis: {
            title: 'Score',
            tick0: 0,
            dtick: 1,
        },
        yaxis: {
            title: 'Number of People'
        },
    };

    var config = {
        responsive: true,
        displayModeBar: false,
        staticPlot: true,
        autosize: true,
    }
    Plotly.newPlot(tester, data, layout, config);


    // Calculate "you are better than x% of people!"
    const number_games_total = scores.reduce((accumulator, value) => {
        return accumulator + value;
    }, 0);
    var number_games_inferior_score = 0;
    for (var i = 0 ; i < best_score_user ; i++) {
        number_games_inferior_score += scores[i];
    }

    var percent_better_than = Math.ceil(100 * number_games_inferior_score / (number_games_total - 1));
    $("#percent_score_label").html("You did better than <strong>" + percent_better_than + "%</b> of people!");
}

export function getAllGames() {
    const db = getDatabase();

    var all_games = [];

    get(child(ref(db), `games/`)).then((snapshot) => {
        snapshot.forEach((child) => {
            all_games.push(child.val());
        });
    });

    return all_games;
}

export function getAllUsers() {
    const db = getDatabase();

    var all_users = [];

    get(child(ref(db), `users/`)).then((snapshot) => {
        snapshot.forEach((child) => {
            all_users.push(child.val());
        });
    });

    return all_users;
}

export function getUserBestScore(user_uid) {
    const db = getDatabase();

    get(child(ref(db), `users/` + user_uid + '/highest_score')).then((snapshot) => {
        console.log(snapshot.val());
    });

    return 0;
}

export function writeNewUser(username, email, score, gameKey) {
    console.log(">> writeNewUser (D)");
    const db = getDatabase();
    // A post entry.
    const userData = {
        name: username,
        email: email,
        highest_score: score
    };

    // Get a key for a new Game.
    const newKey = push(child(ref(db), 'users')).key;

    set(ref(db, 'users/' + newKey), userData)
    .then(() => {
        console.log("success");
    })
    .catch((error) => {
        console.log("error");
        console.log(error);
    });
    return newKey;
}

export function writeNewGame(user_uid, timestamp, score, expected, recalled, faces) {
    console.log(">> writeNewGame (D)");
    const db = getDatabase();

    // A post entry.
    const gameData = {
        user: user_uid,
        timestamp: timestamp,
        score: score,
        expected: expected,
        recalled: recalled,
        faces: faces
    };

    // Get a key for a new Game.
    const newGameKey = push(child(ref(db), 'games')).key;

    set(ref(db, 'games/' + newGameKey), gameData)
    .then(() => {
        console.log("success");
    })
    .catch((error) => {
        console.log("error");
        console.log(error);
    });


    // Write the new game's data simultaneously in the games list and the user's post list.
    //const updates = {};
    //updates['/games/' + newGameKey] = gameData;
    //updates['/users/' + user_uid + '/games/' + newGameKey] = gameData;

    //return update(ref(db), updates);

    return newGameKey;
}

export function writeNewSession(timestamp) {
    console.log(">> writeNewSession");
    const db = getDatabase();

    // A post entry.
    const sessionData = {
        timestamp: timestamp,
        games: 0,
    };

    // Get a key for a new Game.
    const newSessionKey = push(child(ref(db), 'sessions')).key;

    set(ref(db, 'sessions/' + newSessionKey), sessionData)
    .then(() => {
        console.log("success");
    })
    .catch((error) => {
        console.log("error");
        console.log(error);
    });

    return newSessionKey;
}

export function writeNewSessionGame(session_id, game_number, timestamp) {
    console.log(">> writeNewSessionGame");
    const db = getDatabase();

    // A post entry.
    const game_data = {
        session: session_id,
        game_number: game_number,
        phase: 0,
        score: -1,
        clicks: {},
        timestamp: timestamp,
    };

    // Get a key for a new Game.
    //const newSessionKey = push(child(ref(db), 'sessions')).key;
    const new_game_id = session_id + "-" + String(game_number).padStart(2, '0');

    set(ref(db, 'games/' + new_game_id), game_data)
    .then(() => {
        console.log("success");
    })
    .catch((error) => {
        console.log("error");
        console.log(error);
    });

    const updates = {};
    updates['/sessions/' + session_id + '/games'] = game_number;
    update(ref(db), updates);

    return new_game_id;
}

export function updateGame(session_id, game_number, phase, score) {
    console.log(">> updateGame");
    const db = getDatabase();

    const game_data = {
        phase: phase,
        score: score,
    };

    var game_id = session_id + "-" + String(game_number).padStart(2, '0');

    const updates = {};
    updates['/games/' + game_id] = game_data;

    return update(ref(db), updates);
}

export function updateGameClicks(session_id, game_number, button_label) {
    console.log(">> updateGameClicks");
    const db = getDatabase();

    var game_id = session_id + "-" + String(game_number).padStart(2, '0');

    const updates = {};
    updates['/games/' + game_id + '/clicks/' + button_label] = true;
    return update(ref(db), updates);
}
