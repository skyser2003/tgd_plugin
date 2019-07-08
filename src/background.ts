import { AttendanceChecker } from "./attendance_checker.js";

async function attendAndReserve() {
    const attendMessage = await AttendanceChecker.getSyncAttendMessage();
    const tgdDocument = await AttendanceChecker.getDocument();

    AttendanceChecker.submit(attendMessage, tgdDocument);

    const reserve = (now: Date, tomorrowAttendTime: Date) => {
        const diff = tomorrowAttendTime.getTime() - now.getTime();
        setTimeout(() => attendAndReserve(), diff);
    }

    const attendInfo = AttendanceChecker.parseAttendInformation(tgdDocument);
    if (attendInfo.isLoggedIn === false) {
        const now = new Date();
        const tomorrowAttendTime = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1, 0, 0, 5);

        reserve(now, tomorrowAttendTime);
    }
    else {
        const strDate = attendInfo.date.toString();

        const year = parseInt(strDate.substring(0, 4));
        const month = parseInt(strDate.substr(4, 2));
        const day = parseInt(strDate.substr(6));

        const now = new Date();
        const tomorrowAttendTime = new Date(year, month - 1, day + 1, 0, 0, 5);

        reserve(now, tomorrowAttendTime);
    }
}

chrome.runtime.onInstalled.addListener(() => {
    chrome.declarativeContent.onPageChanged.removeRules(undefined, () => {
        chrome.declarativeContent.onPageChanged.addRules([{
            conditions: [new chrome.declarativeContent.PageStateMatcher({})],
            actions: [new chrome.declarativeContent.ShowPageAction()]
        }]);
    });
});

chrome.runtime.onStartup.addListener(() => attendAndReserve());