import React from "react";
import { log } from "../utils";
import { exam } from "../exam-info";
import { Dialog } from "./dialog";
import { Button } from "./button";

export function ScanStatsButton(props) {
    const [spinner, setSpinner] = React.useState(false);
    const [dialogVisible, setDialogVisible] = React.useState(false);
    const [missingList, setMissingList] = React.useState([]);
    const [tokenData, setTokenData] = React.useState({});

    async function onClick() {
        setSpinner(true);
        setTokenData(await exam.fetchMobileTokenInfo());
        await exam.fetchMatched();
        const missing = await exam.checkMissingMatched();
        log("Found missing exams", missing);
        setSpinner(false);
        setMissingList(missing);
        setDialogVisible(true);
    }

    const renderedList = missingList.map(([info, pages], i) => (
        <li key={i} style={{ marginBottom: 10 }}>
            Booklet #{info.sequence}
            <br />
            {pages.map(x => x.slug).join(", ")}
        </li>
    ));

    const renderedTokenDataList = Object.values(tokenData).map(
        ({ token, name, matchedExams }) => (
            <li key={token} style={{ marginBottom: 10 }}>
                <span style={{ minWidth: 300, display: "inline-block" }}>
                    <b>{name}</b> (token '{token}')
                </span>
                <span style={{ marginLeft: 20 }}>
                    {" "}
                    matched{" "}
                    <b title={matchedExams.join(", ")}>{matchedExams.length}</b>
                </span>
            </li>
        )
    );

    return (
        <>
            <Button
                style={{ marginLeft: 20 }}
                spinner={spinner}
                onClick={onClick}
            >
                Scan Statistics
            </Button>
            <Dialog
                title="Matched Exam Info"
                visible={dialogVisible}
                onClose={() => setDialogVisible(false)}
            >
                <ul>{renderedTokenDataList}</ul>
                <h5 style={{ marginTop: "1em", fontWeight: "bold" }}>
                    Missing Exam Info
                </h5>
                {missingList.length === 0 ? (
                    "No exams missing"
                ) : (
                    <ul>{renderedList}</ul>
                )}
            </Dialog>
        </>
    );
}
