import React, { useMemo } from "react"
import PropTypes from "prop-types"
import cx from "classnames"
import { observer as fnObserver } from "mobx-react-lite"
import i18n from "../../i18n";
import GridStateForm from "./GridStateForm";
import Pagination from "../Pagination";
import FilterRow from "./FilterRow";
import { lookupType, lookupTypeContext, unwrapAll } from "../../util/type-utils";
import SortLink from "./SortLink";
import useObservableInput from "../../util/useObservableInput";
import Column from "./Column";
import RowSelector from "./RowSelector";
import WorkingSet, { WorkingSetStatus } from "../../WorkingSet";
import WorkingSetStatusComponent from "./WorkingSetStatus";
import filterTransformer, { FieldResolver } from "../../util/filterTransformer";
import config from "../../config"
import { toJS } from "mobx";
import { getCustomFilter } from "../../util/filter/CustomFilter";
import OfflineQuery from "../../model/OfflineQuery";


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

    const { id, name, value, isCompact, tableClassName, rowClasses, filterTimeout, workingSet, alignPagination, children } = props;

    const [suppressFilter, internalQuery] = useMemo(() => {
        if (Array.isArray(value)) {
            return [true, new OfflineQuery(value)];
        }
        return [false, value];
    }, [value]);

    const { type, columnStates } = internalQuery;

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

            const columns = [];

            React.Children.forEach(children, (columnElem, idx) => {

                if (!columnElem || columnElem.type !== Column)
                {
                    return;
                }

                const {name, width, minWidth, filter, heading, sort, renderFilter } = columnElem.props;
                const transformedFilter = getCustomFilter(filter) ?? filter;

                let typeRef = null, sortable = false, enabled = false;
                if (name)
                {
                    const columnState = findColumn(columnStates, name);

                    if (columnState && columnState.enabled)
                    {
                        sortable = columnState.sortable;

                        if (type) {
                            const typeContext = lookupTypeContext(type, name);

                            if (transformedFilter && typeof transformedFilter !== "function" && config.inputSchema.getFieldMeta(typeContext.domainType, typeContext.field.name, "computed"))
                            {
                                throw new Error(
                                    "Computed column '" + typeContext.field.name + "' cannot be filtered with a simple filter.\n" +
                                    "You need to write a custom filter function that basically reimplements the computed in SQL and produces a matching filter expression."
                                )
                            }


                            typeRef = unwrapAll(typeContext.field.type);
                            if (typeRef.kind !== "SCALAR")
                            {
                                throw new Error("Column type is no scalar: " + name);
                            }
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

                columns.push({
                    name,
                    width,
                    minWidth,
                    sortable,
                    filter: transformedFilter,
                    enabled,
                    type: typeRef?.name,
                    heading: heading || name,
                    sort: sort || name,
                    renderFilter,
                    columnElem
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

    const { rows, queryConfig } = internalQuery;

    const fieldResolver = useMemo(
        () => new FieldResolver(),
        []
    );

    return (
        <GridStateForm
            iQuery={ internalQuery }
            columns={ columns }
            componentId={ id }
            filterTimeout={ filterTimeout }
        >
            <div
                className={
                    cx(
                        "data-grid-container mt-3 mb-2",
                        isCompact && "data-grid-compact"
                    )
                }
            >
                <div className="data-grid-scrollcontainer">
                    <table
                        className={
                            cx(
                                // reduced bottom margin to visually connect pagination
                                "data-grid table",
                                tableClassName
                            )
                        }
                        name={name}
                    >
                        <thead>
                        <tr className="headers">
                            {
                                columns.map(
                                    (col, idx) => col.enabled && (
                                        <th
                                            key={ idx }
                                            style={
                                                {
                                                    width: col.width,
                                                    minWidth: col.minWidth,
                                                    maxWidth: col.maxWidth
                                                }
                                            }
                                        >
                                            <SortLink
                                                iQuery={ internalQuery }
                                                column={ col }
                                            />
                                        </th>
                                    )
                                )
                            }
                        </tr>
                        {
                            !suppressFilter && (
                                <FilterRow
                                    columns={ columns }
                                />
                            )
                        }
                        </thead>
                        <tbody>
                        {
                            workingSet && queryConfig.offset === 0 && (function () {

                                const filterFn = filterTransformer(queryConfig.condition, fieldResolver.resolve);

                                const newObjects = workingSet.newObjects(type);
                                const filtered = newObjects.filter( obj => {
                                    fieldResolver.current = obj;
                                    return filterFn();
                                });

                                //console.log(id, "newObjects, filtered",newObjects, filtered);

                                return (
                                    filtered
                                        .map(
                                            (context, idx) => (
                                                <tr
                                                    key={"ws" + idx}
                                                    className={
                                                        cx("data", rowClasses ? rowClasses(context) : null, "new-object")
                                                    }
                                                >
                                                    {
                                                        columns.map(
                                                            (column, columnIdx) => column.enabled && (
                                                                React.cloneElement(
                                                                    column.columnElem,
                                                                    {
                                                                        key: columnIdx,
                                                                        context
                                                                    }
                                                                )
                                                            )
                                                        )
                                                    }
                                                </tr>
                                            )
                                        )
                                )
                            })()
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
                                            else if (workingSet.isModified(context))
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
                                                columns.map(
                                                    (column, columnIdx) => column.enabled && (
                                                        React.cloneElement(
                                                            column.columnElem,
                                                            {
                                                                key: columnIdx,
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
                </div>
            </div>
            <Pagination
                iQuery={ internalQuery }
                description={ i18n("Result Navigation") }
                align={ alignPagination }
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
     * use compact datagrid mode where by defaul all colums use minimal space (except for the last)
     * and enhanced size parameters are enabled per column
     */
    isCompact: PropTypes.bool,

    /**
     * Working set with in-memory objects to be mixed in
     */
    workingSet: PropTypes.instanceOf(WorkingSet),
    /**
     * set the pagination alignment ("left" [default], "center", "right")
     */
    alignPagination: PropTypes.string,
};


DataGrid.Column = Column;
DataGrid.RowSelector = RowSelector;
DataGrid.WorkingSetStatus = WorkingSetStatusComponent;

DataGrid.displayName = "DataGrid";
Column.displayName = "Column";

export default DataGrid
