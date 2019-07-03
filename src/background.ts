import { AttendanceChecker } from "./attendance_checker.js";

chrome.runtime.onInstalled.addListener(() => {
    chrome.declarativeContent.onPageChanged.removeRules(undefined, () => {
        chrome.declarativeContent.onPageChanged.addRules([{
            conditions: [new chrome.declarativeContent.PageStateMatcher({})],
            actions: [new chrome.declarativeContent.ShowPageAction()]
        }]);
    });
});

chrome.runtime.onStartup.addListener(async () => {
    const attendMessage = await AttendanceChecker.getSyncAttendMessage();
    
    AttendanceChecker.submit(attendMessage);
});