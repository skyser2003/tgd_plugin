// Const variables
const log = chrome.extension.getBackgroundPage() ? chrome.extension.getBackgroundPage()!.console.log : console.log;
const error = chrome.extension.getBackgroundPage() ? chrome.extension.getBackgroundPage()!.console.error : console.error;

class LoginResult {
    constructor(public success: boolean, public message: string) {

    }
}

export class AttendanceChecker {
    static storageAttendMessageKey = "tgd_attend_message";
    static defaultAttendMessage = "트하";

    private static attendanceUrl = "https://tgd.kr/play/attendance";

    static getSyncAttendMessage() {
        const prom = new Promise<string>((resolve, reject) => {
            chrome.storage.sync.get(this.storageAttendMessageKey, items => {
                let message = items[this.storageAttendMessageKey] as string;
                if (message === undefined || message.length === 0) {
                    message = this.defaultAttendMessage;
                    this.setSyncAttendMessage(message);
                }

                resolve(message);
            });
        });

        return prom;
    }

    static setSyncAttendMessage(attendMessage: string) {
        const saveObj = {} as any;
        saveObj[this.storageAttendMessageKey] = attendMessage;

        return new Promise((resolve, reject) => chrome.storage.sync.set(saveObj, () => resolve()));
    }

    static async submit(attendMessage: string, tgdDocument?: Document) {
        const prom = new Promise<LoginResult>(async (resolve, reject) => {
            if (tgdDocument === undefined) {
                tgdDocument = await this.getDocument();
            }

            if (this.isLoggedIn(tgdDocument) === false) {
                resolve({ success: false, message: "트게더 로그인을 한 후 다시 시도해주세요" });
                return;
            }

            const formData = new FormData();
            formData.append("donotbot", this.parseDonotbot(tgdDocument));
            formData.append("message", attendMessage);

            fetch(AttendanceChecker.attendanceUrl, {
                method: "POST",
                mode: "cors",
                body: formData
            })
                .then(body => body.text())
                .then(text => JSON.parse(text))
                .then(json => {
                    const status = json["status"] as number;
                    const message = json["message"] as string;

                    AttendanceChecker.setSyncAttendMessage(attendMessage);

                    resolve({
                        success: status !== 500,
                        message: message
                    });
                });
        });

        return prom
            .then(result => {
                log(result);

                const resultDiv = document.getElementById("attend_result") as HTMLDivElement;

                if (resultDiv !== null) {
                    resultDiv.classList.add("segment");
                    resultDiv.innerHTML = result.message;
                }
            })
            .catch(e => {
                error(e);
            });
    }

    static async updateAttendHtml() {
        const attendInfo = await this.getAttendInformation();

        document.getElementById("current_point")!.innerHTML = attendInfo.point.toString();
        document.getElementById("current_combo")!.innerHTML = attendInfo.combo.toString();

        if (attendInfo.isLoggedIn === false) {
            document.getElementById("latest_attend_date")!.innerHTML = "로그인 후 사용해주세요";
        } else {
            const strDate = attendInfo.date.toString();
            const year = strDate.substring(0, 4);
            const month = strDate.substr(4, 2);
            const day = strDate.substr(6);

            document.getElementById("latest_attend_date")!.innerHTML = `${year}-${month}-${day}`;
        }
    }

    static async getAttendInformation(tgdDocument?: Document) {
        if (tgdDocument === undefined) {
            tgdDocument = await this.getDocument();
        }

        return this.parseAttendInformation(tgdDocument);
    }

    static parseAttendInformation(tgdDocument: Document) {
        if (this.isLoggedIn(tgdDocument) === false) {
            return {
                isLoggedIn: false,
                point: -1,
                date: "0000-00-00",
                combo: 0
            };
        }

        const currentPoint = this.parseCurrentPoint(tgdDocument);

        const mainContentElem = tgdDocument.getElementById("main-content");
        const regex = /마지막 출첵 : (\d+), (\d+) Combo/;

        const match = mainContentElem!.innerHTML!.match(regex)!;
        const latestDate = parseInt(match[1]);
        const latestCombo = parseInt(match[2]);

        return {
            isLoggedIn: true,
            point: currentPoint,
            date: latestDate,
            combo: latestCombo
        }
    }

    static async getDocument() {
        const tgdFetch = await fetch(AttendanceChecker.attendanceUrl, { mode: "cors" });
        const tgdBody = await tgdFetch.text();
        const tgdDocument = new DOMParser().parseFromString(tgdBody, "text/html");

        return tgdDocument;
    }

    static isLoggedIn(tgdDocument: Document) {
        return this.parseCurrentPoint(tgdDocument) !== -1;
    }

    private static parseDonotbot(tgdDocument: Document) {
        return tgdDocument.getElementsByName("donotbot")[0].attributes.getNamedItem("value")!.nodeValue as string;
    }

    private static parseNickname(tgdDocument: Document) {

    }

    private static parseCurrentPoint(tgdDocument: Document) {
        const pointAnchor = tgdDocument.querySelector("a[href='/member/point'] strong")!;

        return parseInt(pointAnchor ? pointAnchor.innerHTML : "-1");
    }
}