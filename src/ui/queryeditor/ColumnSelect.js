import React, {useEffect, useState} from "react";
import TokenList from "../token/TokenList";
import SelectionTreeModal from "../treeselection/SelectionTreeModal";
import i18n from "../../i18n";
import PropTypes from "prop-types";
import { createTreeRepresentationForInputSchema, createTreeRepresentationForInputSchemaByPath } from "../../util/inputSchemaUtilities";
import { setInObjectAtPathImmutable } from "../../util/mutateObject";
import { Icon } from "domainql-form";

const ColumnSelect = (props) => {

    const {
        rootType,
        selectedColumns,
        valueRenderer,
        onChange,
        schemaResolveFilterCallback
    } = props;

    const [columnSelectionModalOpen, setColumnSelectionModalOpen] = useState(false);
    const [columnTreeObject, setColumnTreeObject] = useState({});

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

    return (
        <div className="column-select">
            <TokenList
                tokens={selectedColumns}
                renderer={valueRenderer}
                buttonRenderer={() => (
                    <>
                        <Icon className="fa-edit mr-1"/>
                        {
                            i18n("QueryEditor:Edit Column Selection")
                        }
                    </>
                )}
                onChange={onChange}
                onEdit={() => {
                    setColumnSelectionModalOpen(true);
                }}
            />
            <SelectionTreeModal
                className="column-select-modal"
                modalHeader={i18n("QueryEditor:Select Columns")}
                toggle={() => setColumnSelectionModalOpen(!columnSelectionModalOpen)}
                isOpen={columnSelectionModalOpen}
                selected={selectedColumns}
                valueRenderer={valueRenderer}
                onSubmit={onChange}
                treeContent={columnTreeObject}
                onExpandDirectory={expandDirectory}
                onCollapseDirectory={collapseDirectory}
            />
        </div>
    )
}

ColumnSelect.propTypes = {

    /**
     * the root type of the tree, used to resolve catalogs
     */
    rootType: PropTypes.string.isRequired,

    /**
     * the currently selected column paths
     */
    selectedColumns: PropTypes.arrayOf(PropTypes.string),

    /**
     * the renderer for the selection tree elements and selected columns
     */
    valueRenderer: PropTypes.func,

    /**
     * onChange callback
     * parameter: array of selected column paths
     */
    onChange: PropTypes.func,

    /**
     * Callback to filter schema catalog resolver
     */
    schemaResolveFilterCallback: PropTypes.func
}

export default ColumnSelect;
