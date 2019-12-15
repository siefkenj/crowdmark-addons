import React from "react";

/**
 * A slider to select the zoom level of a question
 *
 * @export
 * @param {{value: number, setValue: function}} props
 * @returns
 */
export function SizeSelect(props) {
    const { value, setValue } = props;
    return (
        <span style={{ display: "inline-flex", alignItems: "baseline" }}>
            <input
                style={{
                    width: "3em",
                    marginLeft: ".5em",
                    marginRight: ".5em"
                }}
                type="range"
                id="viewport-size"
                min={-2}
                max={2}
                step={1}
                value={value}
                onChange={e => {
                    setValue(+e.target.value);
                }}
            ></input>
            <label htmlFor="viewport-size">
                Question Size{" "}
                {value !== 0
                    ? `(${value > 0 ? "+" : ""}${value})`
                    : "(default)"}
            </label>
        </span>
    );
}
