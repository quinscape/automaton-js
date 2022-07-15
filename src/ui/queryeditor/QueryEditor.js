import React, {useState} from "react";
import TokenList from "../token/TokenList";
import SelectionTreeModal from "../treeselection/SelectionTreeModal";
import i18n from "../../i18n";
import ConditionEditor from "../condition/ConditionEditor";
import cx from "classnames";
import flattenObject from "../../util/flattenObject";

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
        rootType,
        container,
        containerPath,
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

    // modal control states
    const [columnSelectionModalOpen, setColumnSelectionModalOpen] = useState(false);

    // data states
    const [selectedColumns, setSelectedColumns] = useState([]);
    const [queryCondition, setQueryCondition] = useState({});

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
                    rootType={rootType}
                    container={container}
                    path={containerPath}
                    fields={availableColumnList}
                />
            </div>
        </div>
    )
}

QueryEditor.ORIGIN_CONDITION_EDITOR_FIELD_SELECTION = ORIGINS.CONDITION_EDITOR_FIELD_SELECTION;
QueryEditor.ORIGIN_FIELD_SELECTION_TOKEN_LIST = ORIGINS.FIELD_SELECTION_TOKEN_LIST;
QueryEditor.ORIGIN_FIELD_SELECTION_TREE = ORIGINS.FIELD_SELECTION_TREE;

export default QueryEditor;
