import React, {useEffect, useMemo, useState} from "react";
import i18n from "../../i18n";
import ConditionEditor from "../condition/ConditionEditor";
import cx from "classnames";
import SortColumnList from "./SortColumnList";
import QueryEditorState from "./QueryEditorState";
import {FormContext, Icon} from "domainql-form";
import {ButtonToolbar} from "reactstrap";
import ColumnSelect from "./ColumnSelect";
import PropTypes from "prop-types";
import { getFieldDataByPath, getTableNameByPath } from "../../util/inputSchemaUtilities";
import { useLocalObservable } from "mobx-react-lite";
import get from "lodash.get";
import toPath from "lodash.topath";

const ORIGINS = {
    CONDITION_EDITOR_FIELD_SELECTION: "ConditionEditorFieldSelection",
    FIELD_SELECTION_TOKEN_LIST: "FieldSelectionTokenList",
    FIELD_SELECTION_TREE: "FieldSelectionTree"
}

// TODO daten namen in scope und onchange angleichen

const QueryEditor = (props) => {
    const {
        header,
        columnNameRenderer,
        formContext = FormContext.getDefault(),
        rootType,
        saveButtonText,
        saveButtonOnClick,
        onChange,
        queryConfiguration = {},
        schemaResolveFilterCallback,
        className
    } = props;

    const selectedColumnsPath = toPath("select");
    const queryConditionPath = toPath("where");
    const sortColumnsPath = toPath("sort");

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
    }, [columnNameRenderer, rootType]);

    const editorState = useLocalObservable(() => {
        return new QueryEditorState(rootType, queryConfiguration, "");
    });

    useEffect(() => {
        formContext.registerFieldContext({
            root: editorState.container,
            fieldId: selectedColumnsPath.join("."),
            path: selectedColumnsPath,
            name: selectedColumnsPath.join("."),
            qualifiedName: selectedColumnsPath.join("."),
            fieldType: {
                kind: "NON_NULL",
                ofType: "LIST"
            }
        });
        formContext.registerFieldContext({
            root: editorState.container,
            fieldId: sortColumnsPath.join("."),
            path: sortColumnsPath,
            name: sortColumnsPath.join("."),
            qualifiedName: sortColumnsPath.join("."),
            fieldType: {
                kind: "LIST"
            }
        });
    }, [editorState.container]);

    const [selectedColumns, setSelectedColumns] = useState([]);
    const [sortColumns, setSortColumns] = useState([]);

    const onQueryChange = useMemo(() => {
        if (typeof onChange === "function") {
            return () => {
                const {container} = editorState;

                formContext.removeAllErrors();
                formContext.revalidate();
        
                const queryColumns = get(container, selectedColumnsPath);
                if (formContext.getErrors().length <= 0) {
                    const queryCondition = get(container, queryConditionPath);
                    const querySort = get(container, sortColumnsPath);
                    onChange({
                        select: queryColumns ?? [],
                        where: queryCondition,
                        sort: querySort?.map((sortColumnElement) => {
                            const {name, order} = sortColumnElement;
                            return `${order === "D" ? "!" : ""}${name}`;
                        }) ?? []
                    });
                }
            };
        }
        return () => {}
    });

    useEffect(() => {
        const queryColumns = queryConfiguration?.columns ?? [];
        const querySort = queryConfiguration?.sort?.map((element) => {
            const isDescending = element.startsWith("!");
            if (isDescending) {
                element = element.slice(1);
            }
            return {
                name: element,
                order: isDescending ? "D" : "A"
            };
        }) ?? [];

        setSelectedColumns(queryColumns);
        setSortColumns(querySort);

        editorState.setColumns(queryColumns);
        editorState.setSort(querySort);
    }, [queryConfiguration]);

    const columnErrorMessages = formContext.findError(editorState.container, selectedColumnsPath.join("."));

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
                        id={selectedColumnsPath.join(".")}
                        rootType={editorState.rootType}
                        selectedColumns={selectedColumns ?? []}
                        valueRenderer={valueRenderer}
                        onChange={(selectedColumns) => {
                            editorState.setColumns(selectedColumns);
                            setSelectedColumns(selectedColumns);
                            onQueryChange();
                        }}
                        schemaResolveFilterCallback={schemaResolveFilterCallback}
                    />
                    {
                        columnErrorMessages.length > 0 ? (
                            <p className={"invalid-feedback d-block"}>
                                {columnErrorMessages.map((txt, idx) => <span key={idx}> {txt} </span>)}
                            </p>
                        ) : ""
                    }
                </div>
                <div className="card-body border-top">
                    <ConditionEditor
                        rootType={editorState.rootType}
                        container={editorState.container}
                        path={queryConditionPath.join(".")}
                        valueRenderer={columnNameRenderer}
                        formContext={formContext}
                        queryCondition={queryConfiguration?.condition}
                        onChange={() => {
                            onQueryChange();
                        }}
                        schemaResolveFilterCallback={schemaResolveFilterCallback}
                    />
                </div>
                <div className="card-body border-top">
                    <SortColumnList
                        id={sortColumnsPath.join(".")}
                        rootType={editorState.rootType}
                        valueRenderer={valueRenderer}
                        sortColumns={sortColumns ?? []}
                        onChange={(sortColumns) => {
                            editorState.setSort(sortColumns);
                            setSortColumns(sortColumns);
                            onQueryChange();
                        }}
                        schemaResolveFilterCallback={schemaResolveFilterCallback}
                    />
                </div>
                {
                    typeof saveButtonOnClick === "function" ? (
                        <div className="card-footer">
                            <ButtonToolbar className="d-flex justify-content-start">
                                <button
                                    type="Button"
                                    className="btn btn-primary"
                                    onClick={() => {
                                        const queryCondition = get(editorState.container, queryConditionPath);
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
                    ) : ""
                }
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
     * root type used by the editor
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
     * callback function called on changes to the query
     */
    onChange: PropTypes.func,

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
