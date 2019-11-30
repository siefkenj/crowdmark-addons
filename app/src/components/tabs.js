import React from "react";
import { Button } from "./button";

export function Tabs(props) {
    const { tabNames, activeTab, setActiveTab, children } = props;
    return (
        <>
            <div>
                {tabNames.map((name, i) => (
                    <Button
                        key={i}
                        active={+activeTab === i}
                        onClick={() => {
                            setActiveTab(i);
                        }}
                        style={{ marginLeft: 5 }}
                    >
                        {name}
                    </Button>
                ))}
            </div>
            <div>{React.Children.toArray(children)[activeTab] || null}</div>
        </>
    );
}
