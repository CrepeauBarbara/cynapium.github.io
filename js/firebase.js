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

/*
export function getAllScores() {
    const users = getAllUsers();
        console.log("==============");

    let p = new Promise(resolve => {
        setTimeout(() => {
            var scores = {};
            for(var i = 0 ; i < users.length ; i++) {
                if (scores[users[i].highest_score] === undefined) {
                    scores[users[i].highest_score] = [];
                }
                scores[users[i].highest_score].push(users[i].name);
            }

            console.log(JSON.stringify(scores));
            $("#scoreboard").html("scoreboard: " + JSON.stringify(scores));
        }, 500);
        resolve(users);
    });
}
*/

export function getAllScores(current_score) {
    const games = getAllGames();
    console.log("==============");
                console.log(games);

    let p = new Promise(resolve => {
        setTimeout(() => {
            var scores = Array(16).fill(0);
            for(var i = 0 ; i < games.length ; i++) {
                scores[games[i].score]++;
            }

            console.log(scores);
            populateScoreChart(scores, current_score);
        }, 1000);
        resolve(games);
    });
    console.log("==============");
}

function populateScoreChart(scores, score_user) {
    var tester = document.getElementById('score_chart');

    var labels = Array.from(Array(16).keys());
    scores = [10, 21, 136, 341, 508, 690, 530, 420, 304, 146, 98, 75, 55, 20, 8, 1]
    var bar_colors = Array(16).fill("rgba(27, 100, 154, 0.7)");
    bar_colors[score_user] = "#008708";

    var trace1 = {
        type: 'bar',
        x: labels,
        y: scores,

        marker: {
          color: bar_colors,
          line: {
              color: "rgba(27, 100, 154, 1)",
              width: 1
          }
      },
    };

    var data = [ trace1 ];
    var layout = {
        font: {size: 16},
        width: 600,
        height: 310,
    };

    var config = {
        responsive: true,
        displayModeBar: false
    }
    Plotly.newPlot(tester, data, layout, config);
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
