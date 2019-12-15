import React from "react";
import { log } from "../../utils";
import { formatQuestion } from "../../exam-info";

/**
 * Renders text to a canvas element and wraps it if it gets too long
 * Modified from https://stackoverflow.com/questions/22998551/how-to-paragraph-text-drawn-onto-canvas
 *
 * @param {*} ctx
 * @param {*} text
 * @param {*} x
 * @param {*} y
 * @param {*} maxWidth
 * @param {*} fontSize
 */
function wrapText(ctx, text, x, y, maxWidth = 250, fontSize = 16) {
    var words = text.split(" ");
    var line = "";
    var lineHeight = fontSize + 2;
    ctx.font = fontSize + "px Arial";
    ctx.textBaseline = "top";
    for (var n = 0; n < words.length; n++) {
        var testLine = line + words[n] + " ";
        var metrics = ctx.measureText(testLine);
        var testWidth = metrics.width;
        if (testWidth > maxWidth) {
            ctx.fillText(line, x, y);
            line = words[n] + " ";
            y += lineHeight;
        } else {
            line = testLine;
        }
    }
    ctx.fillText(line, x, y);
    return y + lineHeight;
}

function renderQuestionToCanvas(q, ctx, img) {
    ctx.drawImage(img, 0, 0);
    // Draw each type of annotation
    // Annotations are normalized so that the width if the image is always 1000
    const ratio = q.w / 1000;
    ctx.save();
    ctx.scale(ratio, ratio);
    // BoxAnnotation
    for (const ann of q.annotations.filter(x => x.type === "BoxAnnotation")) {
        ctx.save();
        ctx.fillStyle = ann.metadata.colour;
        ctx.globalAlpha = 0.3;
        ctx.fillRect(
            ann.metadata.x,
            ann.metadata.y,
            ann.metadata.width,
            ann.metadata.height
        );
        ctx.restore();
    }
    // PreformedAnnotation pr FreeformAnnotation
    for (const ann of q.annotations.filter(
        x => x.type === "PreformedAnnotation" || x.type === "FreeformAnnotation"
    )) {
        ctx.save();
        ctx.fillStyle = ann.metadata.colour;
        ctx.strokeStyle = ann.metadata.colour;
        ctx.lineWidth = 3;
        ctx.stroke(new Path2D(ann.metadata.d));
        ctx.restore();
    }
    // CommentAnnotation
    for (const ann of q.annotations.filter(
        x => x.type === "CommentAnnotation"
    )) {
        // The coordinates of comment annotations are given
        // as percentages
        const MAX_WIDTH = 250;
        ctx.save();
        const x = ann.metadata.x * 10;
        const y = ((ann.metadata.y / 100) * q.h) / ratio;
        // Always draw blue text so it's readable. The outline box will be a different color
        ctx.fillStyle = "blue";
        // Draw the text
        const bottom = wrapText(ctx, ann.metadata.text, x, y, MAX_WIDTH);
        // Draw a border
        ctx.strokeStyle = ann.metadata.colour;
        ctx.lineWidth = 2;
        ctx.strokeRect(x - 5, y - 5, MAX_WIDTH + 10, bottom - y + 10);
        if (ann.points) {
            // Draw the points
            ctx.fillStyle =
                ann.points < 0 ? "red" : ann.points > 0 ? "green" : "black";
            ctx.textAlign = "end";
            ctx.textBaseline = "top";
            ctx.fontSize = 16;
            ctx.fillText(`(${ann.points})`, x - 9, y);
        }
        ctx.restore();
    }
    ctx.restore();
}

/**
 * Renders a crowdmark question with annotations and possibly cropped.
 * The aspect ratio is contrained if the question is cropped
 *
 * @param {{question: object, crop?:{x:number, y:number, w:number, h:number}}} props
 * @returnType {React.Node}
 */
export function RenderedQuestion(props) {
    const { question, crop, ...rest } = props;
    // extract the needed information from the question
    const q = formatQuestion(question);
    const boundingBox = { x: 0, y: 0, w: q.w, h: q.h };
    // If we passed in a crop, set the bounding box differently
    if (crop) {
        let wRat = q.w;
        let hRat = q.h;
        // if we passed in crop arguments bigger than 1, we didn't
        // use ratios, and instead used actual pixel values
        if (Object.values(crop).some(x => x > 1)) {
            wRat = 1;
            hRat = 1;
        }
        Object.assign(boundingBox, {
            x: crop.x * wRat,
            y: crop.y * hRat,
            // We don't allow regions smaller than 20x20
            w: Math.max(crop.w * wRat, 20),
            h: Math.max(crop.h * hRat, 20)
        });
        // If the aspect ratio is too bad, expand one of the dimensions
        if (boundingBox.w / boundingBox.h > 15) {
            boundingBox.h = boundingBox.w / 15;
        }
        if (boundingBox.h / boundingBox.w > 15) {
            boundingBox.w = boundingBox.h / 15;
        }
    }
    const canvasRef = React.useRef(null);
    const imgRef = React.useRef(null);
    React.useEffect(() => {
        if (!canvasRef.current || !imgRef.current) {
            return;
        }
        const ctx = canvasRef.current.getContext("2d");
        const img = imgRef.current;
        img.onload = () => {
            try {
                ctx.translate(-boundingBox.x, -boundingBox.y);
                renderQuestionToCanvas(q, ctx, img);
            } catch (e) {
                log(e);
            }
        };
        // eslint-disable-next-line
    }, [q.evalId]);
    return (
        <div {...rest}>
            <canvas
                ref={canvasRef}
                width={boundingBox.w}
                height={boundingBox.h}
                style={{
                    width: "100%",
                    minWidth: 100,
                    backgroundColor: "orange"
                }}
            />
            <img ref={imgRef} src={q.src} alt="" style={{ display: "none" }} />
        </div>
    );
}
