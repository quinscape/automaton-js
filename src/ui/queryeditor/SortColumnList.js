import React, {useEffect, useRef, useState} from "react";
import SortColumnListElement from "./SortColumnListElement";
import {ButtonToolbar} from "reactstrap";
import {Icon} from "../../../../domainql-form";
import i18n from "../../i18n";
import SelectionListModal from "../listselector/SelectionListModal";
import PropTypes from "prop-types";

const SortColumnList = (props) => {
    const {
        disabled,
        allColumns,
        sortColumns: sortColumnsFromProps,
        onChange
    } = props;

    const [sortColumns, setSortColumns] = useState([]); // value, label, asc/desc ("A", "D")
    const [isModalOpen, setModalOpen] = useState(false);

    useEffect(() => {
        setSortColumns(sortColumnsFromProps);
    }, [sortColumnsFromProps]);

    const selectableColumns = allColumns.filter((element) => {
        return !sortColumns.some((sortColumnElement) => {
            return sortColumnElement.name === element.name;
        });
    })

    return (
        <>
            <ul
                className="sort-column-list list-group"
            >
                {
                    sortColumns.map((sortColumnElement, idx) => {
                        return (
                            <SortColumnListElement
                                key={sortColumnElement.name}
                                sortColumnElement={sortColumnElement}
                                disabled={disabled}
                                removeElement={(element) => {
                                    if (sortColumns.includes(element)) {
                                        const index = sortColumns.indexOf(element);
                                        const newSortColumnList = [
                                            ... sortColumns.slice(0, index),
                                            ... sortColumns.slice(index + 1)
                                        ];

                                        setSortColumns(newSortColumnList);
                                        onChange(newSortColumnList);
                                    }
                                }}
                                toggleElementOrder={(element) => {
                                    if (sortColumns.includes(element)) {
                                        const index = sortColumns.indexOf(element);
                                        const newSortColumnList = [
                                            ... sortColumns.slice(0, index),
                                            {
                                                ...element,
                                                order: element.order === "A" ? "D" : "A"
                                            },
                                            ... sortColumns.slice(index + 1)
                                        ];

                                        setSortColumns(newSortColumnList);
                                        onChange(newSortColumnList);
                                    }
                                }}
                            />
                        )
                    })
                }
            </ul>
            <ButtonToolbar className="mt-2">
                <button
                    type="Button"
                    className="btn btn-light"
                    onClick={() => {
                        setModalOpen(true);
                    }}
                    disabled={disabled}
                >
                    <Icon className="fa-plus mr-1"/>
                    {
                        i18n("Add Sort Column")
                    }
                </button>
            </ButtonToolbar>
            <SelectionListModal
                modalHeader={i18n("Select Sort Column")}
                toggle={() => {
                    setModalOpen(!isModalOpen);
                }}
                isOpen={isModalOpen}
                elements={selectableColumns}
                resetOnSubmit
                showSearch
                onSubmit={(elementName) => {
                    const foundElement = allColumns.find((current) => {
                        return current.name === elementName;
                    });
                    const newSortColumns = [
                        ... sortColumns,
                        {
                            ...foundElement,
                            order: "A"
                        }
                    ];
                    setSortColumns(newSortColumns);
                    onChange(newSortColumns);
                }}
            />
        </>
    )
}

SortColumnList.propTypes = {
    /**
     * indicates if this module is disabled
     */
    disabled: PropTypes.bool,

    /**
     * all columns available to be selected as sort columns
     */
    allColumns: PropTypes.arrayOf(PropTypes.object).isRequired,

    /**
     * optional input sort columns, if provided these will be loaded
     */
    sortColumns: PropTypes.arrayOf(PropTypes.object),

    /**
     * callback function called when the sort column list changes
     */
    onChange: PropTypes.func
}

export default SortColumnList;
