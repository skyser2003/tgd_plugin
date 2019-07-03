import { AttendanceChecker } from "./attendance_checker.js";

// Const variables
const log = chrome.extension.getBackgroundPage() ? chrome.extension.getBackgroundPage()!.console.log : console.log;
const error = chrome.extension.getBackgroundPage() ? chrome.extension.getBackgroundPage()!.console.error : console.error;

// Initialize
const button = document.getElementById("button");
const attendMessageInput = document.getElementById("attend_message") as HTMLInputElement;

button!.onclick = (ev) => {
    let message = attendMessageInput.value;
    if (message.length === 0) {
        message = AttendanceChecker.defaultAttendMessage;
    }

    AttendanceChecker.submit(message);
};

attendMessageInput.placeholder = AttendanceChecker.defaultAttendMessage;

AttendanceChecker.updateAttendHtml();
AttendanceChecker.getSyncAttendMessage()
    .then(attendMessage => {
        attendMessageInput.value = attendMessage;
        AttendanceChecker.updateAttendHtml();
    });