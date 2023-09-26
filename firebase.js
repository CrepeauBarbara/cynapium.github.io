// Import the functions you need from the SDKs you need
import { initializeApp } from "https://www.gstatic.com/firebasejs/9.14.0/firebase-app.js";
import { getAnalytics } from "https://www.gstatic.com/firebasejs/9.14.0/firebase-analytics.js";

// SDKs for Firebase products that you want to use
// See: https://firebase.google.com/docs/web/setup#available-libraries
import {
    child,
    equalTo,
    getDatabase,
    get,
    onValue,
    orderByChild,
    push,
    query,
    ref,
    set,
    update
} from 'https://www.gstatic.com/firebasejs/9.14.0/firebase-database.js';

import {
	checkLogin,
    userLogin
} from "./login.js";

import {
    displayScheduleData
} from "./memory.js";

import {
    displayContestationData
} from "./contestations.js"


// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: /* apiKey */,
  authDomain: /* authDomain */,
  databaseURL: /* databaseURL */,
  projectId: /* projectId */,
  storageBucket: /* storageBucket */,
  messagingSenderId: /* messagingSenderId */,
  appId: /* appId */
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const database = getDatabase(app);


export function getUserPassword(username, password_entered) {
	console.log("========== getUserPassword(" + username + ")");

	get(child(ref(database), `users/` + username)).then((snapshot) => {
		if (snapshot.exists()) {
			// Check passwords
			checkLogin(password_entered, snapshot.val());
		} else {
			console.log("No data available");
		}
	}).catch((error) => {
		console.error(error);
	});
};

export function loadSchedule() {
	console.log("========== loadSchedule()");
    const scheduleRef = query(ref(database, 'events/'), orderByChild('time'));

	get(scheduleRef).then((snapshot) => {
		if (snapshot.exists()) {
            var schedule = [];
            snapshot.forEach(function(childSnapshot) {
                schedule.push({
                    key: childSnapshot.key,
                    val: childSnapshot.val()
                });
            });

            displayScheduleData(schedule);
		} else {
			console.log("No data available");
		}
	}).catch((error) => {
		console.error(error);
	});
};

export function loadContestations() {
	console.log("========== loadContestations()");
    const contestationsRef = query(ref(database, 'contestations/'), orderByChild('language'));

	get(contestationsRef).then((snapshot) => {
		if (snapshot.exists()) {
            var contestations = [];
            snapshot.forEach(function(childSnapshot) {
                contestations.push(childSnapshot.val());
            });

            displayContestationData(contestations);
		} else {
			console.log("No data available");
		}
	}).catch((error) => {
		console.error(error);
	});
};

export function getUserByCookie(cookie) {
	console.log("========== getUserByCookie(" + cookie + ")");
    const userRef = query(ref(database, 'users/'), orderByChild('cookie'), equalTo(cookie));
    let userRecords = [];

	get(userRef).then((snapshot) => {
		if (snapshot.exists()) {
            snapshot.forEach(function(childSnapshot) {
                userRecords.push(childSnapshot.val());
            });
		} else {
			console.log("No data available");
		}

        if (userRecords.length == 1) {
            userLogin(userRecords[0], false);
        }
	}).catch((error) => {
		console.error(error);
	});

}

export function updateRecords(updates) {
    return update(ref(database), updates);
}
function addZeroBefore(i, n) {
    if (i >= 2)
        n = (n < 10 ? '0' : '') + n;
    if (i >= 3)
        n = (n < 100 ? '0' : '') + n;
    return n;
}

export function addScore(user_name, event_name, result_code) {
    let dt = new Date();
    let timestamp = dt.toISOString();

    const score_data = {
        user: user_name,
        event: event_name,
        code: result_code,
        timestamp: timestamp
    };
    console.log(score_data);

    const score_key = push(child(ref(database), 'scores/')).key;
    console.log(score_key);
    const updates = {};
    updates['scores/' + score_key] = score_data;
    return update(ref(database), updates);
}

function updateScoreDate() {
    const scoresRef = query(ref(database, 'scores/'));
    let scoresRecords = [];

	get(scoresRef).then((snapshot) => {
		if (snapshot.exists()) {
            snapshot.forEach(function(childSnapshot) {
                scoresRecords.push({key: childSnapshot.key, val: childSnapshot.val()});
            });
		} else {
			console.log("No data available");
		}

        if (scoresRecords.length > 0) {
            updateScoreDateISO(scoresRecords);
        }
	}).catch((error) => {
		console.error(error);
	});
}

function updateScoreDateISO(scores) {
    var updates = {}
    for (var i in scores) {
        var score = scores[i];
        //score.timestamp = "2023-06-30T05:00:00.001Z";
        updates["scores/" + score.key + "/timestamp"] = "2023-06-30T05:00:00.001Z"
    }
    return update(ref(database), updates);
}



export function addWordContestation(
    user_name,
    language,
    word_indexes,
    comments,
    screenshots
) {
    let dt = new Date();
    let timestamp = dt.toLocaleDateString('fr-FR')  + " " + dt.getHours() + ":" + dt.getMinutes() + ":" + dt.getSeconds();
    const contestation_data = {
        user: user_name,
        language: language,
        word_indexes: word_indexes,
        comments: comments,
        screenshots: screenshots,
        timestamp: timestamp
    };
    console.log(contestation_data);

    // Write to database
    const contestation_key = push(child(ref(database), 'contestations/')).key;
    console.log(contestation_key);
    const updates = {};
    updates['contestations/' + contestation_key] = contestation_data;
    return update(ref(database), updates);
}

function createUser(name, login, password, md5_password, md5_cookie) {
    const user_data = {
        name: name,
        password: md5_password,
        cookie: md5_cookie,
        admin: false
    };

    const updates = {};
    updates['users/' + login] = user_data;
    return update(ref(database), updates);
}
function createAdmin(name, login, password, md5_password, md5_cookie) {
    const user_data = {
        name: name,
        password: md5_password,
        cookie: md5_cookie,
        admin: true
    };

    const updates = {};
    updates['users/' + login] = user_data;
    return update(ref(database), updates);
}
