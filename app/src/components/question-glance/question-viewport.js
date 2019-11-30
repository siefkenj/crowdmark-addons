import React from "react";
import classNames from "classnames";
import { RenderedQuestion } from "./question-renderer";
import { formatQuestion, exam } from "../../exam-info";

export function QuestionViewport(props) {
    const { question, crop, collapsed, selected, onClick = () => {} } = props;
    const q = formatQuestion(question);
    return (
        <div
            className={classNames([
                "question-viewport-container",
                { selected: selected }
            ])}
            onClick={() => onClick(question)}
        >
            <div className="viewport-header">
                <div>
                    ({q.label}) booklet #
                    <a
                        href={`/exams/${exam.exam}/grading/student/${q.bookletNumber}/question/${q.slug}`}
                        className="booklet-number"
                    >
                        {q.bookletNumber}
                    </a>{" "}
                    score {q.points}/{q.maxPoints}
                </div>
                <div>
                    by{" "}
                    <img
                        className="user-image user-image-sml"
                        src={q.evaluation.marker["tiny-avatar-url"]}
                        alt={`${q.evaluation.marker["display-name"]} ${q.evaluation.marker.email}`}
                    />{" "}
                    {q.evaluation.marker["display-name"]}
                </div>
            </div>
            {!collapsed && <RenderedQuestion question={question} crop={crop} />}
        </div>
    );
}