import React, { useMemo } from "react"
import PropTypes from "prop-types"
import cx from "classnames"
import { observer as fnObserver } from "mobx-react-lite"
import i18n from "../../i18n";
import GridStateForm from "./GridStateForm";
import Pagination from "../Pagination";
import FilterRow from "./FilterRow";
import { lookupType } from "../../util/type-utils";
import SortLink from "./SortLink";
import useObservableInput from "../../util/useObservableInput";
import Column from "./Column";
import RowSelector from "./RowSelector";
import WorkingSet, { WorkingSetStatus } from "../../WorkingSet";
import WorkingSetStatusComponent from "./WorkingSetStatus";


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


const COLUMN_CONFIG_INPUT_OPTS = {
    name: "React to column changes"
};


/**
 * Data grid what works based on degenerified InteractiveQuery types.
 */
const DataGrid = fnObserver(props => {

    const { id, value, tableClassName, rowClasses, filterTimeout, workingSet, children } = props;

    const { type, columnStates } = value;

    const columnStatesInput = useObservableInput(
        () => {

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
     * A memoized copy of the columnStates structure with resolved column types and filters
     */
    const columns = useMemo(
        () => {

            let enabledCount = 0;
            const columns = React.Children.map(children, (kid, idx) => {

                const {name, filter, heading, sort, renderFilter } = kid.props;

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
                    if (sort)
                    {
                        sortable = true;
                    }
                    enabled = true;
                    enabledCount++;
                }

                return ({
                    name,
                    sortable,
                    filter,
                    enabled,
                    type: typeRef && typeRef.name,
                    heading: heading || name,
                    sort: sort || name,
                    renderFilter
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
        [ type, columnStatesInput ]
    );

    const { rows, queryConfig } = value;

    return (
        <GridStateForm
            iQuery={ value }
            columns={ columns }
            componentId={ id }
            filterTimeout={ filterTimeout }
        >
            <table
                className={
                    cx(
                        // reduced bottom margin to visually connect pagination
                        "data-grid table mt-3 mb-2",
                        tableClassName
                    )
                }
            >
                <thead>
                <tr className="headers">
                    {
                        columns.map(
                            (col, idx) => col.enabled && (
                                <th
                                    key={ idx }
                                >
                                    <SortLink
                                        iQuery={ value }
                                        column={ col }
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
                    workingSet && queryConfig.currentPage === 0 &&
                    workingSet.newObjects.map(
                        (context, idx) => (
                            <tr
                                key={"ws" + idx}
                                className={
                                    cx("data", rowClasses ? rowClasses(context) : null, "new-object")
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
                    rows.map(
                        (context, idx) => {

                            let workingSetClass = null;
                            if (workingSet)
                            {
                                const entry = workingSet.lookup(context._type, context.id);
                                if (entry)
                                {
                                    if (entry.status === WorkingSetStatus.DELETED)
                                    {
                                        workingSetClass = "deleted-object";
                                    }
                                    else
                                    {
                                        workingSetClass = "changed-object";
                                        context = entry.domainObject;
                                    }
                                }
                            }

                            return (
                                <tr
                                    key={idx}
                                    className={
                                        cx("data", rowClasses ? rowClasses(context) : null, workingSetClass)
                                    }
                                >
                                    {
                                        React.Children.map(
                                            children,
                                            (col, idx) => columns[idx].enabled && (
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
                            );
                        }
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
    filterTimeout: 350,
    workingSet: null
};

DataGrid.propTypes = {
    /**
     * Additional classes to set on the table element. (default is "table-hover table-striped table-bordered")
     */
    tableClassName: PropTypes.string,
    /**
     * Function to produce additional classes for each row ( context => classes )
     */
    rowClasses: PropTypes.func,
    /**
     * Timeout in milliseconds for the filter inputs. The actual update of the filter will be delayed until this many
     * milliseconds have passed since the last filter change.
     */
    filterTimeout: PropTypes.number,

    /**
     * Working set with in-memory objects to be mixed in
     */
    workingSet: PropTypes.instanceOf(WorkingSet)
};


DataGrid.Column = Column;
DataGrid.RowSelector = RowSelector;
DataGrid.WorkingSetStatus = WorkingSetStatusComponent;

DataGrid.displayName = "IQueryGrid";

export default DataGrid
