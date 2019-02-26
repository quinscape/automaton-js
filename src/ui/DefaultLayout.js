import React from "react"

const DefaultLayout = props => {

    const { children } = props;

    return (
        <div className="container default-layout">
            {
                children
            }
        </div>
    )
};

export default DefaultLayout
