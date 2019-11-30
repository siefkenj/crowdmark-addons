import React from "react";
import ReactDOM from "react-dom";
import { log, addLocationChangeCallback, awaitElement } from "./utils";
import { exam } from "./exam-info";
import { ScanStatsButton } from "./components/scan-stats-button";
import { QuestionGlanceButton } from "./components/question-glance/question-glance-button";
import { QueryApiButton } from "./components/query-api-button";

log("React Script has successfully started");

async function main() {
    // initializing the exam makes sure all the paths are correct
    exam.init();
    if (!exam.exam) {
        // If we aren't on an exam page, just exit
        return;
    }
    log("Found exam", exam.exam);
    if (
        window.location.pathname.includes("dashboard") ||
        window.location.pathname.includes("uploads")
    ) {
        const header = await awaitElement(".main-header");
        const newSpan = document.createElement("span");
        header.appendChild(newSpan);
        ReactDOM.render(
            <>
                <ScanStatsButton />
                <QuestionGlanceButton />
                <QueryApiButton />
            </>,
            newSpan
        );
    }
}

addLocationChangeCallback(() => {
    // Greasemonkey doesn't bubble errors up to the main console,
    // so we have to catch them manually and log them
    main().catch(e => {
        log(e);
    });
});

//const main = document.createElement("div");
//document.body.appendChild(main);

//ReactDOM.render(<App />, main);
