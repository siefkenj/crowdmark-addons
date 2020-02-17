import React from "react";
import classNames from "classnames";
import { RenderedQuestion } from "./question-renderer";
import { formatQuestion, exam } from "../../exam-info";

export function QuestionViewport(props) {
    const {
        question,
        crop,
        collapsed,
        selected,
        onClick = () => {},
        className
    } = props;
    const q = formatQuestion(question);
    return (
        <div
            className={classNames([
                className,
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
                        target="_blank"
                        rel="noopener noreferrer"
                    >
                        {q.bookletNumber}
                    </a>{" "}
                    score {q.points}/{q.maxPoints}
                </div>
                {q.evaluation && (
                    <div>
                        by{" "}
                        <img
                            className="user-image user-image-sml"
                            src={q.evaluation.marker["tiny-avatar-url"]}
                            alt={`${q.evaluation.marker["display-name"]} ${q.evaluation.marker.email}`}
                        />{" "}
                        {q.evaluation.marker["display-name"]}
                    </div>
                )}
            </div>
            {!collapsed && (
                <a
                    href={`/exams/${exam.exam}/grading/student/${q.bookletNumber}/question/${q.slug}`}
                    target="_blank"
                    rel="noopener noreferrer"
                >
                    <RenderedQuestion question={question} crop={crop} />
                </a>
            )}
        </div>
    );
}
