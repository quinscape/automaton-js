/*
 * Copyright 2022, QuinScape GmbH. All rights reserved.
 */


import {action, makeObservable, observable} from "mobx";
import updateComponentCondition from "../util/updateComponentCondition";
import { isConditionObject } from "../FilterDSL";
import filterTransformer, { FieldResolver } from "../util/filterTransformer";
import InteractiveQuery from "./InteractiveQuery";

const fieldResolver = new FieldResolver();

function filterBy(data, condition) {
    if (isConditionObject(condition)) {
        const filterFn = filterTransformer(condition, fieldResolver.resolve);
        return data.filter(row => {
            fieldResolver.current = row;
            return filterFn();
        });
    }
    return data.slice();
}

function sortRowsByFields(rows, sortFields) {
    return rows.sort((row0, row1) => {
        for (const sortField of sortFields) {
            const order = sortField.startsWith("!") ? -1 : 1;
            const fieldName = order === -1 ? sortField.slice(1) : sortField;
            if (row0[fieldName] < row1[fieldName]) {
                return order;
            } else if (row0[fieldName] > row1[fieldName]) {
                return -order;
            }
        }
        return 0;
    });
}

/**
 * Offline version of {@link InteractiveQuery} emulating sort, filter and paging functionality.
 *
 * @category iquery
 */
export default class OfflineQuery
{

    @observable
    queryConfig;

    @observable
    rows

    @observable
    columnStates

    /**
     * Creates a new OfflineQuery running either on array data or the result of an executed {@link InteractiveQuery}
     * 
     * @param {InteractiveQuery | Object[]} source     source iQuery document or array containing all rows
     */
    constructor(source)
    {
        if (Array.isArray(source)) {
            this.data = source;
            this.rowCount = this.data.length;
            this.queryConfig = {
                "_type": "QueryConfig",
                "pageSize": 10,
                "condition": null,
                "sortFields": [],
                "id": null,
                "offset": 0
            };
            this.columnStates = [];

            const targetObject = source[0];
            if(targetObject){
                for (const columnName in targetObject) {
                    if (columnName !== "_type") {
                        this.columnStates.push({
                            "_type": "ColumnState",
                            "name": columnName,
                            "sortable": true,
                            "enabled": true
                        });
                    }
                }
                this.type = targetObject._type;
            }else {
                this.type = null;
            }
            this._type = "OfflineQuery";
        } else if (source instanceof InteractiveQuery) {
            this.data = source.rows;
            this.rowCount = this.data.length;
            this.queryConfig = source.queryConfig;
            this.columnStates = source.columnStates;
            this.type = source.type;
            this._type = `OfflineQuery${source.type}`;
        } else {
            throw new Error('source muss ein InteractiveQuery oder ein Array sein.');
        }
        this.update();
        makeObservable(this);
    }

    /**
     * Updates the current resolved rows based on a new query config.
     * 
     * The given query config is merged with the current config so you only need to define the changes.
     *
     * Examples:
     *
     * ```js
     * // page to second page
     * iQuery.update({offset: 10})
     *
     * // sorty by name descending
     * iQuery.update({
     *     sortFields: [ "!name" ]
     * })
     * ```
     *
     * @param {Object} queryConfig      query config structure (see de.quinscape.automaton.model.data.QueryConfig)
     * @return {Promise<* | never>}
     */
    @action
    update(value)
    {
        if (value != null) {
            this.queryConfig = {...this.queryConfig, ...value};
        }
        const {offset, pageSize, sortFields, condition} = this.queryConfig;

        const filteredRows = filterBy(this.data, condition);
        const sortedRows = sortRowsByFields(filteredRows, sortFields);
        this.rowCount = sortedRows.length;
        this.rows = sortedRows.slice(offset, offset + pageSize);
    }



    /**
     * Updates a component condition in the current query config state.
     *
     * If no component node is found, the current condition if present will be ANDed with the component condition
     *
     * @param {Object} componentCondition   condition node
     * @param {String} [componentId]        component id if none is given NO_COMPONENT (null) will be used
     * @param {Boolean} [checkConditions]     check component condition before updating, don't update if identical
     * @return {Promise<* | never>}
     */
    @action
    updateCondition(
        componentCondition,
        componentId = NO_COMPONENT,
        checkConditions = true
    )
    {
        let {condition: currentCondition} = this.queryConfig;

        const newCondition = updateComponentCondition(
            currentCondition,
            componentCondition,
            componentId,
            checkConditions
        );

        if (newCondition === currentCondition)
        {
            return Promise.resolve(true);
        }

        return this.update({
            condition: newCondition,
            offset: 0
        })
    }

}

