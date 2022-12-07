import React, {useEffect, useMemo, useState} from "react"
import PropTypes from "prop-types"
import { DndProvider } from "react-dnd"
import cx from "classnames"
import { observer as fnObserver } from "mobx-react-lite"
import i18n from "../../i18n";
import GridStateForm from "./GridStateForm";
import Pagination from "../Pagination";
import HeaderRow from "./rows/HeaderRow";
import FilterRow from "./rows/FilterRow";
import DataRow from "./rows/DataRow";
import { lookupTypeContext, unwrapAll } from "../../util/type-utils";
import useObservableInput from "../../util/useObservableInput";
import Column from "./Column";
import RowSelector from "./RowSelector";
import WorkingSet, { WorkingSetStatus } from "../../WorkingSet";
import WorkingSetStatusComponent from "./WorkingSetStatus";
import filterTransformer, { FieldResolver } from "../../util/filterTransformer";
import config from "../../config"
import { getCustomFilter, getCustomGetValue } from "../../util/filter/CustomFilter";
import OfflineQuery from "../../model/OfflineQuery";
import UserColumnConfigDialogModal from "./userconfig/UserColumnConfigDialogModal";
import DataGridButtonToolbar from "./DataGridButtonToolbar";
import useEffectNoInitial from "../../util/useEffectNoInitial"
import { resolveFieldDependencies, resolveTableDependencies } from "../../util/dependencyUtilities"
import { createDomainObject } from "domainql-form/lib/util/clone"
import { DndManager } from "../../util/DnDUtils"

function filterIDListFromCondition(condition) {
    const {type, name, operands} = condition;
    if (type === "Condition" && name === "in") {
        const {type: fieldType, name: fieldName} = operands[0];
        if (fieldType === "Field" && fieldName === "id") {
            return {
                type: "Condition",
                name: "isNotNull",
                operands: [
                    {
                        type: "Field",
                        name: "id"
                    }
                ]
            }
        }
    }
    if (condition.operands != null) {
        condition.operands = condition.operands.map(filterIDListFromCondition);
    }
    return condition;
}

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

function isStringNotEmpty(value) {
    return typeof value === "string" && value !== "";
}

function isArrayNotEmpty(value) {
    return Array.isArray(value) && value.length > 0;
}

/**
 * Data grid what works based on degenerified InteractiveQuery types.
 */
