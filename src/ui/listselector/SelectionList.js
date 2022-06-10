import React from "react";
import cx from "classnames";
import i18n from "../../i18n";
import {Icon} from "../../../../domainql-form";
import PropTypes from "prop-types";

function elementComparator(element0, element1) {
    const label0 = element0.label ?? element0.name;
    const label1 = element1.label ?? element1.name;

    return label0 < label1 ? -1 : 1;
}

const SelectionList = (props) => {
    const {
        header,
        elements,
        selected,
        autoSort,
        onChange,
        onMoveElementClick
    } = props;

    const sortable = typeof onMoveElementClick === "function";

    if(sortable && autoSort) {
        console.warn("SelectionList is set to be both manually sortable and automatically sorted, only one may be set at a time. Manual sorting will be ignored.");
    }

    function selectElement(element) {
        onChange(element);
    }

    const sortedElements = autoSort
        ? elements.sort(elementComparator)
        : elements;

    return (
        <div className="selection-list-container">
            <div className="selection-list-header">
                { header }
            </div>
            <div className="d-flex flex-row">
                <ul className="selection-list list-group">
                    {
                        sortedElements.length < 1
                            ? (<span>{i18n("No Elements")}</span>)
                            : sortedElements.map((element, index) => {
                                return (
                                    <li
                                        key={index}
                                        className={cx("selection-list-element list-group-item p-2", selected === element.name && "active")}
                                        onClick={(event) => {
                                            selectElement(element);
                                        }}
                                    >
                                        { element.label || element.name }
                                    </li>
                                )
                            })
                    }
                </ul>
                {
                    (sortable && !autoSort) && (
                        <div className="d-flex flex-column justify-content-center align-items-center m-2">
                            <button
                                type="button"
                                className="btn btn-outline-primary my-1"
                                onClick={ () => {
                                    onMoveElementClick(-1);
                                } }
                                title={i18n("move element up")}
                            >
                                <Icon className="fa-chevron-up m-0"/>
                            </button>
                            <button
                                type="button"
                                className="btn btn-outline-primary my-1"
                                onClick={ () => {
                                    onMoveElementClick(1);
                                } }
                                title={i18n("move element down")}
                            >
                                <Icon className="fa-chevron-down m-0"/>
                            </button>
                        </div>
                    )
                }
            </div>
        </div>
    )
}

SelectionList.PropTypes = {
    /**
     * the header of the list
     */
    header: PropTypes.string,

    /**
     * the elements of the list
     */
    elements: PropTypes.array,

    /**
     * the selected item in the list
     */
    selected: PropTypes.object,

    /**
     * whether the list should be automatically sorted, mutually exclusive with onMoveElementClick being set
     */
    autoSort: PropTypes.bool,

    /**
     * the function called on changes to the list
     */
    onChange: PropTypes.func,

    /**
     * the function called on elements being moved by the user, mutually exclusive with autoSort
     */
    onMoveElementClick: PropTypes.func
}

export default SelectionList;
