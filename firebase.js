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
	check_login,
    user_login
} from "./login.js";

import {
    displayScheduleData
} from "./memory.js";

import {
    displayContestationData
} from "./contestations.js"


// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyBYQIhx0CCVmwv6Hl7R62TfMmmFnHn6q9o",
  authDomain: "asmemoire-9da2a.firebaseapp.com",
  databaseURL: "https://asmemoire-9da2a-default-rtdb.europe-west1.firebasedatabase.app",
  projectId: "asmemoire-9da2a",
  storageBucket: "asmemoire-9da2a.appspot.com",
  messagingSenderId: "39222709500",
  appId: "1:39222709500:web:3445a47bcd34c910461b79"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const database = getDatabase(app);


export function getUserPassword(username, password_entered) {
	console.log("========== getUserPassword(" + username + ")");

	get(child(ref(database), `users/` + username)).then((snapshot) => {
		if (snapshot.exists()) {
			// Check passwords
			check_login(password_entered, snapshot.val());
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
            user_login(userRecords[0], false);
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
    let timestamp = dt.toLocaleDateString('us-US')  + " " +
            addZeroBefore(2, dt.getHours()) + ":" +
            addZeroBefore(2, dt.getMinutes()) + ":" +
            addZeroBefore(2, dt.getSeconds()) + ":" +
            addZeroBefore(3, dt.getMilliseconds());

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
