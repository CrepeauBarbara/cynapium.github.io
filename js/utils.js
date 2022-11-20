import {
    //writeNewGame,
    //updateUser,
    getAllScores,
    writeNewSession,
    writeNewSessionGame,
    updateGame,
    updateGameClicks,
} from "./firebase.js"

var people = [];

// 0: Memorization ; 1: Recall ; 2: Results
var phase = 0;

var nb_faces = 15;
var COUNTER_MEMORIZATION_PHASE = 30;
var COUNTER_RECALL_PHASE = 120;

var session_id = -1;
var game_counter = 0;
var best_session_score = -1;
var score_bracket = -1;
var clipboard = undefined;

/******************************************************************************
 *                                 INTRO PHASE                                *
 ******************************************************************************/

 function startGame() {
    // Write new session to database
    var timestamp = Math.floor(Date.now() / 1000);
    session_id = writeNewSession(timestamp);

    // Add click listener on "Get Started"
    $("#linkGetStarted").unbind('click').click(function() {
        startMemorizing();
        $("#shareable_text").text($("#shareable_text").text().replace("[score]", "5"));
        $("#shareable_text").text($("#shareable_text").text().replace("[score_bracket]", "52"));
        console.log("replaced!");
    });

    //
    initMemorization();
 }

/**
 * Initialize the memorization data. Called at the end of this file, when
 * the document is ready.
 */
function initMemorization() {
    console.log("> initMemorization");
    // Show instructions if it was hidden
    $( "#instructions" ).show();
    $( ".title" ).html("Memorization");
    $( "#timer" ).show();

    $( "#results_container" ).hide();
    $(".person_item").css({ opacity: 0 });

    // Kill the clipboard listener from previous games
    if (clipboard !== undefined) { clipboard.destroy(); }

    // Shuffle arrays to get names, faces and genders in random order
    shuffle(FR_female_names);
    shuffle(FR_male_names);
    shuffle(female_faces);
    shuffle(male_faces);
    shuffle(genders);

    // Get informations of all generated people
    people = [];
    for (var i = 0 ; i < nb_faces ; i++) {
        if (genders[i] == "F") {
            var person_name = FR_female_names[i];
            var person_id = String(female_faces[i]).padStart(3, '0');
            var person_face = 'images/faces/females/' + genders[i] + "-" + person_id + ".jpeg";
        } else {
            var person_name = FR_male_names[i];
            var person_id = String(male_faces[i]).padStart(3, '0');
            var person_face = 'images/faces/males/' + genders[i] + "-" + person_id + ".jpeg";
        }

        people.push({"uid": person_id, "face": person_face, "name": person_name});
    }
    // Update view
    updatePeopleView(people);
}

/**
 * Update the view of people with their image and their name.
 * @people_list list<map<str, str>> - Array of people's name and face.
 */
function updatePeopleView(people_list) {
    for (var i = 0 ; i < nb_faces ; i++) {
        var person_item = $( "#p" + i );
        person_item.removeClass("result_success");
        person_item.removeClass("result_failure");

        person_item.find($("img")).attr('src', people_list[i]["face"]);
        person_item.find($(".person_name div")).text(people_list[i]["name"]);

        $(".reveal_hover").remove();
    }
}


/******************************************************************************
 *                              MEMORIZATION PHASE                            *
 ******************************************************************************/

 /**
  * Start the recall phase by reseting the timer to 300 seconds, shuffling the
  * people and replacing all of their names by input fields.
  */
function startMemorizing() {
    console.log("> startMemorizing");
    phase = 0;
    // Update game phase
    game_counter++;
    var timestamp = Math.floor(Date.now() / 1000);
    var game_id = writeNewSessionGame(session_id, game_counter, timestamp);

    // Start the timer
    getStarted(COUNTER_MEMORIZATION_PHASE);

    // Show faces and hide instructions
    $(".person_item").css({ opacity: 1 });
    $( "#instructions" ).hide();
}


/******************************************************************************
 *                                RECALL PHASE                                *
 ******************************************************************************/

/**
 * Start the recall phase by reseting the timer to 300 seconds, shuffling the
 * people and replacing all of their names by input fields.
 */
function startRecall() {
    console.log("> startRecall");
    // Update the game's phase
    phase = 1;
    updateGame(session_id, game_counter, phase, -1);

    // Shuffle people and update the view
    shuffle(people);
    updatePeopleView(people);

    // Switch the labels to input and give focus to the first one
    $( ".person_name div" ).html("<input type='text' data-lpignore='true' value=''/>")
    $( "#first input" ).focus();

    // Update the timer
    $( ".title" ).html("Recall");
    getStarted(COUNTER_RECALL_PHASE);

    // Init button to check results before end of timer
    $("#btn_results").show();
    $("#linkCheckResults").unbind('click').click(function(e) {
        updateGameClicks(session_id, game_counter, "Results");
        checkResults();
    });
}

