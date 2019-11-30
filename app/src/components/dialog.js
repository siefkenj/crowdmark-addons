import React from "react";
import ReactDOM from "react-dom";
import classNames from "classnames";

export function Dialog(props) {
    const { visible, onClose, children, title } = props;
    return ReactDOM.createPortal(
        <div
            className={classNames("cm-modal__backdrop", { visible: visible })}
            onClick={onClose}
        >
            <div
                className={classNames("cm-modal__container", {
                    visible: visible
                })}
                style={{
                    width: "calc(100% - 2em)",
                    height: "calc(100% - 2em)",
                    display: "flex",
                    flexDirection: "column",
                    position: "relative",
                    paddingRight: "5px",
                    paddingBottom: "5px"
                }}
                onClick={e => {
                    // Clicking on the border will close the dialog. We
                    // don't want clicking on the content to close the dialog!
                    e.stopPropagation();
                }}
            >
                <h2>{title}</h2>
                <button className="cm-modal__close" onClick={onClose}></button>
                <div style={{ flexGrow: 1, overflow: "auto" }}>
                    <div className="dialog-content">{children}</div>
                </div>
            </div>
        </div>,
        document.body
    );
}
