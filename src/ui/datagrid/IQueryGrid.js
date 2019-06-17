import React, { useMemo } from "react"
import { action } from "mobx"
import PropTypes from "prop-types"
import cx from "classnames"
import get from "lodash.get"
import { observer as fnObserver } from "mobx-react-lite"
import { PropTypes as MobxPropTypes } from "mobx-react";
import i18n from "../../i18n";
import GridStateForm from "./GridStateForm";
import Pagination from "./Pagination";
import FilterRow from "./FilterRow";
import lookupType from "../../util/lookupType";
import SortLink from "./SortLink";
import AutomatonPropTypes from "../../util/AutomatonPropTypes";
import useObservableInput from "../../util/useObservableInput";


const Column = fnObserver(props => {

    const {name, context, children} = props;

    if (typeof children === "function")
    {
        const result = children(context);

        //console.log("FN-RESULT", result);

        return (
            <td>
                {
                    typeof result === "string" ?
                        <p
                            className="form-control-plaintext"
                        >
                            {
                                result
                            }
                        </p> : result
                }
            </td>
        );
    }

    //console.log("context[name] = ", context[name]);

    return (
        <td>
            <p
                className="form-control-plaintext"
            >
                {
                    String(get(context, name))
                }
            </p>
        </td>
    )
});


function findColumn(columnStates, name)
{
    for (let i = 0; i < columnStates.length; i++)
    {
        const columnState = columnStates[i];
        if (columnState.name === name)
        {
            return columnState;
        }
    }
    return null;
}

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
});

/**
 * Row-Selection checkbox helper
 */
const RowSelector = props => {

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
};

const COLUMN_CONFIG_INPUT_OPTS = {
    name: "React to column changes"
};


/**
 * Data grid what works based on degenerified Paged<DomainObject> types.
 */
const DataGrid = fnObserver(props => {

    const { id, value, tableClassName, rowClasses, children } = props;

    const { type, columnConfig } = value;


    const columnConfigInput = useObservableInput(
        () => {

            const { columnStates } = value.columnConfig;

            let s = "";
            for (let i = 0; i < columnStates.length; i++)
            {
                const columnState = columnStates[i];
                s += columnState.name + ":" + columnState.enabled + ", "
            }

            return s;
        },
        COLUMN_CONFIG_INPUT_OPTS
    );

    /**
     * A memoized copy of the columnConfig structure with resolved column types and filters
     */
    const columns = useMemo(
        () => {

            const { columnStates } = columnConfig;

            let enabledCount = 0;
            const columns = React.Children.map(children, (kid, idx) => {

                const {name, filter, heading} = kid.props;

                let typeRef = null, sortable = false, enabled = false;
                if (name)
                {
                    const columnState = findColumn(columnStates, name);

                    if (columnState && columnState.enabled)
                    {
                        sortable = columnState.sortable;
                        typeRef = lookupType(type, name);
                        if (typeRef.kind !== "SCALAR")
                        {
                            throw new Error("Column type is no scalar: " + name);
                        }
                        enabled = true;
                        enabledCount++;
                    }
                }
                else
                {
                    enabled = true;
                    enabledCount++;
                }

                return ({
                    name,
                    sortable,
                    filter,
                    enabled,
                    type: typeRef && typeRef.name,
                    heading: heading || name
                });
            });

            if (enabledCount === 0)
            {
                throw new Error("Grid (id = " +  id + ") must have visible columns");
            }

            columns[0].enabledCount = enabledCount;

            //console.log("COLUMNS", JSON.stringify(columns, null, 4))

            return columns;

        },
        [ type, columnConfigInput ]
    );

    const { rows } = value;

    return (
        <GridStateForm
            iQuery={ value }
            columns={ columns }
            componentId={ id }
        >
            <table
                className={
                    cx(
                        // reduced bottom margin to visually connect pagination
                        "table mt-3 mb-2",
                        tableClassName
                    )
                }
            >
                <thead>
                <tr>
                    {
                        columns.map(
                            (col, idx) => col.enabled && (
                                <th
                                    key={ idx }
                                >
                                    <SortLink
                                        iQuery={ value }
                                        column={ col.name }
                                        text={ col.heading }
                                        sortable={ col.sortable }
                                    />
                                </th>
                            )
                        )
                    }
                </tr>

                <FilterRow
                    columns={ columns }
                />
                </thead>
                <tbody>
                {
                    rows.map(
                        (context, idx) => (
                            <tr
                                key={idx}
                                className={
                                    rowClasses ? rowClasses(context) : null
                                }
                            >
                                {
                                    React.Children.map(
                                        children,
                                        (col,idx) => columns[idx].enabled && (
                                            React.cloneElement(
                                                col,
                                                {
                                                    context
                                                }
                                            )
                                        )
                                    )
                                }
                            </tr>
                        )
                    )
                }
                {
                    rows.length === 0 && (
                        <tr>
                            <td colSpan={ columns[0].enabledCount }>
                                {
                                    i18n("DataGrid:No Rows")
                                }
                            </td>
                        </tr>
                    )
                }
                </tbody>
            </table>
            <Pagination
                iQuery={ value }
                description={ i18n("Result Navigation") }
            />
        </GridStateForm>
    );
});

DataGrid.defaultProps = {
    tableClassName: "table-hover table-striped table-bordered table-sm",
};

DataGrid.propTypes = {
    /**
     * Additional classes to set on the table element. (default is "table-hover table-striped table-bordered")
     */
    tableClassName: PropTypes.string,
    /**
     * Function to produce additional classes for each row ( context => classes )
     */
    rowClasses: PropTypes.func
};

Column.propTypes = {
    /**
     * Column name / path expression. (e.g. "name", but also "foo.owner.name")
     */
    name: PropTypes.string,
    /**
     */
    filter: PropTypes.oneOfType([

        PropTypes.string,
        PropTypes.func
    ])
};

RowSelector.propTypes = {

    /**
     * Unique id string representing an object
     */
    id: PropTypes.string.isRequired,

    /**
     * External observable containing the currently selected values. Either an observable array or set.
     * 
     */
    selectedValues:
        PropTypes.oneOfType([
            AutomatonPropTypes.isObservableSet,
            MobxPropTypes.observableArray
        ]).isRequired
};


DataGrid.Column = Column;
DataGrid.RowSelector = RowSelector;

export default DataGrid
