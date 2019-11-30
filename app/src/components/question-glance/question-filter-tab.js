import React from "react";
import { exam } from "../../exam-info";
import { log, sortBySelector, reversed } from "../../utils";

export function QuestionFilterTab(props) {
    const { question, setFilter, filter } = props;
    const [commentList, setCommentList] = React.useState([]);
    const [tagsList, setTagsList] = React.useState([]);
    const [gradersList, setGradersList] = React.useState([]);

    const selectedCommentIndex = commentList.findIndex(
        x => x.id === (filter.comment || {}).id
    );
    const selectedTagsIndex = tagsList.findIndex(
        x => x.id === (filter.tag || {}).id
    );
    const selectedGradersIndex = gradersList.findIndex(
        x => x.id === (filter.grader || {}).id
    );

    log(
        "Currently filtering by",
        filter,
        selectedCommentIndex,
        selectedTagsIndex,
        selectedGradersIndex
    );

    // We want to bubble up whatever filter is selected
    function setSelectedCommentByIndex(i) {
        setFilter({ ...filter, comment: commentList[i] });
    }
    function setSelectedTagsByIndex(i) {
        setFilter({ ...filter, tag: tagsList[i] });
    }
    function setSelectedGradersByIndex(i) {
        setFilter({ ...filter, grader: gradersList[i] });
    }

    // Whenever the question changes, we need to update the list of tags and comments
    React.useEffect(() => {
        if (!question) {
            return;
        }
        async function prep() {
            // comments
            const commentList = await exam.fetchAnnotationForQuestion(question);
            setCommentList(commentList);
            log("Got Comments List", commentList);

            // tags
            const tagsList = await exam.fetchTagsForQuestion(question);
            log("Got Tags List", tagsList);
            setTagsList(tagsList);

            // graders
            const gradersList = await exam.fetchGradersForQuestion(question);
            log("Got Graders List", gradersList);
            setGradersList(gradersList);
        }
        prep().catch(e => {
            log(e);
        });
    }, [question]);

    if (!question) {
        return <div>Please select a question first.</div>;
    }

    return (
        <div  className="question-glance">
            <h4>
                Viewing Question {question.label} ({question.slug})
            </h4>
            <div style={{ display: "flex" }}>
                <CommentTable
                    comments={commentList}
                    selectedIndex={selectedCommentIndex}
                    setSelectedIndex={setSelectedCommentByIndex}
                />
                <TagsTable
                    tags={tagsList}
                    selectedIndex={selectedTagsIndex}
                    setSelectedIndex={setSelectedTagsByIndex}
                />
                <GradersTable
                    graders={gradersList}
                    selectedIndex={selectedGradersIndex}
                    setSelectedIndex={setSelectedGradersByIndex}
                />
            </div>
        </div>
    );
}

function CommentTable(props) {
    const { comments, selectedIndex, setSelectedIndex } = props;
    const commentsCopy = comments.map((x, i) => ({ ...x, originalIndex: i }));
    const sortedComments = reversed(
        sortBySelector(commentsCopy, x => +x["annotations-count"])
    );
    return (
        <table className="comments-list">
            <thead>
                <tr>
                    <th style={{ padding: 0 }}>
                        <i
                            className="fa fa-window-close clear-filters"
                            aria-hidden="true"
                            onClick={() => {
                                setSelectedIndex(-1);
                            }}
                        ></i>
                    </th>
                    <th>Used</th>
                    <th>Comment</th>
                    <th>points</th>
                </tr>
            </thead>
            <tbody>
                {sortedComments.map((comment, i) => (
                    <tr key={i}>
                        <td style={{ padding: 2 }}>
                            <input
                                type="radio"
                                name="comment-select"
                                checked={
                                    comment.originalIndex === selectedIndex
                                }
                                onChange={() => {
                                    setSelectedIndex(comment.originalIndex);
                                }}
                            />
                        </td>
                        <td>{comment["annotations-count"]}</td>
                        <td>{comment.text}</td>
                        <td>{comment.points != null && comment.points}</td>
                    </tr>
                ))}
            </tbody>
        </table>
    );
}

function TagsTable(props) {
    const { tags, selectedIndex, setSelectedIndex } = props;
    return (
        <table className="comments-list">
            <thead>
                <tr>
                    <th style={{ padding: 0 }}>
                        <i
                            className="fa fa-window-close clear-filters"
                            aria-hidden="true"
                            onClick={() => {
                                setSelectedIndex(-1);
                            }}
                        ></i>
                    </th>
                    <th>Tag</th>
                </tr>
            </thead>
            <tbody>
                {tags.map((tag, i) => (
                    <tr key={i}>
                        <td style={{ padding: 2 }}>
                            <input
                                type="radio"
                                name="tag-select"
                                checked={i === selectedIndex}
                                onChange={() => {
                                    setSelectedIndex(i);
                                }}
                            />
                        </td>
                        <td>{tag.label}</td>
                    </tr>
                ))}
            </tbody>
        </table>
    );
}

function GradersTable(props) {
    const { graders, selectedIndex, setSelectedIndex } = props;
    return (
        <table className="comments-list">
            <thead>
                <tr>
                    <th style={{ padding: 0 }}>
                        <i
                            className="fa fa-window-close clear-filters"
                            aria-hidden="true"
                            onClick={() => {
                                setSelectedIndex(-1);
                            }}
                        ></i>
                    </th>
                    <th>Grader</th>
                </tr>
            </thead>
            <tbody>
                {graders.map((user, i) => (
                    <tr key={i}>
                        <td style={{ padding: 2 }}>
                            <input
                                type="radio"
                                name="grader-select"
                                checked={i === selectedIndex}
                                onChange={() => {
                                    setSelectedIndex(i);
                                }}
                            />
                        </td>

                        <td>
                            <img
                                className="user-image user-image-sml"
                                src={user["tiny-avatar-url"]}
                                alt={`${user["display-name"]} ${user.email}`}
                            />{" "}
                            {user["display-name"] || user.email}
                        </td>
                    </tr>
                ))}
            </tbody>
        </table>
    );
}
