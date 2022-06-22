import React, { useEffect, useMemo } from "react"
import PropTypes from "prop-types"
import { DndProvider } from "react-dnd"
import { HTML5Backend } from "react-dnd-html5-backend"
import cx from "classnames"
import { observer as fnObserver } from "mobx-react-lite"
import i18n from "../../i18n";
import GridStateForm from "./GridStateForm";
import Pagination from "../Pagination";
import HeaderRow from "./rows/HeaderRow";
import FilterRow from "./rows/FilterRow";
import DataRow from "./rows/DataRow";
import { lookupType, lookupTypeContext, unwrapAll } from "../../util/type-utils";
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

function sortByField(array, field) {
    if (field != null) {
        return array.sort((el0, el1) => {
            return el0[field] < el1[field] ? -1 : 1;
        });
    }
    return array;
}


/**
 * Data grid what works based on degenerified InteractiveQuery types.
 */
const DataGrid = fnObserver(props => {

    const { id, name, value, isCompact, tableClassName, rowClasses, filterTimeout, workingSet, alignPagination, children, sortColumn, moveRowHandler } = props;

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
                    if (sortColumn != null && sortColumn === name) {
                        enabled = true;
                        enabledCount++;
                    } else {
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

                const newColumn = {
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
                };

                if (sortColumn != null && sortColumn === name) {
                    columns.unshift(newColumn);
                } else {
                    columns.push(newColumn);
                }
            });

            if (enabledCount === 0)
            {
                throw new Error("Grid (id = " +  id + ") must have visible columns");
            }

            columns[0].enabledCount = enabledCount;

            return columns;

        },
        [ type, columnStatesInput ]
    );

    const { rows, queryConfig } = internalQuery;

    const fieldResolver = useMemo(
        () => new FieldResolver(),
        []
    );

    const [records, setRecords] = React.useState([]);

    useEffect(() => {
        const sortedRows = sortByField(rows, sortColumn).map(
            (context) => {

                let workingSetClass = "original-object";
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

                return [context, workingSetClass];
            }
        );

        const result = [
            ...(workingSet && queryConfig.offset === 0 && (function () {
        
                const filterFn = filterTransformer(queryConfig.condition, fieldResolver.resolve);
        
                const newObjects = workingSet.newObjects(type);
                return newObjects.filter( obj => {
                    fieldResolver.current = obj;
                    return filterFn();
                }).map(context => [context, null]);
            })() || []),
            ...sortedRows
        ];

        setRecords(result);
    }, [
        rows,
        workingSet?.newObjects(type)
    ]);

    const [sourceRow, setSourceRow] = React.useState();
    const [targetRow, setTargetRow] = React.useState();

    const moveRow = (dragIndex, dropIndex, dragEl, dropEl, monitor) => {
        if (dragIndex === dropIndex) {
            endMoveRow();
            return;
        }
        
        const hoverBoundingRect = dropEl.getBoundingClientRect();
        const hoverMiddleY = (hoverBoundingRect.bottom - hoverBoundingRect.top) / 2;
        const clientOffset = monitor.getClientOffset();
        const hoverClientY = clientOffset.y - hoverBoundingRect.top;
        if (dragIndex < dropIndex && hoverClientY < hoverMiddleY) {
            dropIndex = dropIndex - 1;
        }
        if (dragIndex > dropIndex && hoverClientY > hoverMiddleY) {
            dropIndex = dropIndex + 1;
        }

        setSourceRow(dragIndex);
        setTargetRow(dropIndex);
    };

    const dropRow = (dragIndex, dropIndex, dragEl, dropEl, monitor) => {
        if (dragIndex === dropIndex) {
            endMoveRow();
            return;
        }

        const hoverBoundingRect = dropEl.getBoundingClientRect();
        const hoverMiddleY = (hoverBoundingRect.bottom - hoverBoundingRect.top) / 2;
        const clientOffset = monitor.getClientOffset();
        const hoverClientY = clientOffset.y - hoverBoundingRect.top;
        if (dragIndex < dropIndex && hoverClientY < hoverMiddleY) {
            dropIndex = dropIndex - 1;
        }
        if (dragIndex > dropIndex && hoverClientY > hoverMiddleY) {
            dropIndex = dropIndex + 1;
        }
        
        if (dragIndex != dropIndex) {
            const resRecords = [];
            let movedRow;
            for (let i = 0; i < records.length; ++i) {
                if (dragIndex > dropIndex && i === dropIndex) {
                    // push element down to new position
                    resRecords.push(records[dragIndex]);
                    // update sortColumn field
                    movedRow = records[dragIndex][0];
                    const nextRow = records[i][0];
                    if (i === 0) {
                        movedRow[sortColumn] = nextRow[sortColumn] - 1
                    } else {
                        const prevRow = records[i - 1][0];
                        movedRow[sortColumn] = nextRow[sortColumn] - (nextRow[sortColumn] - prevRow[sortColumn]) / 2
                    }
                }
                if (i !== dragIndex) {
                    // push unchanged element
                    resRecords.push(records[i]);
                }
                if (dragIndex < dropIndex && i === dropIndex) {
                    // push element up to new position
                    resRecords.push(records[dragIndex]);
                    // update sortColumn field
                    movedRow = records[dragIndex][0];
                    const prevRow = records[i][0];
                    if (i === records.length - 1) {
                        movedRow[sortColumn] = prevRow[sortColumn] + 1
                    } else {
                        const nextRow = records[i + 1][0];
                        movedRow[sortColumn] = prevRow[sortColumn] + (nextRow[sortColumn] - prevRow[sortColumn]) / 2
                    }
                }
            }
            setRecords(resRecords);
            // call handler callback fnction
            if (typeof moveRowHandler === "function") {
                moveRowHandler(movedRow, resRecords.map((e) => e[0]), movedRow[sortColumn]);
            }
        }

        endMoveRow();
    };

    const endMoveRow = () => {
        setSourceRow(null);
        setTargetRow(null);
    };

    return (
        <DndProvider backend={HTML5Backend}>
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
                            data-id={ id }
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
                            <HeaderRow
                                value={ value }
                                columns={ columns }
                                sortColumn={ sortColumn }
                            />
                            {
                                !suppressFilter && (
                                    <FilterRow
                                        columns={ columns }
                                        sortColumn={ sortColumn }
                                    />
                                )
                            }
                            </thead>
                            <tbody>
                            {
                                records.length > 0 ? records.map(
                                    ([context, workingSetClass], idx) => {
                                        return (
                                            <DataRow
                                                key={ idx }
                                                idx={ idx }
                                                context={ context }
                                                columns={ columns }
                                                moveRow={ moveRow }
                                                dropRow={ dropRow }
                                                sortColumn={ sortColumn }
                                                className={
                                                    cx(
                                                        "data",
                                                        rowClasses ? rowClasses(context) : null,
                                                        workingSetClass ?? "new-object",
                                                        targetRow == idx && "target-row",
                                                        targetRow == idx && targetRow < sourceRow && "target-row-top",
                                                        targetRow == idx && targetRow > sourceRow && "target-row-bottom",
                                                        sourceRow == idx && "source-row"
                                                    )
                                                }
                                            />
                                        );
                                    }
                                ) : (
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
        </DndProvider>
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
