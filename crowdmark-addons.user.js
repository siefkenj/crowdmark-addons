// ==UserScript==
// @name     Crowdmark Additions
// @version  1
// @description Add some productivity features to the crowdmark website
// @include https://app.crowdmark.com/*
// @grant    none
// ==/UserScript==

"use strict";

function log(...args) {
    console.log("Crowdmark GM:", ...args);
}

function logFetch(arg) {
    const url = new URL(arg, window.location);
    log("fetching", "" + url);
    return fetch("" + url, { credentials: "include" });
}

console.log("Crowdmark Greasemonkey Extension Added");

// JSON data will have a "relationships" attribute; if so, matching
// information is in the "included" section
function assembleGradingGridData(data) {
    const includedHash = {};
    for (const dat of data.included) {
        includedHash[[dat.type, dat.id]] = dat.attributes;
    }
    return data.data.map(dat => {
        const { relationships, ...ret } = dat;
        ret.attributes.points = [];
        for (const item of relationships.points.data) {
            if (includedHash[[item.type, item.id]]) {
                ret.attributes.points.push(includedHash[[item.type, item.id]]);
            }
        }

        return ret;
    });
}

class ExamInfo {
    constructor() {
        const path = window.location.pathname.split("/");
        // The path looks like ["", "exams", "<exam name>"] if we're viewing
        // an exam page
        if (path.includes("exams")) {
            this.exam = path[2];
        }
    }
    async fetchMatched() {
        const resp = await logFetch(`/api/v2/grading-grids/${this.exam}`);
        const json = await resp.json();
        log(json);
        // Store all the gradint grid rows so we can load the data about whether they've been matched
        this.gradingGrid = {};
        for (const row of json.included) {
            this.gradingGrid[row.attributes.sequence] = row;
        }

        const grabBatch = async seq => {
            if (seq.length === 0) {
                return;
            }
            const url =
                `/api/v2/grading-grids/${this.exam}/rows?` +
                seq.map(x => "s[]=" + x).join("&");
            const resp = await logFetch(url);
            const json = await resp.json();

            const data = assembleGradingGridData(json);
            // we've parsed the data. Now stick it where it belongs
            for (const item of data) {
                this.gradingGrid[item.attributes.sequence].info =
                    item.attributes;
            }
        };

        // grab in batches of 20
        const batch = [];
        const BATCH_SIZE = 200;
        for (const seq of Object.keys(this.gradingGrid)) {
            if (batch.length === BATCH_SIZE) {
                await grabBatch(batch);
                // delete the contents of the batch
                batch.length = 0;
            }
            batch.push(seq);
        }
        // make sure to get the final batch
        await grabBatch(batch);

        log("Got all grading grids", this.gradingGrid);
    }

    async checkMissingMatched() {
        if (!this.gradingGrid) {
            log("Haven't downloaded grading grid yet");
            return;
        }

        const warnings = [];
        for (const item of Object.values(this.gradingGrid)) {
            if (item.info.state === "unmatched") {
                continue;
            }
            // if we are matched and any of the pages are not uploaded, add to the warnings list
            const notUploaded = item.info.points.filter(
                x => x.status === "awaiting_upload"
            );
            if (notUploaded.length > 0) {
                warnings.push([item.info, notUploaded]);
            }
        }

        return warnings;
    }
}

// wait for an element to appear on the page
// and return it when it does; uses querySelector
// on the `selector`
async function awaitElement(selector) {
    const MAX_TRIES = 30;
    let tries = 0;
    return new Promise((resolve, reject) => {
        function probe() {
            tries++;
            return document.querySelector(selector);
        }

        function delayedProbe() {
            if (tries >= MAX_TRIES) {
                log("Can't find element with selector", selector);
                reject();
                return;
            }
            const elm = probe();
            if (elm) {
                resolve(elm);
                return;
            }

            window.setTimeout(delayedProbe, 250);
        }

        delayedProbe();
    });
}

async function addStatisticsButton(exam) {
    const button = document.createElement("button");
    button.classList.add("button");
    button.setAttribute("id", "ca-scan-statistics");
    button.style.marginLeft = "20px";
    button.innerHTML = "Scan Statistics";

    const header = await awaitElement(".main-header");
    header.appendChild(button);

    const dialog = createDialog("Matched but not-uploaded exams");

    // add a click callback that generates statistics
    button.onclick = async function() {
        try {
            button.classList.add("icon--spinner");
            await exam.fetchMatched();
            const missing = await exam.checkMissingMatched();
            button.classList.remove("icon--spinner");
            log("Got Warnings", missing);

            if (missing.length === 0) {
                dialog.contentElement.textContent = "No exams missing";
            } else {
                const summary = missing
                    .map(
                        ([info, pages]) =>
                            `Booklet #${info.sequence} (${
                                info["student-name"]
                            })\n${pages.map(x => x.slug).join(", ")}`
                    )
                    .join("\n\n");
                dialog.contentElement.innerHTML = `<div style="white-space: pre;">${summary}</div>`;
            }

            dialog.open();
        } catch (e) {
            log(e);
        } finally {
            button.classList.remove("icon--spinner");
        }
    };
}

// creates a dialog window which can be opened and
// closed with `.open()` and `.close()`. Adjust the contents
// by accessing `.contentElement`
function createDialog(title = "Default Title") {
    const outer = document.createElement("div");
    outer.classList.add("cm-modal__backdrop");
    outer.innerHTML = `<div class="cm-modal__container" style="width: calc(100% - 5em); height: calc(100% - 5em);">
		<h2>${title}</h2>
		<button class="cm-modal__close"></button>
		<div class="dialog-content">Default Content</div>
	</div>`;

    const content = outer.querySelector(".dialog-content");

    const ret = {
        open: function() {
            outer.classList.add("visible");
        },
        close: function() {
            outer.classList.remove("visible");
        },
        contentElement: content
    };

    outer.querySelector("button").onclick = ret.close;
    document.body.appendChild(outer);

    return ret;
}

// Ensure `callback` is called every time window.location changes
// code derived from https://stackoverflow.com/questions/3522090/event-when-window-location-href-changes
function addLocationChangeCallback(callback) {
    let oldHref = window.location.href;
    const body = document.querySelector("body");
    const observer = new MutationObserver(mutations => {
        if (mutations.some(() => oldHref !== document.location.href)) {
            oldHref = document.location.href;
            callback();
        }
    });

    observer.observe(body, { childList: true, subtree: true });
    return observer;
}

async function main() {
    const exam = new ExamInfo();
    log("Detected exam", exam.exam);

    window.onpopstate = function(event) {
        log(
            "location: " +
                document.location +
                ", state: " +
                JSON.stringify(event.state)
        );
    };

    if (
        exam.exam &&
        (window.location.pathname.includes("dashboard") ||
            window.location.pathname.includes("uploads"))
    ) {
        await addStatisticsButton(exam);
    }
}

// Make sure we run whenever window.location changes
addLocationChangeCallback(() =>
    main().catch(e => {
        log("ERROR", e);
    })
);
// Make sure we run once at the start
main().catch(e => {
    log("ERROR", e);
});
