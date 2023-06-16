import { addScore, addWordContestation } from "./firebase.js"

// JavaScript source code
const competitors = [
    {name: "Barbara Crepeau", username: "bcrepeau", password: "test"},
];

// Keep track of which event the user wants to submit the next code to.
// See functions selectEventForSubmission and submitResultCode.
var current_event = null;

/**
 *
 *
 *
 */
export function submitContestation() {
    console.log("submitContestation()");

    let username = $('#competitor_name').html();
    let errors = [];

     // Submit result code
    let language = $('#contestation_language').val();
    if (language == "") {
        // TODO error message
        errors.push("- Select a language.");
    }

    let word_indexes = $('#contestation_indexes').val();
    if (word_indexes == "") {
        // TODO error message
        errors.push("- Specify the contested word indexes.");
    }

    let comments = $('#contestation_comments').val();

    let screenshots = [
        $('#contestation_screenshot_1').val() || "",
        $('#contestation_screenshot_2').val() || ""
    ];
    if (screenshots[0] == "" && screenshots[1] == "") {
        // TODO error message
        errors.push("- Provide one or more screenshot links.");
    }
    if (errors.length > 0) {
        let error_message = errors.join('<br/>');
        $('#contestation_info').html(
            "<b>Please fix the following errors:</b><br/>" +
            error_message
        );
        $('#contestation_info').addClass("msg_error");
    } else {
        addWordContestation(
            username,
            language,
            word_indexes,
            comments,
            screenshots
        );

        $('#contestation_info').html(
            "<b>Your contestation was submitted!</b><br/>" +
            "You can now close the word contestation form."
        );
        $('#contestation_info').removeClass("msg_error");
    }
};

/**
 *
 *
 *
 */
export function submitResultCode() {
    console.log("submitResultCode()");

    // Check if an event was selected.
    if (current_event == null) {
        console.log("error 1");
        $('#event_result_info').fadeTo(0, 0);
        $('#event_result_info').addClass("msg_error");
        $('#event_result_info').html(
            "<b>Error:</b> Please select an event and paste your result code in the input above."
        );
        $('#event_result_info').fadeTo("slow", 1);
        return false;
    }

     // Check if a result code was pasted in the input
    let result_code = $('#event_result_code').val();
    if (result_code == "") {
    $('#event_result_info').fadeTo(0, 0);
        $('#event_result_info').addClass("msg_error");
        $('#event_result_info').html(
            "<b>Error:</b> Please paste your result code in the input above."
        );
        $('#event_result_info').fadeTo("slow", 1);
        return false;
    }

    // Get the username and send the score to the database.
    let username = $('#competitor_name').html();
    addScore(username, current_event, result_code);

    // Display a success message.
    $('#event_result_info').fadeTo(0, 0);
    $('#event_result_info').removeClass("msg_error");
    $('#event_result_info').html(
        "Your result code was submitted for the event \"" + current_event + "\""
    );
    $('#event_result_info').fadeTo("slow", 1);
    $('#event_result_info').delay(5000).fadeTo(1500, 0.5);

    // Reset the current event and placeholder
    current_event = null;
    $('#event_result_code').val("");
    $('#event_result_code').attr("placeholder", "Click on event to submit code");
};

/**
 * Listener for event name links which changes the placeholder of the code
 * submission input. It will allow us to submit the code for the event they
 * selected.
 *
 * @param {string} event_key  - Key of the event the user clicked on
 * @param {string} event_name - Name of the event the user clicked on
 */
function selectEventForSubmission(event_key, event_name) {
    // Update the placeholder
    let code_input = document.getElementById("event_result_code");
    if (code_input) {
        code_input.placeholder = "Code for " + event_name;
        code_input.value = "";
    }
    // Remember this event name for code submission
    current_event = event_name;

    if (event_key == "words" && $('#competitor_name').html() !== "") {
        $('#contestation_form').show();
    }
};

/**
 * Display the competition schedule in two tables on the page

 * @param {Array{Map[Str, Object]} schedule - An array of maps where key is the
 *              event's record id and the value is the record object containing:
*               - a day (1 or 2)
*               - a time (in 24h format, 00:00)
*               - an IAM link to the event
*               - a name
*               The array should be sorted by time.
 */
export function displayScheduleData(schedule) {
    console.log("displayScheduleData(schedule: " + schedule.length + " elements)");
    let event_id = 0;

    schedule.forEach(function callback(event, index) {

        // Kind of hacky but eh this will do for now.
        let is_event = ! (event.val.event === false);

        // Figure out which day the event takes place. If the value is different
        // from 1 or 2, the event will be assigned to the second day on the table.
        // Add the new row to the releval tbody element.
        let day = (event.val.day > 0 || event.val.day <= 2) ? event.val.day : 2;
        let row = document.getElementById("table_schedule_day_" + day).insertRow();
        row.id = event.key;
        if (!is_event) {
            row.classList.add("not_an_event");
        }

        // Add the time to the table - The array should already be sorted
        let event_time_elt = row.insertCell(0);
        event_time_elt.classList.add("event_time");
        // Ugly hack to say that if an event has a '.', it's not an event, it's
        // an indication for the start of the day or a break so no need to
        // display the time / order.
        if (is_event) {
            event_time_elt.innerHTML = '<span class="hide">' + event.val.time + '</span>';
        } else {
            event_time_elt.innerHTML = '<span>' + event.val.time + '</span>';
        }

        // Add the name of the event with the event_submit class, which will allow
        // us to know which event we are submitting when a code is sent.
        let event_name_elt = row.insertCell(1);
        event_name_elt.classList.add("event_name");
        event_name_elt.style.textAlign = "left";
        event_name_elt.id = 'event' + index;
        event_name_elt.addEventListener("click", function() {
            selectEventForSubmission(event.key, event.val.name);
        });
        if (is_event) {
            event_name_elt.innerHTML = '<a class="event_submit" id="link' + index + '" href="#">' + event.val.name + '</a>';
        } else {
            event_name_elt.colSpan = "2";
            event_name_elt.innerHTML = '<span class="event_label">' + event.val.name + '</span>';
        }

        // Add the link if it exists and open it in a new tab. If it doesn't exist,
        // grey out the link.
        if (is_event) {
            let event_link_elt = row.insertCell(2);
            event_link_elt.classList.add("event_link");
            if (event.val.link !== "" && event.val.link !== undefined) {
                event_link_elt.innerHTML = '<a target="_blank" href=\"' + event.val.link + '\">Link</a>';
            } else {
                event_link_elt.innerHTML = '<a></a>';
            }
        }
    });
};


//TODO updateResultCodePlaceholder();
