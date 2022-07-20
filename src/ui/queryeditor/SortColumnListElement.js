import React from "react";
import i18n from "../../i18n";
import {Icon} from "../../../../domainql-form";
import cx from "classnames";

const SortColumnListElement = (props) => {
    const {
        disabled,
        sortColumnElement,
        removeElement,
        toggleElementOrder
    } = props;

    const {
        name,
        label,
        order
    } = sortColumnElement;

    return (
        <li
            className="sort-column-list-element d-flex justify-content-between align-items-center"
        >
            <button
                type="Button"
                className="btn btn-link m-0 p-0"
                title={
                    i18n(order === "A" ? "Toggle Order; Current: Ascending" : "Toggle Order; Current: Descending")
                }
                onClick={
                    () => toggleElementOrder(sortColumnElement)
                }
                disabled={disabled}
            >
                <Icon className={cx(order === "A" ? "fa-arrow-up" : "fa-arrow-down")}/>
            </button>
            <div
                className="sort-column-list-element-text flex-grow-1 mx-2"
            >
                {
                    label != null ? label : name
                }
            </div>
            <button
                type="Button"
                className="btn btn-link m-0 p-0"
                title={
                    i18n("Remove")
                }
                onClick={
                    () => removeElement(sortColumnElement)
                }
                disabled={disabled}
            >
                <Icon className="fa-times"/>
            </button>
        </li>
    )
}

export default SortColumnListElement;
