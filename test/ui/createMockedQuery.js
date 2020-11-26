// creates a GraphQLQuery instance with mocked .execute method that returns a fixed result.
import GraphQLQuery from "../../src/GraphQLQuery";
import { toJS } from "mobx";
import { FieldResolver, filterTransformer } from "../../src";


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
        const filter = filterTransformer(newPayload.queryConfig.condition, resolver.resolve )

        const filteredRows = payload.rows.filter( r => {
            resolver.current = r;
            return filter();
        })

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
