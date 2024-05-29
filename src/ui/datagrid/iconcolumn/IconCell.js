import React from "react";
import { Icon } from "domainql-form";
import i18n from "../../../i18n";

const IconCell = (props) => {
    const {
        flags,
        valueToRenderDataMap,
        hideUnmappedFlags
    } = props;

    if (flags == null || flags.trim() === "") {
        return null;
    }

    const flagArray = flags.split(",").map(flag => flag.trim());
    const renderDataArray = [];
    for (const flag of flagArray) {
        if (typeof flag === "string") {
            const data = valueToRenderDataMap.get(flag);
            if (data != null && typeof data.icon === "string" && data.icon !== "") {
                const {icon, text = flag} = data;
                renderDataArray.push({icon, text});
            } else if (!hideUnmappedFlags) {
                renderDataArray.push(flag);
            }
        }
    }

    let key = 0;

    return (
        <React.Fragment>
            {
                renderDataArray.map(
                    renderData =>  renderData.icon ? (
                        <span key={key++} className="icon-cell" title={i18n(renderData.text)}>
                            <Icon
                                className={renderData.icon}
                            />
                        </span>
                    ) : (
                        <span key={key++}>
                            {renderData}
                        </span>
                    )
                )
            }
        </React.Fragment>
    );
}

export default IconCell;
