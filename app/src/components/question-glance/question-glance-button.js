import React from "react";
import classNames from "classnames";
import { exam } from "../../exam-info";
import { Dialog } from "../dialog";
import { Button } from "../button";
import { ClippedImage } from "./clipped-image";
import { Tabs } from "../tabs";
import { log } from "../../utils";

import "./question-glance.css";
import { QuestionViewport } from "./question-viewport";
import { PaginatedExamSequenceSelector } from "./exam-sequence-paginator";
import { QuestionFilterTab } from "./question-filter-tab";
import { SizeSelect } from "./select-size-slider";

function QuestionDropdown(props) {
    const { questions, selectedQuestion, onChange } = props;
    const selectedIndex = questions[selectedQuestion]
        ? selectedQuestion
        : questions.indexOf(selectedQuestion);

    function clicked(e) {
        onChange(+e.target.value);
    }

    return (
        <div>
            {questions.map((q, i) => {
                const id = `${q.slug}-${i}`;
                return (
                    <span
                        key={i}
                        style={{ display: "inline-block", paddingRight: 10 }}
                    >
                        <input
                            type="radio"
                            id={id}
                            name="question-select"
                            value={i}
                            checked={+selectedIndex === i}
                            onChange={clicked}
                        ></input>
                        <label htmlFor={id}>
                            {q.label} ({q.slug})
                        </label>
                    </span>
                );
            })}
        </div>
    );
}

function ViewQuestionsTab(props) {
    const { question, filter, boundingBox } = props;
    const [bookletInfo, setBookletInfo] = React.useState([]);
    const [displayedBooklets, setDisplayedBooklets] = React.useState([]);
    const [spinner, setSpinner] = React.useState(false);
    const [size, setSize] = React.useState(0);

    // comments may be used more than once on a page
    const bookletNumbers = Array.from(
        new Set(bookletInfo.map(x => x["exam-sequence"]))
    ).sort();

    log(
        "diplaying booklets",
        bookletInfo.map(x => x["exam-sequence"])
    );

    React.useEffect(() => {
        if (!question) {
            return;
        }
        async function prep() {
            setSpinner(true);
            let bookletInfo = await exam.fetchBookletInfoForQuestionAndFilter(
                question,
                filter
            );
            setBookletInfo(bookletInfo);
            log(
                "Found booklets matching filter:",
                filter,
                "booklets:",
                bookletInfo
            );
        }
        prep()
            .catch(e => {
                log(e);
            })
            .finally(() => {
                setSpinner(false);
            });
    }, [question, filter]);

    if (!question) {
        return <div>Please select a question first.</div>;
    }
    if (!filter) {
        return <div>Please select a comment to filter by.</div>;
    }

    return (
        <div className="question-glance">
            <h4>
                Viewing Question {question.label} ({question.slug})
            </h4>
            <p className={classNames([{ "icon--spinner": spinner }])}>
                Filtering by:{" "}
                {filter.comment && (
                    <>
                        (comment){" "}
                        <span className="filter-comment">
                            {(filter.comment || {}).text}
                        </span>
                    </>
                )}
                {filter.tag && (
                    <>
                        (tag){" "}
                        <span className="filter-comment">
                            {(filter.tag || {}).label}
                        </span>
                    </>
                )}
                {filter.grader && (
                    <>
                        (grader){" "}
                        <span className="filter-comment">
                            {(filter.grader || {})["display-name"]}
                        </span>
                    </>
                )}
                {filter.onlyUnmarked && (
                    <>Unmarked Booklets (this can take a while)</>
                )}
                <SizeSelect value={size} setValue={setSize} />
            </p>
            <PaginatedExamSequenceSelector
                seq={bookletNumbers}
                callback={async bookletNumber => {
                    const info = await exam.fetchInfoForBookletsByQuestion(
                        question,
                        [bookletNumber]
                    );
                    if (info) {
                        return info[0];
                    }
                }}
                setData={setDisplayedBooklets}
            />
            {displayedBooklets.map((booklet, i) => (
                <QuestionViewport
                    key={i}
                    question={booklet}
                    crop={{
                        x: boundingBox.x / 1200,
                        y: boundingBox.y / 1553,
                        w: boundingBox.w / 1200,
                        h: boundingBox.h / 1553
                    }}
                    className={`zoom-question-${size}`}
                />
            ))}
        </div>
    );
}

export function QuestionGlanceButton(props) {
    const [spinner, setSpinner] = React.useState(false);
    const [dialogVisible, setDialogVisible] = React.useState(false);
    const [activeTab, setActiveTab] = React.useState(0);
    const [filter, setFilter] = React.useState({
        comment: null,
        tag: null,
        grader: null
    });
    const [questions, setQuestions] = React.useState([]);
    const [selectedQuestionIndex, setSelectedQuestionIndex] = React.useState(
        null
    );
    const [selection, setSelection] = React.useState({
        x: 0,
        y: 0,
        w: 1200,
        h: 1533
    });

    const question = questions[selectedQuestionIndex];
    let questionView = null;
    if (question) {
        questionView = (
            <div>
                <h4>
                    Viewing Question {question.label} ({question.slug})
                </h4>
                <div style={{ width: "100%", display: "flex" }}>
                    <div style={{ flex: "0 0 50%" }}>
                        <ClippedImage
                            src={question["exam-master-page"].url}
                            noclip
                            label={{
                                x: question["anchor-x"],
                                y: question["anchor-y"],
                                label: question.label
                            }}
                            setSelection={setSelection}
                            allowSelect
                        />
                    </div>
                    <div style={{ flex: "0 0 50%" }}>
                        <h4>Selected Region</h4>
                        <ClippedImage
                            src={question["exam-master-page"].url}
                            boundingBox={selection}
                        />
                    </div>
                </div>
            </div>
        );
    }

    async function onClick() {
        setSpinner(true);
        setQuestions(await exam.fetchQuestions());
        setSpinner(false);
        setDialogVisible(true);
    }

    return (
        <>
            <Button
                style={{ marginLeft: 20 }}
                spinner={spinner}
                onClick={onClick}
            >
                Glance at Questions
            </Button>
            <Dialog
                title="Marking summary"
                visible={dialogVisible}
                onClose={() => setDialogVisible(false)}
            >
                <Tabs
                    activeTab={activeTab}
                    setActiveTab={setActiveTab}
                    tabNames={[
                        "Select Question",
                        "Select Filter",
                        "View Questions"
                    ]}
                >
                    <>
                        <h4>Select question to view</h4>
                        <QuestionDropdown
                            questions={questions}
                            selectedQuestion={selectedQuestionIndex}
                            onChange={setSelectedQuestionIndex}
                        />
                        {questionView}
                    </>
                    <>
                        <QuestionFilterTab
                            question={question}
                            setFilter={setFilter}
                            filter={filter}
                        />
                    </>
                    <>
                        <ViewQuestionsTab
                            question={question}
                            filter={filter}
                            boundingBox={selection}
                        />
                    </>
                </Tabs>
            </Dialog>
        </>
    );
}
