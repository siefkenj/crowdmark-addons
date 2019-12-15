import { logFetch, log } from "./utils";
import { deserialize } from "deserialize-json-api";

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

export class ExamInfo {
    constructor() {
        this.init();
    }
    init() {
        const path = window.location.pathname.split("/");
        // The path looks like ["", "exams", "<exam name>"] if we're viewing
        // an exam page
        if (path.includes("exams")) {
            this.exam = path[2];
        }
    }

    async fetchPages() {
        try {
            const resp = await logFetch(
                //`/api/v2/exams?filter[exam-master]=${this.exam}&filter[sequence]=1&include[]=exam-pages`
                `/api/v2/exams?filter[exam-master]=${this.exam}&include[]=exam-pages&page[size]=3&page[number]=2`
            );
            const json = await resp.json();
            log("raw response", JSON.parse(JSON.stringify(json)));
            log(
                "deserialized response",
                JSON.parse(JSON.stringify(deserialize(json)))
            );
            return deserialize(json);
        } catch (e) {
            log(e);
        }
    }

    /**
     * Fetch the questions and pages templates (not what the students wrote, but
     * the blank questions/pages)
     *
     * @memberof ExamInfo
     */
    async fetchMasterPages() {
        let resp = await logFetch(
            `/api/v2/exam-masters/${this.exam}/exam-master-pages`
        );
        let json = await resp.json();
        this.masterPages = deserialize(json);
        resp = await logFetch(
            `/api/v2/exam-masters/${this.exam}/exam-master-questions`
        );
        json = await resp.json();
        this.masterQuestions = deserialize(json);

        resp = await logFetch(
            `https://app.crowdmark.com/api/v2/exam-masters/test-assessment-f6e38?id=test-assessment-f6e38&include[]=exam-master-questions&include[]=exam-master-pages`
        );
        json = await resp.json();
        return [this.masterPages, this.masterQuestions];
    }

    async fetchQuestions() {
        let resp = await logFetch(
            `/api/v2/exam-masters/${this.exam}?include[]=exam-master-questions&include[]=exam-master-pages`
        );
        let json = await resp.json();
        this.questions = deserialize(json).data["exam-master-questions"];
        return this.questions;
    }

    async fetchAnnotationForQuestion(question) {
        let resp = await logFetch(
            `/api/v2/comment-masters?exam_master_question_id=${question.id}&is_shared=&show_all=true`
        );
        let json = await resp.json();
        return deserialize(json).data;
    }

    async fetchTagsForQuestion(question) {
        let resp = await logFetch(
            `/api/v2//tags?filter[exam-master]=${this.exam}`
        );
        let json = await resp.json();
        const tags = deserialize(json).data;
        return tags;
        /*
        XXX Not sure how to query for what I want...
        // Now that we have the tags, we need to see how many times they were each used
        resp = await logFetch(
            `/api/v2/evaluations?filter[exam-master]=${this.exam}${tags
                .map(x => `&filter[tags][]=${x.id}`)
                .join("")}}&include[]=exam-questions.taggings&page[size]=10000`
        );
        json = await resp.json()
        log("Got tags", tags, deserialize(json).data)
        */
    }

    async fetchUnmarkedExams() {
        // Get one record first. It's fast and will tell us how many records there are in total
        let resp = await logFetch(
            `/api/v2/exams?filter[exam-master]=${this.exam}&include[]=evaluations&include[]=evaluations.marker&page[size]=1`
        );
        let json = await resp.json();
        const onePage = deserialize(json);

        resp = await logFetch(
            `/api/v2/exams?filter[exam-master]=${this.exam}&include[]=evaluations&include[]=evaluations.marker&page[size]=${onePage.meta.pagination["total-records"]}`
        );
        json = await resp.json();

        return deserialize(json).data.filter(x => x["has-uploaded-pages"]);
    }

    async fetchUnmarkedExamsForQuestion(question) {
        // we have to fetch all exams and then filter by which ones have evaluations for a particular quesiton
        const data = await this.fetchUnmarkedExams();
        // Find only booklets where the current selected question has not been marked.
        return (
            data
                .filter(
                    x =>
                        // If there are no evaluations, `x.evaluations` will be null instead of an empty array...
                        !(x.evaluations || []).some(
                            e =>
                                e["exam-master-question-slug"] ===
                                    question.slug && e.state === "marked"
                        )
                )
                // For some reason the API switches between `exam-sequence` and `sequence`.
                // Normalize this.
                .map(x => ({
                    ...x,
                    "exam-sequence": x.sequence,
                    slug: question.slug
                }))
        );
    }

