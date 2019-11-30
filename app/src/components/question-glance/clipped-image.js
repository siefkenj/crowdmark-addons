import React from "react";

/**
 * Display a clipped version of the supplied image
 *
 * @export
 * @param {*} props
 * @returnType {React.Element}
 */
export function ClippedImage(props) {
    const {
        src,
        boundingBox = { x: 190, y: 295, w: 1000, h: 300 },
        noclip,
        allowSelect,
        label,
        setSelection: _setSelection
    } = props;
    const canvasRef = React.useRef(null);
    const imgRef = React.useRef(null);
    // the native dimensions of the image
    const [nativeDim, setNativeDim] = React.useState({ w: 100, h: 100 });
    const [selectedDim, setSelectedDim] = React.useState({
        x: 0,
        y: 0,
        w: 0,
        h: 0
    });
    const x = noclip ? 0 : boundingBox.x;
    const y = noclip ? 0 : boundingBox.y;
    const w = noclip ? nativeDim.w : boundingBox.w;
    const h = noclip ? nativeDim.h : boundingBox.h;
    function setSelection(clip) {
        // normalize clip so there are no negative widths or heights
        clip = { ...clip };
        if (clip.w < 0) {
            const origX = clip.x;
            clip.x += clip.w;
            clip.w = origX - clip.x;
        }
        if (clip.h < 0) {
            const origY = clip.y;
            clip.y += clip.h;
            clip.h = origY - clip.y;
        }
        if (_setSelection) {
            _setSelection(clip);
        }
    }
    
    React.useEffect(() => {
        const canvas = canvasRef.current;
        const ctx = canvas.getContext("2d");
        //const img = new Image();
        const img = imgRef.current;
        img.onload = () => {
            setNativeDim({ w: img.width, h: img.height });
            ctx.drawImage(img, -x, -y);
            // If there is a label, draw it *proportionally* in the right spot
            if (label) {
                ctx.fillStyle = "green";
                ctx.font = "bold 30pt serif";
                ctx.fillText(
                    label.label,
                    label.x * nativeDim.w - x,
                    label.y * nativeDim.h - y
                );
            }
            if (selectedDim && selectedDim.w !== 0 && selectedDim.h !== 0) {
                ctx.fillStyle = "rgba(63, 127, 191, 0.58)";
                ctx.fillRect(
                    selectedDim.x,
                    selectedDim.y,
                    selectedDim.w,
                    selectedDim.h
                );
            }
        };
        img.src = src;
    }, [src, label, selectedDim, nativeDim.w, nativeDim.h, x, y]);
    // Turn mouse coordinates into canvas coordinates (relative to the relavent image)
    function getCoordinates(event) {
        if (!canvasRef.current) {
            return;
        }
        const canvas = canvasRef.current;
        return {
            x: (event.nativeEvent.offsetX * canvas.width) / canvas.clientWidth,
            y: (event.nativeEvent.offsetY * canvas.height) / canvas.clientHeight
        };
    }
    function onClick(event) {
        if (allowSelect) {
            setSelection(selectedDim);
        }
    }
    function onMouseDown(event) {
        const coords = getCoordinates(event);
        if (allowSelect) {
            setSelectedDim({ ...coords, w: 0, h: 0 });
        }
    }
    function onMouseMove(event) {
        if (allowSelect) {
            if (event.buttons === 1) {
                const coords = getCoordinates(event);
                setSelectedDim({
                    x: selectedDim.x,
                    y: selectedDim.y,
                    w: coords.x - selectedDim.x,
                    h: coords.y - selectedDim.y
                });
            }
        }
    }
    // If we are dragging a selection and the mouse leaves,
    // assume we want to keep the selection as dragged
    // up until leaving
    function onMouseLeave(event) {
        if (allowSelect && event.buttons===1) {
            setSelection(selectedDim);
        }
    }
    return (
        <div
            style={{
                width: "100%",
                border: "1px dashed black",
                position: "relative",
                display: "inline-block"
            }}
        >
            <canvas
                ref={canvasRef}
                style={{
                    backgroundColor: "orange",
                    width: "100%",
                    display: "block"
                }}
                width={w}
                height={h}
                onClick={onClick}
                onMouseMove={onMouseMove}
                onMouseDown={onMouseDown}
                onMouseLeave={onMouseLeave}
            />
            <img ref={imgRef} style={{ display: "none" }} alt="" />
        </div>
    );
}
