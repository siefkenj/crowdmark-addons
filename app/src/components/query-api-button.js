import React from "react";
import { log, logFetch } from "../utils";
import { Dialog } from "./dialog";
import { Button } from "./button";
import { deserialize } from "deserialize-json-api";

export function QueryApiButton(props) {
    const [spinner, setSpinner] = React.useState(false);
    const [dialogVisible, setDialogVisible] = React.useState(false);
    const [url, setUrl] = React.useState("");
    const [result, setResult] = React.useState("");

    async function onClick() {
        setDialogVisible(true);
    }

    async function query() {
        setSpinner(true);
        try {
            const resp = await logFetch(unescape(url));
            const json = await resp.json();
            log("Raw result", json);
            const normalized = deserialize(json);
            setResult(JSON.stringify(normalized, null, 4));
            log("Normalized result", normalized);
        } catch (e) {
            setResult("Error encountered. See console.");
            log(e);
        } finally {
            setSpinner(false);
        }
    }

    return (
        <>
            <Button
                style={{ marginLeft: 20 }}
                spinner={spinner}
                onClick={onClick}
            >
                Query Api
            </Button>
            <Dialog
                title="Query API"
                visible={dialogVisible}
                onClose={() => setDialogVisible(false)}
            >
                <input
                    value={url}
                    onChange={e => {
                        setUrl(e.target.value);
                    }}
                />
                Unescaped URL:
                <input value={unescape(url)} readOnly />
                <Button spinner={spinner} onClick={query}>
                    Query
                </Button>
                <div style={{ whiteSpace: "pre" }}>{result}</div>
            </Dialog>
        </>
    );
}
