import query  from "../../../src/query"

export default query(
    // language=GraphQL
        `query QuxD_Injected($config: QueryConfigInput!)
    {
        iQueryQuxD(config: $config)
        {
            type
            columnStates{
                name
                enabled
                sortable
            }
            queryConfig {
                id
                condition
                offset
                pageSize
                sortFields
            }
            rows {
                id
                name
                value
                description
            }
            rowCount
        }
    }`,
    {
        config: {
            pageSize: 0,
            sortFields: ["id"]
        }
    }
)
