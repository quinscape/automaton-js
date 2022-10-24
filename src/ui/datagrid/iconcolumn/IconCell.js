import React from "react";
import { Icon } from "domainql-form";
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
                    renderData => {
                        const icon = renderData.icon ? (
                            <span title={i18n(renderData.text)} key={key++}>
                                <Icon
                                    className={renderData.icon}
                                />
                            </span>
                        ) : (<span key={key++} />);

                        return icon;
                    }
                )
            }
        </React.Fragment>
    );
}

export default IconCell;
