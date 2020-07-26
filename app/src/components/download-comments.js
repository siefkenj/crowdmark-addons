import React from "react";
import FileSaver from "file-saver";
import { log } from "../utils";
import { Dialog } from "./dialog";
import { Button } from "./button";
import { ExamInfo } from "../exam-info";

export const exam = new ExamInfo();

export function DownloadCommentsButton(props) {
    let [spinner, setSpinner] = React.useState(false);
    const [dialogVisible, setDialogVisible] = React.useState(false);
    const [questionList, setQuestionList] = React.useState([]);
    const [
        bookletNumbersByQuestion,
        setBookletNumbersByQuestion,
    ] = React.useState({});
    const [
        selectedQuestionIndices,
        setSelectedQuestionIndices,
    ] = React.useState({});

    async function onClick() {
        setDialogVisible(true);
        try {
            const allQuestions = await exam.fetchQuestions();
            setQuestionList(allQuestions);
        } catch (e) {
            log(e);
        }
    }

    React.useEffect(() => {
        // Download the booklet numbers for each selected question
        // If we already have download a question list, don't do it again.
        if (
            Object.keys(selectedQuestionIndices).every(
                (i) => bookletNumbersByQuestion[i]
            )
        ) {
            return;
        }

        async function doIt() {
            for (const i of Object.keys(selectedQuestionIndices).filter(
                (i) =>
                    selectedQuestionIndices[i] && !bookletNumbersByQuestion[i]
            )) {
                const question = questionList[i];
                // Immediately set the state of the current question list so that
                // we don't run into race conditions.
                setBookletNumbersByQuestion((state) => ({
                    ...state,
                    [i]: "downloading",
                }));

                const bookletInfo = await exam.fetchBookletInfoForQuestionAndFilter(
                    question,
                    {}
                );
                const bookletNumbers = bookletInfo.map(
                    (x) => x["exam-sequence"]
                );
                setBookletNumbersByQuestion((state) => ({
                    ...state,
                    [i]: bookletNumbers,
                }));
            }
        }
        doIt().catch((e) => console.error("downloading error", e));
    }, [
        bookletNumbersByQuestion,
        setBookletNumbersByQuestion,
        questionList,
        selectedQuestionIndices,
    ]);

    async function query() {
        setSpinner(true);
        try {
            // Grab information about each question that we have booklet data for

            const fetchPromises = [];
            const ret = [];

            for (const i of Object.keys(selectedQuestionIndices).filter(
                (i) => selectedQuestionIndices[i] && bookletNumbersByQuestion[i]
            )) {
                const question = questionList[i];
                const bookletNumbers = bookletNumbersByQuestion[i];

                log(
                    "Fetching question details for question",
                    question,
                    "and booklet numbers",
                    bookletNumbers
                );
                fetchPromises.push(
                    exam.fetchInfoForBookletsByQuestion(
                        question,
                        bookletNumbers
                    )
                );
            }

            for (const allBookletInfo of await Promise.all(fetchPromises)) {
                // Filter the info so it could be human readable
                const downloadableInfo = allBookletInfo.map((info) => {
                    const primaryEvalId =
                        info["exam-question"]["primary-evaluation-id"];
                    const evaluation =
                        info.evaluations.find(
                            (x) => +x.id === +primaryEvalId
                        ) || {};
                    const annotations = info.annotations.filter(
                        (x) =>
                            x.type === "CommentAnnotation" &&
                            +x.evaluation.id === +primaryEvalId
                    );

                    return {
                        booklet_number: info.sequence,
                        question_slug: info.slug,
                        question_name: info["exam-question"].label,
                        student_email: info["exam-question"]["student-email"],
                        score: evaluation.points,
                        marker: evaluation.marker.email,
                        annotations: annotations.map((x) => ({
                            points: x.points,
                            text: x.metadata.text,
                        })),
                    };
                });
                ret.push(downloadableInfo);
            }

            log("Got comment data", ret);
            // Make a file for saving
            const blob = new Blob([JSON.stringify(ret, null, 4)], {
                type: "application/json;charset=utf-8",
            });
            FileSaver.saveAs(blob, "comment-data.json");
        } catch (e) {
            log(e);
        } finally {
            setSpinner(false);
        }
    }

    spinner =
        spinner ||
        Object.values(bookletNumbersByQuestion).some(
            (x) => x === "downloading"
        );

    return (
        <>
            <Button style={{ marginLeft: 20 }} onClick={onClick}>
                Download Comments
            </Button>
            <Dialog
                title="Test"
                visible={dialogVisible}
                onClose={() => setDialogVisible(false)}
            >
                <Button onClick={query} spinner={spinner}>
                    Download Comments
                </Button>
                <table className="comments-list">
                    <thead>
                        <tr>
                            <th style={{ padding: 0 }}>
                                <i
                                    className="fa fa-window-close clear-filters"
                                    aria-hidden="true"
                                    onClick={() => {
                                        setSelectedQuestionIndices({});
                                    }}
                                ></i>
                            </th>
                            <th>Question</th>
                            <th>Points</th>
                            <th>Num Booklets</th>
                        </tr>
                    </thead>
                    <tbody>
                        {questionList.map((question, i) => (
                            <tr key={i}>
                                <td style={{ padding: 2 }}>
                                    <input
                                        type="checkbox"
                                        name="comment-select"
                                        checked={!!selectedQuestionIndices[i]}
                                        onChange={() => {
                                            setSelectedQuestionIndices({
                                                ...selectedQuestionIndices,
                                                [i]: !selectedQuestionIndices[
                                                    i
                                                ],
                                            });
                                        }}
                                    />
                                </td>
                                <td>{question.label}</td>
                                <td>
                                    {question.points != null && question.points}
                                </td>
                                <td>
                                    {bookletNumbersByQuestion[i] ? (
                                        bookletNumbersByQuestion[i] ===
                                        "downloading" ? (
                                            <div className="icon--spinner" />
                                        ) : (
                                            bookletNumbersByQuestion[i].length
                                        )
                                    ) : null}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </Dialog>
        </>
    );
}
