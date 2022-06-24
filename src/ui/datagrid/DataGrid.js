import React, {useCallback, useMemo, useState} from "react"
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
import {Button} from "../../index";
import {ButtonGroup, ButtonToolbar} from "reactstrap";
import UserColumnConfigDialogModal from "./userconfig/UserColumnConfigDialogModal";
import DataGridButtonToolbar from "./DataGridButtonToolbar";


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
        children
    } = props;

    const {
        visibleColumns,
        paginationSize,
        sortColumn
    } = tableConfig;

    const visibleColumnsNotSet = visibleColumns == null || visibleColumns.length < 1;

    const [isColumnModalOpen, setIsColumnModalOpen] = useState(false);

    const toggleColumnModalOpen = () => setIsColumnModalOpen(!isColumnModalOpen);

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

                const {name, width, minWidth, filter, heading, sort, renderFilter, children : columnChildren } = columnElem.props;
                const transformedFilter = getCustomFilter(filter) ?? filter;

                let typeRef = null, sortable = false, enabled = false;
                if (name && typeof columnChildren !== "function")
                {
                    if (visibleColumnsNotSet || visibleColumns.includes(name)) {
                        const columnState = findColumn(columnStates, name);

                        if (columnState && columnState.enabled) {
                            sortable = columnState.sortable;

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

                if (visibleColumnsNotSet || !name) {
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

            if (visibleColumns != null) {
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
                                    onTableConfigChange({
                                        paginationSize,
                                        sortColumn,
                                        visibleColumns: newVisibleColumns.map((element) => element.name)
                                    });
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
                    pageSizes={ paginationPageSizes }
                />
            </div>
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
