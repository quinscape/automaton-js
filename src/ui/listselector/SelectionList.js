import React, {useMemo, useRef, useState} from "react";
import cx from "classnames";
import i18n from "../../i18n";
import {Icon} from "domainql-form";
import PropTypes from "prop-types";

function elementComparator(element0, element1) {
    const label0 = element0.label ?? element0.name;
    const label1 = element1.label ?? element1.name;

    return label0 < label1 ? -1 : 1;
}

const SelectionList = (props) => {
    const {
        header,
        elements: elementsFromProps,
        selected,
        autoSort,
        onChange,
        showSearch,
        onMoveElementClick
    } = props;

    const sortable = typeof onMoveElementClick === "function";

    const [searchValue, setSearchValue] = useState("");
    const searchFieldRef = useRef();

    if(sortable && autoSort) {
        console.warn("SelectionList is set to be both manually sortable and automatically sorted, only one may be set at a time. Manual sorting will be ignored.");
    }

    function selectElement(element) {
        onChange(element);
    }

    const elements = useMemo(() => {
        if (searchValue !== "") {
            const filteredElements = elementsFromProps.filter((element) => {
                const elementValue = element.label ?? element.name;
                return elementValue?.toLowerCase().includes(searchValue) ?? false;
            });
            if (autoSort) {
                return filteredElements.sort(elementComparator);
            }
            return filteredElements;
        } else if (autoSort) {
            return elementsFromProps.sort(elementComparator)
        }
        return elementsFromProps;
    }, [elementsFromProps, searchValue, autoSort]);

    return (
        <div className="d-flex flex-column flex-fill m-4 selection-list-container">
            <div className="font-weight-bold selection-list-header">
                { header }
            </div>
            {
                showSearch && (
                    <div className="form-group form-row">
                        <div className="input-group-prepend">
                            <span className="input-group-text">
                                <Icon className="fa-search"/>
                            </span>
                        </div>
                        <input
                            onChange={(event) => {
                                setSearchValue(event.target.value.toLowerCase());
                            }}
                            value={searchValue}
                            ref={searchFieldRef}
                        />
                        <div className="input-group-append">
                            <button
                                className="btn btn-light border"
                                onClick={() => {
                                    setSearchValue("");
                                    searchFieldRef.current?.focus();
                                }}
                            >
                                <Icon className="fa-eraser mr-1"/>
                                {
                                    i18n("Clear")
                                }
                            </button>
                        </div>
                    </div>
                )
            }
            <div className="d-flex flex-row flex-fill">
                <ul className="flex-fill selection-list list-group border rounded">
                    {
                        elements.length < 1
                            ? (<span className="m-2 font-italic">{i18n("No Elements")}</span>)
                            : elements.map((element, index) => {
                                return (
                                    <li
                                        key={index}
                                        className={cx("p-2 list-group-item selection-list-element", selected === element.name && "active")}
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
                                title={i18n("Move Element Up")}
                            >
                                <Icon className="fa-chevron-up m-0"/>
                            </button>
                            <button
                                type="button"
                                className="btn btn-outline-primary my-1"
                                onClick={ () => {
                                    onMoveElementClick(1);
                                } }
                                title={i18n("Move Element Down")}
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

SelectionList.propTypes = {
    /**
     * the header of the list
     */
    header: PropTypes.string,

    /**
     * the elements of the list
     */
    elements: PropTypes.array.isRequired,

    /**
     * the selected item in the list
     */
    selected: PropTypes.string,

    /**
     * whether the list should be automatically sorted, mutually exclusive with onMoveElementClick being set
     */
    autoSort: PropTypes.bool,

    /**
     * the function called on changes to the list
     */
    onChange: PropTypes.func,

    /**
     * if the search bar should be shown or not
     */
    showSearch: PropTypes.bool,

    /**
     * the function called on elements being moved by the user, mutually exclusive with autoSort
     */
    onMoveElementClick: PropTypes.func
}

export default SelectionList;