    async fetchGradersForQuestion(question) {
        let resp = await logFetch(
            `/api/v2//team-members?filter[exam-master]=${this.exam}&filter[has-graded]=true&include[]=user`
        );
        let json = await resp.json();
        const graders = deserialize(json).data;
        // the grader list comes with a bunch of extra information. What we really want is grader.user
        return graders.map(x => x.user);
    }

    async fetchBookletInfoForQuestionAndComment(question, comment) {
        let resp = await logFetch(
            `/api/v2/evaluations?filter[exam-master]=${this.exam}&filter[question]=${question.id}&filter[comment-master]=${comment.id}&page[size]=${comment["annotations-count"]}`
        );
        let json = await resp.json();
        return deserialize(json).data;
    }

    async fetchBookletInfoForQuestionAndFilter(question, filter) {
        const { comment, tag, grader, onlyUnmarked } = filter;

        if (onlyUnmarked) {
            return await this.fetchUnmarkedExamsForQuestion(question);
        }

        let resp = await logFetch(
            `/api/v2/evaluations?filter[exam-master]=${this.exam}&filter[question]=${question.id}&page[size]=10000` +
                (comment ? `&filter[comment-master]=${comment.id}` : "") +
                (tag ? `&filter[tags][]=${tag.id}` : "") +
                (grader ? `&filter[grader]=${grader.id}` : "")
        );
        let json = await resp.json();
        return deserialize(json).data;
    }

    async fetchInfoForBookletsByQuestion(question, bookletNumbers) {
        // When we fetch from the API we get data for every question.
        // However we only want data for one question, so filter out the
        // irrelevant data.
        function filterInfo(info) {
            if (!info) {
                return info;
            }
            const qSlug = question.slug;
            const qSequence = question.sequence;
            const qPage = question["exam-master-page"].number;
            const {
                annotations = [],
                evaluations = [],
                "exam-pages": examPages,
                "exam-questions": examQuestions,
                ...ret
            } = info;

            ret.annotations = annotations.filter(
                x => x["exam-page"].number === qPage
            );
            ret.evaluations = evaluations.filter(
                x => x["exam-master-question-slug"] === qSlug
            );
            ret["exam-page"] = examPages.find(x => x.number === qPage);
            ret["exam-question"] = examQuestions.find(
                x => x.sequence === qSequence
            );
            ret.taggings = ret["exam-question"].taggings || [];
            ret.slug = qSlug;

            return ret;
        }

        const promises = bookletNumbers.map(num =>
            logFetch(
                `/api/v2/exams?filter[exam-master]=${this.exam}&filter[sequence]=${num}` +
                    `&include[]=exam-pages&include[]=exam-pages.exam-master-page&include[]=exam-pages.annotations` +
                    `&include[]=exam-questions&include[]=exam-questions.exam&include[]=exam-questions.anchored-to-exam-page` +
                    `&include[]=evaluations&include[]=evaluations.marker&include[]=annotations&include[]=exam-questions.taggings`
            )
        );
        let resp = await Promise.all(promises);
        let json = await Promise.all(resp.map(x => x.json()));
        const result = json.map(x => deserialize(x).data[0]);
        return result.map(filterInfo);
    }

    async fetchMatched() {
        const resp = await logFetch(`/api/v2/grading-grids/${this.exam}`);
        const json = await resp.json();
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

export const exam = new ExamInfo();

export function formatQuestion(question) {
    const evalId = "" + question["exam-question"]["primary-evaluation-id"];
    const evaluation = (question["evaluations"] || []).find(
        x => "" + x.id === evalId
    );
    return {
        src: question["exam-page"].url,
        bookletNumber: question.sequence,
        points: question["exam-question"].points,
        maxPoints: question["exam-question"]["max-points"],
        label: question["exam-question"].label,
        w: question["exam-page"].width,
        h: question["exam-page"].height,
        page: question["exam-page"].number,
        uploaded: question["exam-page"].uploaded,
        evalId: evalId,
        annotations: question.annotations.filter(
            x => x.evaluation.id === evalId
        ),
        evaluation: evaluation,
        slug: (evaluation || {})["exam-master-question-slug"] || question.slug
    };
}
