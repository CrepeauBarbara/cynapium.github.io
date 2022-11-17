import { writeNewGame, updateUser, getAllScores } from "./firebase.js"

var people = [];

// 0: Memorization ; 1: Recall ; 2: Results
var phase = 0;

var nb_faces = 15;
var counter_mem = 3;
var counter_recall = 300;

/**
 * Initialize the memorization data. Called at the end of this file, when
 * the document is ready.
 */
function initMemorization() {
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

    $("#getStarted").click(function() {
        initMemorization();
        getStarted(-1);
    });
}

/**
 * Update the view of people with their image and their name.
 * @people_list list<map<str, str>> - Array of people's name and face.
 */
function updatePeopleView(people_list) {
    for (var i = 0 ; i < nb_faces ; i++) {
        $( "#p" + i ).find($("img")).attr('src', people_list[i]["face"]);
        $( "#p" + i ).find($(".person_name div")).text(people_list[i]["name"]);
    }
}

/**
 * Start the memorization phase with timer. Called from "Get Started" button in
 * instructions panel.
 * @counter_value int - Timeout counter in seconds
 */
function getStarted(counter_value) {
    startInterval();
    if (counter_value > 0) {
        counter = counter_value;
    }
    prettyPrintTimer();
    $( "#instructions" ).hide();
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

/**
 * Start the recall phase by reseting the timer to 300 seconds, shuffling the
 * people and replacing all of their names by input fields.
 */
function startRecall() {
    phase = 1;
    // Shuffle people
    shuffle(people);
    updatePeopleView(people);

    // Switch the labels to input and give focus to the first one
    $( ".person_name div" ).html("<input type='text' data-lpignore='true' value=''/>")
    $( "#first input" ).focus();

    // Update the timer
    $( ".title" ).html("Recall");
    getStarted(counter_recall);

    // Init button to check results before end of timer
    $("#btn_results").show();
    $("#btn_results").click(function(e) {
        checkResults();
    });
}

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
        var expected_name_normalized = expected_name.normalize('NFD').replace(/\p{Diacritic}/gu, "");
        var recalled_name_normalized = recalled_name.normalize('NFD').replace(/\p{Diacritic}/gu, "");
        if (expected_name_normalized.toLowerCase() == recalled_name_normalized.toLowerCase()) {
            person_item.addClass("result_success");
            score++;
        } else {
            person_item.addClass("result_failure");
            person_item.append("<div class='person_name reveal_hover'><div class='expected_response'>" + expected_name + "</div></div>");
        }
    }

    var timestamp = Math.floor(Date.now() / 1000);
    var gameKey = writeNewGame("u0", timestamp, score, all_expected, all_recalled, all_faces);

    // Update view
    $("#results_container").show();
    $("#score_label").html("Score: " + score + "/" + nb_faces);
    $("#update_user").click(function(e) {
        updateUser($("#user_name").val(), $("#user_email").val(), score, gameKey);
        return false;
    });
    getAllScores(score);
}

function str_pad_left(string,pad,length) {
    return (new Array(length+1).join(pad)+string).slice(-length);
}

var counter = counter_mem;
var timer = null;


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
    timer = setInterval(function(){

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
    }, 1000);
}
function stopInterval() {
    clearInterval(timer);
}


$( document ).ready(function() {
    $( "#results_container" ).hide();
    initMemorization();
});
