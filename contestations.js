import { loadContestations } from "./firebase.js"

/**
 * Given an array of contestations coming from the db, display them in the table
 * and create the language filter dropdown.
 * @param { [contestation db object] } contestations
 */
export function displayContestationData(contestations) {
    console.log("displayContestationData(contestations: " + contestations.length + " elements)");
    let event_id = 0;
    let contestationsTable = document.getElementById("contestationsTable");
    let allLanguages = new Set();

    // Populate the contestation table
    contestations.forEach(function callback(contestation, index) {
        let row = contestationsTable.insertRow();
        row.id = contestation.language;

        allLanguages.add(contestation.language);

        let contestationUser = row.insertCell(0);
        contestationUser.innerHTML = "<b>" + contestation.user + "</b><br/>" + contestation.language;

        let contestationIndexes = row.insertCell(1);
        contestationIndexes.innerHTML = contestation.word_indexes;

        let contestationComment = row.insertCell(2);
        contestationComment.innerHTML = contestation.comments;

        let contestationScreenshots = row.insertCell(3);
        let links = "";
        contestation.screenshots.forEach(link => links += "<a target='_blank' href='" + link + "'>" + link + "</a><br/>");
        contestationScreenshots.innerHTML = links;
    });

    // Update the filter with the languages
    allLanguages.forEach(key => {
        $('#languageFilter').append($('<option>', {
            value: key,
            text : key
        }));
    });
}

/**
 * Only display contestations in the given languages
 * @param {string} language - Name of the chosen language to filter on
 */
function filterByLanguage(language) {
    console.log("filterByLanguage(" + language + ")");

    $('tr').each(function() {
        if (language !== "all" && this.id !== "" && this.id !== language) {
            this.hidden = true;
        } else {
            this.hidden = false;
        }
    });
}


/******************************************************************************
 *                             WHEN DOCUMENT READY                            *
 ******************************************************************************/

$( document ).ready(function() {

    $('#languageFilter').on('change', function() {
        filterByLanguage(this.value);
    });

    // Load and display the contestations on the page
    loadContestations();
});
