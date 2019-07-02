const log = chrome.extension.getBackgroundPage() ? chrome.extension.getBackgroundPage()!.console.log : console.log;
const error = chrome.extension.getBackgroundPage() ? chrome.extension.getBackgroundPage()!.console.error : console.error;
const attendanceUrl = "https://tgd.kr/play/attendance";

const button = document.getElementById("button");
log(button);
//button!.onclick = (ev) => {
//   checkAttendance("boo");
//};

checkAttendance("boo");

class LoginResult {
    constructor(public success: boolean, public message: string) {

    }
}

function checkAttendance(message: string) {
    const prom = new Promise<LoginResult>(async (resolve, reject) => {
        const tgdFetch = await fetch(attendanceUrl, { mode: "no-cors" });
        const tgdBody = await tgdFetch.text();
        const tgdDocument = new DOMParser().parseFromString(tgdBody, "text/html");

        if (tgdFetch.url !== attendanceUrl) {
            resolve({ success: false, message: "로그인을 한 후 시도해주세요" });
            return;
        }

        const answer = parseQuestion(tgdDocument);

        const formData = new FormData();
        formData.append("donotbot", parseDonotbot(tgdDocument));
        formData.append("message", message);
        formData.append("answer", answer.toString());

        fetch(attendanceUrl, {
            method: "POST",
            mode: "no-cors",
            body: formData
        })
            .then(body => body.text())
            .then(text => JSON.parse(text))
            .then(json => {
                const status = json["status"] as number;
                const message = json["message"] as string;

                resolve({
                    success: status !== 500,
                    message: message
                });
            });
    });

    prom
        .then(result => {
            log(result);
            alert(result.message);
        })
        .catch(e => {
            error(e);
        });
}

function parseDonotbot(tgdDocument: Document) {
    return tgdDocument.getElementsByName("donotbot")[0].attributes.getNamedItem("value")!.nodeValue as string;
}

function parseQuestion(tgdDocument: Document) {
    const answerButton = tgdDocument.getElementById("attdbtn");
    const text = answerButton!.parentElement!.textContent as string;
    const regex = /:\s*(-?\d+) \+ (\d+) = ?/;

    const match = text.match(regex);
    const num1 = parseInt(match![1]);
    const num2 = parseInt(match![2]);

    return num1 + num2;
}