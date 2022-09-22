import React from "react";
import i18n from "../../../i18n";

const IconCell = (props) => {
    const {
        flags,
        valueToRenderDataMap
    } = props;

    if (flags == null || flags.trim() === "") {
        return null;
    }

    const flagArray = flags.split(",").map(flag => flag.trim());
    const renderDataArray = [];
    for (const flag of flagArray) {
        renderDataArray.push(valueToRenderDataMap.get(flag))
    }

    let key = 0;

    return (
        <React.Fragment>
            {
                renderDataArray.map(
                    renderData =>
                        <span title={i18n(renderData.text)} key={key++}>
                            {
                                renderData.text
                            }
                        </span>
                )
            }
        </React.Fragment>
    );
}

export default IconCell;