/******************************************************************************
 *                                RESULTS PHASE                               *
 ******************************************************************************/

/**
 * End the recall phase and check the results.
 */
function checkResults() {
    phase = 2;

    // Update title, hide timer & button "check results"
    $( ".title" ).html("Results");
    reset();
    $("#timer").hide();
    $("#btn_results").hide();
    $("#text_results").show();
    $("#shared").hide();

    var all_expected = [];
    var all_recalled = [];
    var all_faces = [];
    var score = 0;

    for (var i = 0 ; i < nb_faces ; i++) {
        var person_item = $("#p" + i);
        var expected_name = people[i]["name"];
        var recalled_name = person_item.find(".person_name input").val();

        //
        all_expected.push(expected_name);
        all_recalled.push(recalled_name);
        all_faces.push(people[i]["uid"]);

        // Put the right names
        if (recalled_name == "") {
            recalled_name = "&nbsp;";
        }
        person_item.find(".person_name div").html(recalled_name);

        // Get result and add recalled incorrect name in hover
        var expected_name_normalized = expected_name.normalize('NFD').replace(/\p{Diacritic}/gu, "").trim();
        var recalled_name_normalized = recalled_name.normalize('NFD').replace(/\p{Diacritic}/gu, "").trim();
        if (expected_name_normalized.toLowerCase() == recalled_name_normalized.toLowerCase()) {
            person_item.addClass("result_success");
            score++;
        } else {
            person_item.addClass("result_failure");
            person_item.append("<div class='person_name reveal_hover'><div class='expected_response'>" + expected_name + "</div></div>");
        }
    }

    // Display best score
    if (best_session_score < score) {
        best_session_score = score;
    }
    $("#best_score_label").html(best_session_score);

    // Update the game's phase
    updateGame(session_id, game_counter, phase, score);

    getAllScores(score, best_session_score);

    clipboard = new ClipboardJS('#linkShare', {
            text: function (trigger) {
                return `Are you great with faces? Try to beat my score of ` + best_session_score + ` &#x1F9D1 at http://memory-challenge.com!`;
            },
        });

    //var timestamp = Math.floor(Date.now() / 1000);
    //var gameKey = writeNewGame("u0", timestamp, score, all_expected, all_recalled, all_faces);

    // Update view
    $("#results_container").show();
    $("#score_label").html("Score: " + score + "/" + nb_faces);
    $("#update_user").unbind('click').click(function(e) {
        updateUser($("#user_name").val(), $("#user_email").val(), score, gameKey);
        return false;
    });
    $("#linkImprove").unbind('click').click(function(e) {
        updateGameClicks(session_id, game_counter, "Improve");
        initMemorization();
    });
    $("#linkShare").unbind('click').click(function(e) {
        share();
        updateGameClicks(session_id, game_counter, "Share");
    });
}

function share() {
    $("#shared").show();
}

/******************************************************************************
 *                                   UTILS                                    *
 ******************************************************************************/

function str_pad_left(string,pad,length) {
    return (new Array(length+1).join(pad)+string).slice(-length);
}

var counter = COUNTER_MEMORIZATION_PHASE;
var timer = null;

/**
 * Start the memorization phase with timer. Called from "Get Started" button in
 * instructions panel.
 * @counter_value int - Timeout counter in seconds
 */

function getStarted(counter_value) {

    // Start the timer
    startInterval();
    if (counter_value > 0) {
        counter = counter_value;
    }
    prettyPrintTimer();
}

function prettyPrintTimer() {
    var minutes = Math.floor(counter / 60);
    var seconds = counter - minutes * 60;
    var counter_label = str_pad_left(minutes, '0', 2) + ':' + str_pad_left(seconds, '0', 2);
    $("#timer").html(counter_label);
}

function reset() {
    clearInterval(timer);
    counter = 0;
}

function startInterval() {
    timer = setInterval(
        function() {
            counter--;
            prettyPrintTimer();

            if (counter == 0) {
                reset();
                if (phase == 0) {
                    startRecall();
                } else if (phase == 1) {
                    checkResults();
                }
            }
        },
        1000
    );
}
function stopInterval() {
    clearInterval(timer);
}

/**
 * Shuffle the given array.
 */
function shuffle(array) {
  let currentIndex = array.length,  randomIndex;

  // While there remain elements to shuffle.
  while (currentIndex != 0) {

    // Pick a remaining element.
    randomIndex = Math.floor(Math.random() * currentIndex);
    currentIndex--;

    // And swap it with the current element.
    [array[currentIndex], array[randomIndex]] = [
      array[randomIndex], array[currentIndex]];
  }

  return array;
}

function copyToClipboard(copyText) {
}

/******************************************************************************
 *                             WHEN DOCUMENT READY                            *
 ******************************************************************************/

$( document ).ready(function() {
    // Hide result container
    $( "#results_container" ).hide();

    // Intialize all the memorization phase in advance
    startGame();
    copyToClipboard("Shared!");
});
