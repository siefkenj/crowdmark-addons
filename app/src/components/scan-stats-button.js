import React from "react";
import { log } from "../utils";
import { exam } from "../exam-info";
import { Dialog } from "./dialog";
import { Button } from "./button";

export function ScanStatsButton(props) {
    const [spinner, setSpinner] = React.useState(false);
    const [dialogVisible, setDialogVisible] = React.useState(false);
    const [missingList, setMissingList] = React.useState([]);

    async function onClick() {
        setSpinner(true);
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
                title="Matched but not uploaded exams"
                visible={dialogVisible}
                onClose={() => setDialogVisible(false)}
            >
                {missingList.length === 0 ? (
                    "No exams missing"
                ) : (
                    <ul>{renderedList}</ul>
                )}
            </Dialog>
        </>
    );
}
