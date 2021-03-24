import query  from "../../../src/query"

export default query(
    // language=GraphQL
        `query iQueryQuxB($config: QueryConfigInput!)
    {
        iQueryQuxB(config: $config)
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
    }`,{
        config: {
            pageSize: 5,
            sortFields: ["name"]
        }
    }
)
