import query  from "../../../src/query"

export default query(
    // language=GraphQL
        `query iQueryQuxC($config: QueryConfigInput!)
    {
        iQueryQuxC(config: $config)
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
            pageSize: 5,
            sortFields: ["name"]
        }
    }
)
