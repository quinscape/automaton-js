import React, {useEffect, useMemo, useState} from "react";
import TokenList from "../token/TokenList";
import SelectionTreeModal from "../treeselection/SelectionTreeModal";
import i18n from "../../i18n";
import ConditionEditor from "../condition/ConditionEditor";
import cx from "classnames";
import flattenObject from "../../util/flattenObject";
import SortColumnList from "./SortColumnList";
import ConditionEditorScope from "./ConditionEditorScope";
import get from "lodash.get";
import { FormContext } from "domainql-form";

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
        // rootType,
        // containerPath,
        formContext = FormContext.getDefault(),
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

    //scope
    const conditionEditorScope = useMemo(() => {
        return new ConditionEditorScope();
    }, []);
    useEffect(() => {
        console.log("CONDITION EDITOR SCOPE, CONDITION EDITOR ONCHANGE");
        console.log(conditionEditorScope);
    }, [conditionEditorScope.condition]);

    // modal control states
    const [columnSelectionModalOpen, setColumnSelectionModalOpen] = useState(false);

    // data states
    const [selectedColumns, setSelectedColumns] = useState([]);
    const [queryCondition, setQueryCondition] = useState({});
    useEffect(() => {
        console.log("QUERY CONDITION");
        console.log(queryCondition);
    }, [queryCondition]);
    // useEffect(() => {
    //     console.log("QUERY CONDITION");
    //     console.log(queryCondition);
    // }, [formContext]);

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
            <div>
                <TokenList
                    tokens={selectedColumns}
                    renderer={tokenListRenderer}
                    onChange={(tokenList) => {
                        console.log("COLUMN REMOVE", tokenList);
                        setSelectedColumns(tokenList);
                    }}
                    onEdit={() => {
                        setColumnSelectionModalOpen(true);
                    }}
                />
                <SelectionTreeModal
                    modalHeader={i18n("Select Columns")}
                    toggle={() => setColumnSelectionModalOpen(!columnSelectionModalOpen)}
                    isOpen={columnSelectionModalOpen}
                    selected={selectedColumns}
                    valueRenderer={fieldSelectionTreeRenderer}
                    onSubmit={(selectedElements) => {
                        console.log("COLUMN SELECT SUBMIT", selectedElements);
                        setSelectedColumns(selectedElements);
                    }}
                    treeContent={availableColumnTreeObject}
                />
            </div>
            <div>
                <ConditionEditor
                    rootType={conditionEditorScope.rootType}
                    container={conditionEditorScope}
                    path="condition"
                    fields={availableColumnList}
                    formContext={formContext}
                    onChange={(queryCondition) => {
                        console.log("onChange", queryCondition);
                    }}
                />
            </div>
            <div>
                <SortColumnList
                    allColumns={availableColumnList}
                    onChange={(sortColumnList) => {
                        console.log("SORT COLUMN LIST SELECT");
                        console.log(sortColumnList);
                    }}
                />
            </div>
        </div>
    )
}

QueryEditor.ORIGIN_CONDITION_EDITOR_FIELD_SELECTION = ORIGINS.CONDITION_EDITOR_FIELD_SELECTION;
QueryEditor.ORIGIN_FIELD_SELECTION_TOKEN_LIST = ORIGINS.FIELD_SELECTION_TOKEN_LIST;
QueryEditor.ORIGIN_FIELD_SELECTION_TREE = ORIGINS.FIELD_SELECTION_TREE;

export default QueryEditor;
