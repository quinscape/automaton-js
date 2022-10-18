import React, {useEffect, useMemo, useState} from "react";
import i18n from "../../i18n";
import ConditionEditor from "../condition/ConditionEditor";
import cx from "classnames";
import SortColumnList from "./SortColumnList";
import ConditionEditorScope from "./ConditionEditorScope";
import {FormContext, Icon} from "domainql-form";
import {ButtonToolbar} from "reactstrap";
import ColumnSelect from "./ColumnSelect";
import PropTypes from "prop-types";
import { getFieldDataByPath, getTableNameByPath } from "../../util/inputSchemaUtilities";

const ORIGINS = {
    CONDITION_EDITOR_FIELD_SELECTION: "ConditionEditorFieldSelection",
    FIELD_SELECTION_TOKEN_LIST: "FieldSelectionTokenList",
    FIELD_SELECTION_TREE: "FieldSelectionTree"
}

const QueryEditor = (props) => {
    const {
        header,
        columnNameRenderer,
        formContext = FormContext.getDefault(),
        rootType,
        saveButtonText,
        saveButtonOnClick,
        queryConfiguration,
        schemaResolveFilterCallback,
        className
    } = props;

    const valueRenderer = useMemo(() => {
        if (typeof columnNameRenderer === "function") {
            return (pathName, nodeData = {}) => {
                const tablePathName = pathName.split(".").slice(0, -1).join(".");
                return columnNameRenderer(pathName, {
                    ...nodeData,
                    rootType,
                    tableName: getTableNameByPath(rootType, tablePathName),
                    fieldData: getFieldDataByPath(rootType, pathName)
                });
            }
        }
    }, [columnNameRenderer]);

    // scope
    const conditionEditorScope = useMemo(() => {
        return new ConditionEditorScope(rootType);
    }, [rootType]);

    // data states
    const [selectedColumns, setSelectedColumns] = useState([]);
    const [queryCondition, setQueryCondition] = useState();
    const [sortColumns, setSortColumns] = useState([]);

    useEffect(() => {
        setSelectedColumns(queryConfiguration?.select ?? []);
        setQueryCondition(queryConfiguration?.where);
        setSortColumns(queryConfiguration?.sort?.map((element) => {
            const isDescending = element.startsWith("!");
            if (isDescending) {
                element = element.slice(1);
            }
            return {
                name: element,
                order: isDescending ? "D" : "A"
            };
        }) ?? []);
    }, [queryConfiguration]);

    return (
        <div className={cx("query-editor", className)}>
            <div className="card">
                <div className="card-header">
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
                <div className="card-body">
                    <ColumnSelect
                        rootType={rootType}
                        selectedColumns={selectedColumns}
                        valueRenderer={valueRenderer}
                        onChange={(tokenList) => {
                            setSelectedColumns(tokenList);
                        }}
                        schemaResolveFilterCallback={schemaResolveFilterCallback}
                    />
                </div>
                <div className="card-body border-top">
                    <ConditionEditor
                        rootType={conditionEditorScope.rootType}
                        container={conditionEditorScope}
                        path="condition"
                        valueRenderer={columnNameRenderer}
                        formContext={formContext}
                        queryCondition={queryCondition}
                        onChange={(queryCondition) => {
                            setQueryCondition(queryCondition);
                        }}
                        schemaResolveFilterCallback={schemaResolveFilterCallback}
                    />
                </div>
                <div className="card-body border-top">
                    <SortColumnList
                        rootType={rootType}
                        valueRenderer={valueRenderer}
                        sortColumns={sortColumns}
                        onChange={(sortColumnList) => {
                            setSortColumns(sortColumnList);
                        }}
                        schemaResolveFilterCallback={schemaResolveFilterCallback}
                    />
                </div>
                <div className="card-footer">
                    <ButtonToolbar className="d-flex justify-content-start">
                        <button
                            type="Button"
                            className="btn btn-primary"
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
                                            i18n("QueryEditor:Confirm")
                                        }
                                    </>
                                )
                            }
                        </button>
                    </ButtonToolbar>
                </div>
            </div>
        </div>
    )
}

QueryEditor.ORIGIN_CONDITION_EDITOR_FIELD_SELECTION = ORIGINS.CONDITION_EDITOR_FIELD_SELECTION;
QueryEditor.ORIGIN_FIELD_SELECTION_TOKEN_LIST = ORIGINS.FIELD_SELECTION_TOKEN_LIST;
QueryEditor.ORIGIN_FIELD_SELECTION_TREE = ORIGINS.FIELD_SELECTION_TREE;

QueryEditor.propTypes = {
    /**
     * header of the module
     */
    header: PropTypes.string,

    /**
     * rendering function for rendering the column elements in the column select module
     */
    columnNameRenderer: PropTypes.func,

    /**
     * the tree representation of all columns available for selection and use in all modules
     */
    availableColumnTreeObject: PropTypes.object,

    /**
     * the used FormContext
     * defaults to the default FormContext
     */
    formContext: PropTypes.instanceOf(FormContext),

    /**
     * root type used by the condition editor
     */
    rootType: PropTypes.string.isRequired,

    /**
     * the text / elements to be displayed inside the save button
     */
    saveButtonText: PropTypes.string,

    /**
     * the callback function called when the user clicks the save button
     * parameter: the generated query configuration
     */
    saveButtonOnClick: PropTypes.func,

    /**
     * optional input query configuration, if provided this will be loaded into the query editor
     */
    queryConfiguration: PropTypes.object,

    /**
     * Callback to filter schema catalog resolver
     */
    schemaResolveFilterCallback: PropTypes.func,

    /**
     * optional additional classes to be given to the wrapping div, mostly for styling
     */
    className: PropTypes.string
}

export default QueryEditor;
