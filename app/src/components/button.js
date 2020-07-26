import React from "react";
import classNames from "classnames";

export function Button(props) {
    const { spinner, children, active, ...rest } = props;
    return (
        <button
            className={classNames(
                "button",
                { "icon--spinner": spinner },
                { "button--warning": active }
            )}
            {...rest}
        >
            {children}
        </button>
    );
}
