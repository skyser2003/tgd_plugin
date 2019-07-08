import { AttendanceChecker } from "./attendance_checker.js";

const dailyAlarmName = "check_attendance_daily";

async function createDailyAlarm(tgdDocument: Document) {
    const attendInfo = await AttendanceChecker.parseAttendInformation(tgdDocument);

    const tomorrowAttendTime = (() => {
        if (attendInfo.isLoggedIn === false) {
            const now = new Date();
            return new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1, 0, 0, 5);
        }
        else {
            const strDate = attendInfo.date.toString();

            const year = parseInt(strDate.substring(0, 4));
            const month = parseInt(strDate.substr(4, 2));
            const day = parseInt(strDate.substr(6));

            return new Date(year, month - 1, day + 1, 0, 0, 5);
        }
    })();

    chrome.alarms.create(dailyAlarmName, {
        when: tomorrowAttendTime.getTime(),
        periodInMinutes: 60 * 24
    });
}

async function attendDaily(tgdDocument: Document) {
    const attendMessage = await AttendanceChecker.getSyncAttendMessage();

    AttendanceChecker.submit(attendMessage, tgdDocument);
}

chrome.runtime.onInstalled.addListener(() => {
    chrome.declarativeContent.onPageChanged.removeRules(undefined, () => {
        chrome.declarativeContent.onPageChanged.addRules([{
            conditions: [new chrome.declarativeContent.PageStateMatcher({})],
            actions: [new chrome.declarativeContent.ShowPageAction()]
        }]);
    });
});

chrome.alarms.onAlarm.addListener(async alarm => {
    if (alarm.name === dailyAlarmName) {
        const tgdDocument = await AttendanceChecker.getDocument();
        attendDaily(tgdDocument);
    }
});

chrome.runtime.onStartup.addListener(async () => {
    const tgdDocument = await AttendanceChecker.getDocument();

    attendDaily(tgdDocument);
    createDailyAlarm(tgdDocument);
});