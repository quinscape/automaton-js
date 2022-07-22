import React, {useState} from "react";
import TokenList from "../token/TokenList";
import SelectionTreeModal from "../treeselection/SelectionTreeModal";
import i18n from "../../i18n";
import PropTypes from "prop-types";

const ColumnSelect = (props) => {

    const {
        availableColumnTreeObject,
        selectedColumns,
        tokenListRenderer,
        fieldSelectionTreeRenderer,
        onChange
    } = props;

    const [columnSelectionModalOpen, setColumnSelectionModalOpen] = useState(false);

    return (
        <div className="column-select">
            <TokenList
                tokens={selectedColumns}
                renderer={tokenListRenderer}
                onChange={onChange}
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
                onSubmit={onChange}
                treeContent={availableColumnTreeObject}
            />
        </div>
    )
}

ColumnSelect.propTypes = {
    /**
     * the tree representation of the table structure
     */
    availableColumnTreeObject: PropTypes.object.isRequired,

    /**
     * the currently selected column paths
     */
    selectedColumns: PropTypes.arrayOf(PropTypes.string),

    /**
     * the renderer for the token list elements
     */
    tokenListRenderer: PropTypes.func,

    /**
     * the renderer for the selection tree elements
     */
    fieldSelectionTreeRenderer: PropTypes.func,

    /**
     * onChange callback
     * parameter: array of selected column paths
     */
    onChange: PropTypes.func
}

ColumnSelect.propTypes = {
    /**
     * the tree representation of all columns available for selection
     */
    availableColumnTreeObject: PropTypes.object,

    /**
     * list of all currently selected columns
     */
    selectedColumns: PropTypes.arrayOf(PropTypes.string),

    /**
     * rendering function for rendering token list elements
     */
    tokenListRenderer: PropTypes.func,

    /**
     * rendering function for rendering selection tree elements
     */
    fieldSelectionTreeRenderer: PropTypes.func,

    /**
     * callback function called on changes to the selected elements
     */
    onChange: PropTypes.func
}

export default ColumnSelect;
