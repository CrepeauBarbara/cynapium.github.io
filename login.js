import {
	getUserPassword,
    loadSchedule,
    updateRecords,
    getUserByCookie
} from "./firebase.js"

import {
    submitContestation,
	submitResultCode
} from "./memory.js"

const login_cookie_name = "french_memory_open_2023";

/**
 *
 *
 */
function check_authentification() {
    let login_cookie = getLoginCookie();
    if (login_cookie == "" || login_cookie == null) {
        return false;
    }

    getUserByCookie(login_cookie);
}

/**
 *
 *
 */
function login() {
    var user_name = document.getElementById("login_username").value;
	var password_entered = md5(document.getElementById("login_password").value);
	getUserPassword(user_name, password_entered);
}

function logout() {
    eraseCookie();
    location.reload();
}

/**
 *
 *
 */
export function check_login(password_entered, user_record) {
	console.log("========== check_login()");
    // Check if the password is correct
    console.log("pwd: "+ user_record.password.trim());
    console.log("pwd: "+ password_entered.trim());
    if (user_record.password.trim() == password_entered.trim()) {
        user_login(user_record, true);
    } else {
        // If login failed, let the user know
        let login_pwd = document.getElementById("login_password");
        login_pwd.classList.add("wrong_password");
    }
}

/**
 *
 * @param {Bool} set_cookie -
 */
export function user_login(user_record, set_cookie) {
	console.log("========== user_login()");
    // Hide login pop-up and button.
    hide_login_popup();
    document.getElementById("show_login_btn").style.display='none';

    // Show the competitor info.
    document.getElementById("competitor_info").style.display='';
    document.getElementById("competitor_name").innerHTML = user_record.name;

    // If necessary, create a cookie to persist the login session.
    if (set_cookie) {
        setLoginCookie(user_record.cookie);
    }

    // If the user is an admin, update the view.
    if (user_record.admin) {
        switchToAdminView();
    } else {
        $('#submit_result_code').unbind('click').click(function() {
            submitResultCode($(this).val());
            return false;
        });
    }
}

function setLoginCookie(cookie_value) {
  const expiration_date = new Date();
  expiration_date.setTime(expiration_date.getTime() + (3 * 24 * 60 * 60 * 1000));
  let expires = "expires="+ expiration_date.toUTCString();
  document.cookie = login_cookie_name + "=" + cookie_value + ";" + expires + ";path=/";
}
function getLoginCookie() {
  let name = login_cookie_name + "=";
  let decodedCookie = decodeURIComponent(document.cookie);
  let ca = decodedCookie.split(';');
  for(let i = 0; i <ca.length; i++) {
    let c = ca[i];
    while (c.charAt(0) == ' ') {
      c = c.substring(1);
    }
    if (c.indexOf(name) == 0) {
      return c.substring(name.length, c.length);
    }
  }
  return "";
}
function eraseCookie() {
    document.cookie = login_cookie_name+'=; Max-Age=-99999999;';
}

function show_login_popup() {
	document.getElementById('login_popup').style.display='block';
}
function hide_login_popup() {
	document.getElementById('login_popup').style.display='none';
}

/**
 * Update the page display to allow update of times, names and link of events.
 */
function switchToAdminView() {
    // For each event time, create an input with the time value.
    jQuery('.event_time span:first-child').each(function() {
        $(this).replaceWith(
            '<input class="event_admin_input event_time_input" type="text" value="' + $(this).html() + '">'
        );
    });

    // For each event name, replace the link by an input with the event name.
    jQuery('.event_name a:first-child').each(function() {
        $(this).replaceWith(
            '<input class="event_admin_input" type="text" value="' + $(this).html() + '">'
        );
    });

    // For each event link, replace the link by an input with the link value.
    // If the link doesn't exist yet, leave it blank.
    jQuery('.event_link a:first-child').each(function() {
        let link = $(this).attr('href') || "";
        $(this).replaceWith(
            '<input class="event_admin_input" type="text" value="' + link + '">'
        );
    });

    // Add change and paste action listeners to change the class of the input,
    // letting the admin know that a change was made for this event.
    $(".event_admin_input").on('input', function () {
        $(this).addClass('admin_input_changed');
    });

    // Update the competitor info area to remove the result code input and
    // change the submit button to update the database with the changes.
    $('#event_result_code').remove();
    $('#competitor_info button').replaceWith(
        '<button type="submit" class="validate_admin_changes">Validate Changes</button>'
    );
    $('.validate_admin_changes').click(validateAdminChanges);
}

function validateAdminChanges() {
    //
    const event_updates = {};
    console.log("========== validateAdminChanges");

    $('.admin_input_changed').each(function(e) {
        let event_id = $(this).closest('tr').attr("id");
        let event_field_id = $(this).closest('td').attr("class").substring(6);
        console.log('/events/' + event_id + '/' + event_field_id + " = " + $(this).val());
        event_updates['/events/' + event_id + '/' + event_field_id] = $(this).val();
    });

    updateRecords(event_updates);


    // Remove the style class that indicates change on the input.
    $('.event_admin_input').removeClass('admin_input_changed');
}


/******************************************************************************
 *                             WHEN DOCUMENT READY                            *
 ******************************************************************************/

$( document ).ready(function() {
    // Bind all the login functions to the login buttons.
    $("#show_login_btn").unbind('click').click(function() {
        show_login_popup();
        return false;
    });
    $("#login_btn").unbind('click').click(function() {
        login();
        return false;
    });
    $("#cancel_btn").unbind('click').click(function() {
        hide_login_popup();
        return false;
    });
    $("#logout_link").unbind('click').click(function() {
        logout();
        return false;
    });

    $("#close_contestation").unbind('click').click(function() {
        $("#contestation_form").hide();
        $('#contestation_info').html('');
        return false;
    });
    $("#submit_contestation").unbind('click').click(function() {
        submitContestation();
        return false;
    });

    // Load and display the schedule on the page
    loadSchedule();

    // Check if there is a login cookie on this browser, in which case we can
    // skip the login phase and consider the user already authenticated.
    check_authentification();
});
