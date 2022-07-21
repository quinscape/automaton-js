import React, {useEffect, useMemo, useState} from "react";
import TokenList from "../token/TokenList";
import SelectionTreeModal from "../treeselection/SelectionTreeModal";
import i18n from "../../i18n";
import ConditionEditor from "../condition/ConditionEditor";
import cx from "classnames";
import flattenObject from "../../util/flattenObject";
import SortColumnList from "./SortColumnList";
import ConditionEditorScope from "./ConditionEditorScope";
import {FormContext, Icon} from "domainql-form";
import {ButtonToolbar} from "reactstrap";
import ColumnSelect from "./ColumnSelect";

const ORIGINS = {
    CONDITION_EDITOR_FIELD_SELECTION: "ConditionEditorFieldSelection",
    FIELD_SELECTION_TOKEN_LIST: "FieldSelectionTokenList",
    FIELD_SELECTION_TREE: "FieldSelectionTree"
}

const QueryEditor = (props) => {
    const {
        header,
        columnNameRenderer,
        availableColumnTreeObject,
        formContext = FormContext.getDefault(),
        rootType,
        saveButtonText,
        saveButtonOnClick,
        className
    } = props;

    const availableColumnList = Object.keys(flattenObject(availableColumnTreeObject)).map((element) => {
        return {
            name: element,
            label: columnNameRenderer ? columnNameRenderer(element, {
                origin: ORIGINS.CONDITION_EDITOR_FIELD_SELECTION
            }) : element
        }
    });

    // scope
    const conditionEditorScope = useMemo(() => {
        return new ConditionEditorScope(rootType);
    }, [rootType]);

    // data states
    const [selectedColumns, setSelectedColumns] = useState([]);
    const [queryCondition, setQueryCondition] = useState({});
    const [sortColumns, setSortColumns] = useState([]);

    // renderers
    const tokenListRenderer = columnNameRenderer ? (value, options = {}) => {
        return columnNameRenderer(value, {
            ... options,
            origin: ORIGINS.FIELD_SELECTION_TOKEN_LIST
        });
    } : null;

    const fieldSelectionTreeRenderer = columnNameRenderer ? (value, options = {}) => {
        return columnNameRenderer(value, {
            ... options,
            origin: ORIGINS.FIELD_SELECTION_TREE
        });
    } : null;

    return (
        <div className={cx("query-editor", className)}>
            <div>
                {
                    typeof header === "function" ? header() : (
                        <h3>
                            {
                                header
                            }
                        </h3>
                    )
                }
            </div>
            <ColumnSelect
                availableColumnTreeObject={availableColumnTreeObject}
                selectedColumns={selectedColumns}
                tokenListRenderer={tokenListRenderer}
                fieldSelectionTreeRenderer={fieldSelectionTreeRenderer}
                onChange={(tokenList) => {
                    setSelectedColumns(tokenList);
                }}
            />
            <div>
                <ConditionEditor
                    rootType={conditionEditorScope.rootType}
                    container={conditionEditorScope}
                    path="condition"
                    fields={availableColumnList}
                    formContext={formContext}
                    //TODO: enable loading existing data through prop
                    onChange={(queryCondition) => {
                        setQueryCondition(queryCondition);
                    }}
                />
            </div>
            <div>
                <SortColumnList
                    allColumns={availableColumnList}
                    //TODO: enable loading existing data through prop
                    onChange={(sortColumnList) => {
                        setSortColumns(sortColumnList);
                    }}
                />
            </div>
            <ButtonToolbar>
                <button
                    type="Button"
                    className="btn btn-light"
                    onClick={() => {
                        const queryConfiguration = {
                            select: selectedColumns,
                            where: queryCondition,
                            sort: sortColumns.map((sortColumnElement) => {
                                const {name, order} = sortColumnElement;
                                return `${order === "D" ? "!" : ""}${name}`;
                            })
                        };
                        saveButtonOnClick(queryConfiguration);
                    }}
                >
                    {
                        saveButtonText ?? (
                            <>
                                <Icon className="fa-save mr-1"/>
                                {
                                    i18n("Save")
                                }
                            </>
                        )
                    }
                </button>
            </ButtonToolbar>
        </div>
    )
}

QueryEditor.ORIGIN_CONDITION_EDITOR_FIELD_SELECTION = ORIGINS.CONDITION_EDITOR_FIELD_SELECTION;
QueryEditor.ORIGIN_FIELD_SELECTION_TOKEN_LIST = ORIGINS.FIELD_SELECTION_TOKEN_LIST;
QueryEditor.ORIGIN_FIELD_SELECTION_TREE = ORIGINS.FIELD_SELECTION_TREE;

export default QueryEditor;
