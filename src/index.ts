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

    AttendanceChecker.submit(message)
        .then(() => {
            AttendanceChecker.updateAttendHtml();
        });
};

attendMessageInput.placeholder = AttendanceChecker.defaultAttendMessage;

// Check attendance on html load
async function attend() {
    const tgdDocument = await AttendanceChecker.getDocument();
    const attendMessage = await AttendanceChecker.getSyncAttendMessage();
    await AttendanceChecker.submit(attendMessage, tgdDocument);

    await AttendanceChecker.updateAttendHtml();
    attendMessageInput.value = attendMessage;
};

attend();