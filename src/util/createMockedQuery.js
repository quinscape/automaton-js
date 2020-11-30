// creates a GraphQLQuery instance with mocked .execute method that returns a fixed result.
import config from "../config";
import GraphQLQuery from "../GraphQLQuery";
import { toJS } from "mobx";
import { FieldResolver, filterTransformer } from "../index";
import { field, Type } from "../FilterDSL";
import { lookupType } from "./type-utils";


/**
 * Creates a mocked query that returns a single constant result.
 *
 * If you need filtering or pagination on your mock, use createFilteredMockQuery
 *
 * @param {WireFormat} format   wire format
 * @param {String} type         iQuery container type
 * @param {Object} payload      constant iQuery result to return from the mocked query
 *
 * @return {GraphQLQuery} mocked query object.
 */
export function createMockedQuery(format, type, payload)
{
    //console.log({payload})
    const payloadIsFunction = typeof payload === "function";

    const instance = new GraphQLQuery("", payloadIsFunction ? {} : { config: payload.queryConfig });
    instance.execute = variables => {

        //console.log("MOCKED", JSON.stringify(converted, null, 4));

        if (payloadIsFunction)
        {
            const pl = payload(variables);

            //console.log("PAYLOAD", toJS(pl))

            const converted = format.convert(
                {
                    kind: "OBJECT",
                    name: type
                },
                pl,
                true
            );
            converted._query = instance;
            return Promise.resolve({
                    testQuery: converted
                }
            );
        }
        else
        {
            const converted = format.convert(
                {
                    kind: "OBJECT",
                    name: type
                },
                payload,
                true
            );
            converted._query = instance;

            return Promise.resolve({
                testQuery: converted
            });
        }
    };
    return instance;
}

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


export function sort(rows, sortFields)
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
 * Convenience helper to create a filtered and paginated mocked query. The given query data is supposed to be the same as for a single page of
 * the results, but containing all available rows.
 *
 * if the vars contain a condition the full list of objects will be filtered by that condition before pagination.
 */
export function createFilteredMockQuery(format, type, payload)
{
    const query = createMockedQuery(format, type, vars => {

        const config = vars.config || payload.queryConfig;

        const { offset, pageSize } = config;

        const Impl = format.classes[type];

        const newPayload = Impl ? new Impl() : {};

        newPayload.type = payload.type;
        newPayload.queryConfig = config;
        newPayload.columnStates = payload.columnStates;
        newPayload.rowCount = payload.rowCount;

        const resolver = new FieldResolver();
        const filter = filterTransformer(config.condition, resolver.resolve )

        let filteredRows = payload.rows.filter( r => {
            resolver.current = r;
            return filter();
        })

        if (Array.isArray(config.sortFields) && config.sortFields.length)
        {
            filteredRows = sort(filteredRows, config.sortFields);
        }

        if (pageSize > 0)
        {
            newPayload.rows = filteredRows.slice(offset, offset + pageSize)
        }
        else
        {
            newPayload.rows = filteredRows
        }

        return newPayload;
    });

    // normally this is done by preprocessor
    query._query = query;

    return query
}