const DataGrid = fnObserver(props => {

    const {
        id,
        name,
        value,
        isCompact,
        tableClassName,
        rowClasses,
        filterTimeout,
        workingSet,
        alignPagination,
        paginationPageSizes,
        displayControlButtons,
        resetFilterButtonDisabled,
        customizeColumnsButtonDisabled,
        tableConfig = {},
        onTableConfigChange,
        moveRowColumn,
        moveRowHandler,
        children
    } = props;

    const {
        visibleColumns,
        paginationSize,
        sortColumn
    } = tableConfig;

    const visibleColumnsNotSet = !isArrayNotEmpty(visibleColumns) || visibleColumns.every((value) => !isStringNotEmpty(value));

    const [isColumnModalOpen, setIsColumnModalOpen] = useState(false);
    const toggleColumnModalOpen = () => setIsColumnModalOpen(!isColumnModalOpen);

    const [suppressFilter, internalQuery] = useMemo(() => {
        if (Array.isArray(value)) {
            return [true, new OfflineQuery(value)];
        }
        return [false, value];
    }, [value]);

    const { type, columnStates, rows, queryConfig } = internalQuery;

    /* BEGIN: update query related userConfig */
    useEffect(() => {
        const newQueryConfig = {};
        if (typeof sortColumn === "string") {
            newQueryConfig.sortFields = [sortColumn]
        }
        if (typeof paginationSize === "number") {
            newQueryConfig.pageSize = paginationSize
        }
        if (Object.keys(newQueryConfig).length > 0) {
            internalQuery.update(newQueryConfig);
        }
    }, [
        paginationSize,
        sortColumn
    ]);

    useEffectNoInitial(() => {
        if (typeof onTableConfigChange === "function") {
            const newPaginationSize = queryConfig?.pageSize;
            const newSortColumn = queryConfig?.sortFields?.[0];
            if (paginationSize !== newPaginationSize || sortColumn !== newSortColumn) {
                onTableConfigChange({
                    paginationSize: queryConfig?.pageSize,
                    sortColumn: queryConfig?.sortFields?.[0],
                    visibleColumns
                });
            }
        }
    }, [
        queryConfig?.sortFields,
        queryConfig?.pageSize
    ]);
    /* END: update query related userConfig */

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
    const [columns, nonVisibleColumns, currentVisibleColumns] = useMemo(
        () => {

            let enabledCount = 0;

            const columns = [];
            const columnMap = new Map();

            const nonVisibleColumns = [];

            let filterIndex = 0;

            React.Children.forEach(children, (columnElem, idx) => {

                if (!columnElem || columnElem.type !== Column)
                {
                    return;
                }

                const {name, width, minWidth, filter, heading, suppressSort, sort, renderFilter, children : columnChildren } = columnElem.props;
                const transformedFilter = getCustomFilter(filter) ?? filter;
                const getValueFn = getCustomGetValue(filter);

                let typeRef = null, sortable = false, enabled = false;
                if (name && typeof columnChildren !== "function")
                {
                    if (moveRowColumn != null && moveRowColumn === name) {
                        enabled = true;
                        enabledCount++;
                    } else if (visibleColumnsNotSet || visibleColumns.includes(name)) {
                        const columnState = findColumn(columnStates, name);

                        if (columnState && columnState.enabled) {
                            sortable = columnState.sortable && !suppressSort;

                            if (type) {
                                const typeContext = lookupTypeContext(type, name);

                                if (transformedFilter && typeof transformedFilter !== "function" && config.inputSchema.getFieldMeta(typeContext.domainType, typeContext.field.name, "computed")) {
                                    throw new Error(
                                        "Computed column '" + typeContext.field.name + "' cannot be filtered with a simple filter.\n" +
                                        "You need to write a custom filter function that basically reimplements the computed in SQL and produces a matching filter expression."
                                    )
                                }


                                typeRef = unwrapAll(typeContext.field.type);
                                if (typeRef.kind !== "SCALAR") {
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

                const column = {
                    name,
                    width,
                    minWidth,
                    sortable,
                    filter: transformedFilter,
                    filterIndex: null,
                    getValue: getValueFn,
                    enabled,
                    type: typeRef?.name,
                    heading: heading || name,
                    sort: sort || name,
                    renderFilter,
                    columnElem
                };

                if (transformedFilter != null) {
                    column.filterIndex = filterIndex;
                    filterIndex++;
                }

                if (moveRowColumn != null && moveRowColumn === name) {
                    columns.unshift(column);
                } else  if (visibleColumnsNotSet || !name) {
                    columns.push(column);
                    if(name) {
                        nonVisibleColumns.push({name, label: heading});
                    }
                } else {
                    columnMap.set(name, column);
                    if (!visibleColumns.includes(name)) {
                        nonVisibleColumns.push({name, label: heading});
                    }
                }
            });

            if (enabledCount === 0)
            {
                throw new Error("Grid (id = " +  id + ") must have visible columns");
            }

            const sortedColumns = [];
            const currentVisibleColumns = [];

            if (isArrayNotEmpty(visibleColumns)) {
                for (const name of visibleColumns) {
                    if (columnMap.has(name)) {
                        const element = columnMap.get(name);
                        if (element != null) {
                            sortedColumns.push(element);
                            currentVisibleColumns.push({name, label: element.heading});
                        }
                    }
                }
            }

            const resultColumns = [...columns, ...sortedColumns];

            resultColumns[0].enabledCount = enabledCount;

            return [resultColumns, nonVisibleColumns, currentVisibleColumns];

        },
        [ type, columnStatesInput, visibleColumns ]
    );

    const fieldResolver = useMemo(
        () => new FieldResolver(),
        []
    );
    const [records, setRecords] = React.useState([]);

    const viewDependencies = resolveTableDependencies(type);
    function mapWorkingSetDependencies(dependency) {
        return workingSet.newObjects(dependency).map((entry) => {
            const newEntry = createDomainObject(type);
            newEntry.id = entry.id;
            for (const fieldName in newEntry) {
                const fieldDependencies = resolveFieldDependencies(type, fieldName);
                if (fieldDependencies != null) {
                    const fieldDependency = fieldDependencies.filter(e => e.startsWith(`${dependency}.`))[0];
                    if (fieldDependency != null) {
                        const [, fieldDependencyName] = fieldDependency.split(".");
                        newEntry[fieldName] = entry[fieldDependencyName];
                    }
                }
            }
            return newEntry;
        });
    }
    const newWorkingSetObjects = useMemo(() => {
        return workingSet ? [
            ...workingSet.newObjects(type),
            ...viewDependencies?.map(mapWorkingSetDependencies).flat() ?? []
        ] : []
    }, [workingSet?.newObjects()]);

    const queryCondition = useMemo(() => {
        if (queryConfig.condition == null) {
            return null;
        }
        return filterIDListFromCondition(queryConfig.condition);
    }, [queryConfig.condition]);

    useEffect(() => {
        const sortedRows = sortByField(rows, moveRowColumn).map(
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
        
                const filterFn = filterTransformer(queryCondition, fieldResolver.resolve);
        
                return newWorkingSetObjects.filter( obj => {
                    fieldResolver.current = obj;
                    return filterFn();
                }).map(context => [context, null]);
            })() || []),
            ...sortedRows
        ];

        setRecords(result);
    }, [
        rows,
        newWorkingSetObjects,
        queryCondition,
        workingSet?.changes
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
                    // update moveRowColumn field
                    movedRow = records[dragIndex][0];
                    const nextRow = records[i][0];
                    if (i === 0) {
                        movedRow[moveRowColumn] = nextRow[moveRowColumn] - 1
                    } else {
                        const prevRow = records[i - 1][0];
                        movedRow[moveRowColumn] = nextRow[moveRowColumn] - (nextRow[moveRowColumn] - prevRow[moveRowColumn]) / 2
                    }
                }
                if (i !== dragIndex) {
                    // push unchanged element
                    resRecords.push(records[i]);
                }
                if (dragIndex < dropIndex && i === dropIndex) {
                    // push element up to new position
                    resRecords.push(records[dragIndex]);
                    // update moveRowColumn field
                    movedRow = records[dragIndex][0];
                    const prevRow = records[i][0];
                    if (i === records.length - 1) {
                        movedRow[moveRowColumn] = prevRow[moveRowColumn] + 1
                    } else {
                        const nextRow = records[i + 1][0];
                        movedRow[moveRowColumn] = prevRow[moveRowColumn] + (nextRow[moveRowColumn] - prevRow[moveRowColumn]) / 2
                    }
                }
            }
            setRecords(resRecords);
            // call handler callback function
            if (typeof moveRowHandler === "function") {
                moveRowHandler(movedRow, resRecords.map((e) => e[0]), movedRow[moveRowColumn]);
            }
        }

        endMoveRow();
    };

    const endMoveRow = () => {
        setSourceRow(null);
        setTargetRow(null);
    };

    return (
        <DndProvider manager={DndManager}>
            <GridStateForm
                iQuery={ internalQuery }
                columns={ columns }
                componentId={ id }
                filterTimeout={ filterTimeout }
            >
                <div className="d-flex flex-column my-2 w-100">
                    {
                        displayControlButtons && (
                            <>
                                <DataGridButtonToolbar
                                    resetFilterButtonDisabled={resetFilterButtonDisabled}
                                    customizeColumnsButtonDisabled={customizeColumnsButtonDisabled}
                                    setIsColumnModalOpen={setIsColumnModalOpen}
                                />
                                <UserColumnConfigDialogModal
                                    isOpen={isColumnModalOpen}
                                    toggle={toggleColumnModalOpen}
                                    activeElements={currentVisibleColumns}
                                    inactiveElements={nonVisibleColumns}
                                    onSubmit={(newVisibleColumns) => {
                                        if (typeof onTableConfigChange === "function") {
                                            onTableConfigChange({
                                                paginationSize,
                                                sortColumn,
                                                visibleColumns: newVisibleColumns.map((element) => element.name)
                                            });
                                        }
                                    }}
                                />
                            </>
                        )
                    }
                    <div
                        className={
                            cx(
                                "data-grid-container my-2",
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
                                    value={ internalQuery }
                                    columns={ columns }
                                    moveRowColumn={ moveRowColumn }
                                />
                                {
                                    !suppressFilter && (
                                        <FilterRow
                                            columns={ columns }
                                            moveRowColumn={ moveRowColumn }
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
                                                    workingSet={ workingSet }
                                                    columns={ columns }
                                                    moveRow={ moveRow }
                                                    dropRow={ dropRow }
                                                    moveRowColumn={ moveRowColumn }
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
                        pageSizes={ paginationPageSizes }
                    />
                </div>
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

    /**
     * The column used for manually sorting rows.
     * The column must contain number values.
     * It will be rendered in front of all other columns and a grabber icon is renddered instead of the value.
     */
    moveRowColumn: PropTypes.string,
    /**
     * Handler for reacting to manual row movement.
     * @param {Object} movedRow the row that has been moved (with the updated moveRowColumn value)
     * @param {Object[]} sortedRows the new sorted row set
     * @param {Number} newValue the new moveRowColumn value of the moved row
     */
    moveRowHandler: PropTypes.func,

    /**
     * set the available page sizes for the pagination
     */
    paginationPageSizes: PropTypes.arrayOf(PropTypes.oneOfType([PropTypes.string, PropTypes.number])),

    /**
     * set whether the control buttons should be displayed or not
     */
    displayControlButtons: PropTypes.bool,

    /**
     * set whether the "Reset Filters" button is disabled or not
     */
    resetFilterButtonDisabled: PropTypes.bool,

    /**
     * set whether the "Customize Columns" button is disabled or not
     */
    customizeColumnsButtonDisabled: PropTypes.bool,

    /**
     * the user table configuration
     */
    tableConfig: PropTypes.object,

    /**
     * the function called on changes to the user table configuration
     */
    onTableConfigChange: PropTypes.func
};


DataGrid.Column = Column;
DataGrid.RowSelector = RowSelector;
DataGrid.WorkingSetStatus = WorkingSetStatusComponent;

DataGrid.displayName = "DataGrid";
Column.displayName = "Column";

export default DataGrid
