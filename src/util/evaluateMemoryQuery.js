import { action, toJS } from "mobx";
import config from "../config";
import { FieldResolver } from "./filterTransformer";
import filterTransformer from "../util/filterTransformer";
import { field, Type } from "../FilterDSL";
import InteractiveQuery from "../model/InteractiveQuery";


function transformSortFields(resolver, sortFields)
{
    const isDescending = new Array(sortFields.length);
    const filters = sortFields.map((condition, idx) => {

        if (!condition)
        {
            throw new Error("Invalid sort field: " + condition);
        }

        if (typeof condition === "string")
        {
            const desc = condition[0] === "!";
            isDescending[idx] = desc;
            const ref = field(desc ? condition.substr(1) : condition);

            return filterTransformer(
                ref,
                resolver.resolve
            );
        }
        else
        {
            const {type, name} = condition;

            if (type === Type.OPERATION)
            {
                const operand = condition.operands[0];


                if (name === "asc")
                {
                    isDescending[idx] = false;
                    return filterTransformer(
                        operand,
                        resolver.resolve
                    );
                }
                else if (name === "desc")
                {
                    isDescending[idx] = true;
                    return filterTransformer(
                        operand,
                        resolver.resolve
                    );
                }
                isDescending[idx] = false;
            }

            return filterTransformer(
                condition,
                resolver.resolve
            );
        }
    })

    return { filters, isDescending }
}

function sort(rows, sortFields)
{
    const resolver = new FieldResolver();
    const { filters, isDescending } = transformSortFields(resolver, sortFields);

    const numFilters = filters.length;
    const sortedRows = rows.slice();
    sortedRows.sort((a, b) => {

        let offset = 0;
        do
        {
            const mul = isDescending[offset] ? -1 : 1;

            const filter = filters[offset];

            resolver.current = a;
            const valueA = filter();

            resolver.current = b;
            const valueB = filter();

            if (valueA < valueB)
            {
                return -1 * mul;
            }
            else if (valueA > valueB)
            {
                return mul;
            }
            else
            {
                offset++;
            }

        } while (offset < numFilters)
        return 0;
    })

    return sortedRows;
}


/**
 * Filters a given cached iQuery document according to the give query config object.
 *
 * @category iquery
 *
 * @param format            WireFormat instance
 * @param cachedDocument    cached iQuery document containing all data
 * @param queryConfig       QueryConfig instance
 * @param [document]        optional iQuery doc to update with the new result
 * @return new or updated iQuery document containing the filtered and sorted results
 */
export const evaluateMemoryQuery = action(
    "evaluateMemoryQuery",
    (format, cachedDocument, queryConfig, document) => {

        //console.log("evaluateMemoryQuery", queryConfig)

        if (!document)
        {
            document = new InteractiveQuery();

            document._type = cachedDocument._type;
            document.type = cachedDocument.type;
            document.queryConfig = {
                ... queryConfig
            };
            document.columnStates = cachedDocument.columnStates;
            document.rowCount = cachedDocument.rowCount;
        }

        const { offset, pageSize } = queryConfig;

        const resolver = new FieldResolver();
        const filter = filterTransformer(queryConfig.condition, resolver.resolve)

        document.queryConfig.condition = queryConfig.condition;

        let filteredRows = cachedDocument.rows.filter(r => {
            resolver.current = r;
            return filter();
        })

        if (Array.isArray(queryConfig.sortFields) && queryConfig.sortFields.length)
        {
            filteredRows = sort(filteredRows, queryConfig.sortFields);

            document.queryConfig.sortFields = queryConfig.sortFields;
        }

        if (pageSize > 0)
        {
            document.rows = filteredRows.slice(offset, offset + pageSize)
            document.queryConfig.offset = offset;
            document.queryConfig.pageSize = pageSize;
        }
        else
        {
            document.rows = filteredRows
        }
        return document;
    });
