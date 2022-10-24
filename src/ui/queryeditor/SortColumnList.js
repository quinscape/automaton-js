import React, {useEffect, useRef, useState} from "react";
import SortColumnListElement from "./SortColumnListElement";
import {ButtonToolbar} from "reactstrap";
import {Icon} from "../../../../domainql-form";
import i18n from "../../i18n";
import PropTypes from "prop-types";
import { removeFromObjectAtPath, setInObjectAtPathImmutable } from "../../util/mutateObject";
import SelectionTreeModal from "../treeselection/SelectionTreeModal";
import { createTreeRepresentationForInputSchema, createTreeRepresentationForInputSchemaByPath } from "../../util/inputSchemaUtilities";

// TODO outsource selectiontreemodal code as it is used at least 3 times

const SortColumnList = (props) => {
    const {
        rootType,
        disabled,
        sortColumns: sortColumnsFromProps,
        valueRenderer,
        onChange,
        schemaResolveFilterCallback
    } = props;

    const [sortColumns, setSortColumns] = useState([]); // value, label, asc/desc ("A", "D")
    const [isModalOpen, setModalOpen] = useState(false);
    const [columnTreeObject, setColumnTreeObject] = useState({});

    useEffect(() => {
        setSortColumns(sortColumnsFromProps);
    }, [sortColumnsFromProps]);

    useEffect(() => {
        setColumnTreeObject(createTreeRepresentationForInputSchema(rootType, {
            filterCallback: schemaResolveFilterCallback
        }));
    }, [rootType]);

    function expandDirectory(path) {
        const directoryContents = createTreeRepresentationForInputSchemaByPath(rootType, path, {
            filterCallback: schemaResolveFilterCallback
        });
        const result = {};
        if (setInObjectAtPathImmutable(columnTreeObject, path, directoryContents, result)) {
            setColumnTreeObject(result);
        }
    }

    function collapseDirectory(path) {
        const result = {};
        if (setInObjectAtPathImmutable(columnTreeObject, path, {}, result)) {
            setColumnTreeObject(result);
        }
    }

    const selectableColumns = structuredClone(columnTreeObject);
    for (const column of sortColumns) {
        removeFromObjectAtPath(selectableColumns, column.name)
    }

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
                                renderer={valueRenderer}
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
                        i18n("QueryEditor:Add Sort Column")
                    }
                </button>
            </ButtonToolbar>
            
            <SelectionTreeModal
                className="sort-column-modal"
                modalHeader={i18n("QueryEditor:Select Sort Column")}
                toggle={() => setModalOpen(!isModalOpen)}
                isOpen={isModalOpen}
                valueRenderer={valueRenderer}
                singleSelect
                onSubmit={(elementName) => {
                    if (elementName.length > 0) {
                        const newSortColumns = [
                            ... sortColumns,
                            {
                                name: elementName[0],
                                order: "A"
                            }
                        ];
                        setSortColumns(newSortColumns);
                        onChange(newSortColumns);
                    }
                }}
                treeContent={selectableColumns}
                onExpandDirectory={expandDirectory}
                onCollapseDirectory={collapseDirectory}
            />
        </>
    )
}

SortColumnList.propTypes = {

    /**
     * the root type of the tree, used to resolve catalogs
     */
    rootType: PropTypes.string.isRequired,

    /**
     * indicates if this module is disabled
     */
    disabled: PropTypes.bool,

    /**
     * optional input sort columns, if provided these will be loaded
     */
    sortColumns: PropTypes.arrayOf(PropTypes.object),

    /**
     * the renderer for the selection tree elements and selected columns
     */
    valueRenderer: PropTypes.func,

    /**
     * callback function called when the sort column list changes
     */
    onChange: PropTypes.func,

    /**
     * Callback to filter schema catalog resolver
     */
    schemaResolveFilterCallback: PropTypes.func
}

export default SortColumnList;
