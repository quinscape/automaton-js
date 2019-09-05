import React from "react"
import { action, toJS } from "mobx"
import PropTypes from "prop-types"
import { PropTypes as MobxPropTypes } from "mobx-react";
import AutomatonPropTypes from "../../util/AutomatonPropTypes";
import { observer as fnObserver } from "mobx-react-lite";


const updateSelectedArray = action("update grid selection array", (selectedValues, id) => {

    const idIsSelected = selectedValues.indexOf(id) >= 0;
    if (idIsSelected)
    {
        selectedValues.replace(selectedValues.filter( v => v !== id));
    }
    else
    {
        selectedValues.push(id);
    }
});

const updateSelectedSet = action("update grid selection set", (selectedValues, id) => {
    if (selectedValues.has(id))
    {
        selectedValues.delete(id);
    }
    else
    {
        selectedValues.add(id);
    }

    //console.log("updateSelectedSet", toJS(selectedValues));
});

/**
 * Row-Selection checkbox helper
 */
const RowSelector = fnObserver(props => {

    const { id, selectedValues } = props;

    const checkboxId = "row-selector." + id;

    const isArray = Array.isArray(selectedValues);

    const idIsSelected = (
        isArray ?
            selectedValues.indexOf(id) >= 0 :
            selectedValues.has(id)
    );

    return (
        <div className="form-control-plaintext">
            <div className="form-check m-1">
                <input
                    id={ checkboxId }
                    className="form-check-input"
                    type="checkbox"
                    checked={ idIsSelected }
                    onChange={ ev => (isArray ? updateSelectedArray : updateSelectedSet)(selectedValues, id) }
                />
                <label htmlFor={ checkboxId } className="form-check-label sr-only">Row Selected</label>
            </div>
        </div>
    );
});

RowSelector.propTypes = {

    /**
     * Unique id string representing an object
     */
    id: PropTypes.any.isRequired,

    /**
     * External observable containing the currently selected values. Either an observable array or set.
     */
    selectedValues:
    PropTypes.oneOfType([
        AutomatonPropTypes.isObservableSet,
        MobxPropTypes.observableArray
    ]).isRequired
};

RowSelector.displayName = "DataGrid.RowSelector";

export default RowSelector

