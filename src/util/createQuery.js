import GraphQLQuery from "../GraphQLQuery"
import toPath from "lodash.topath";


function findCommon(a, b)
{
    let len = Math.min(a.length - 1, b.length - 1)

    let common = 0;
    while(common < len && a[common] === b[common])
    {
        common++
    }
    return common
}


function addIndent(out, indent)
{
    for (let i = 0; i < indent; i++)
    {
        out.push("    ")
    }
}


export function nestFields(fieldsIn, baseIndent = 0)
{
    const out = []
    const sortedFields = fieldsIn.slice()
    sortedFields.sort()
    const fields = sortedFields.map( n => toPath(n))

    let current = [""]
    let currentLevel = 0

    for (let i = 0; i < fields.length; i++)
    {
        const field = fields[i]

        let common = findCommon(field, current)

        while (currentLevel > common)
        {
            currentLevel--
            addIndent(out, currentLevel + baseIndent)
            out.push("}\n")
        }

        while (currentLevel < field.length - 1)
        {
            addIndent(out, currentLevel + baseIndent)
            out.push(field[currentLevel] +" {\n")
            currentLevel++
        }
        addIndent(out, currentLevel + baseIndent)
        out.push(field[field.length - 1] + "\n")

        current = field
    }

    while (currentLevel > 0)
    {
        currentLevel--
        addIndent(out, currentLevel + baseIndent)
        out.push("}\n")
    }

    const result = out.join("")
    //console.log("NESTED\n" + result)
    return result
}

function createIQuery(rootType, select)
{
    const nestedFields = nestFields(select, 5)

    return `query iQuery${rootType}($config: QueryConfigInput!)
        {

            iQuery${rootType}(config: $config)
            {
                type
                columnStates{
                    name
                    enabled
                    sortable
                }
                queryConfig{
                    id
                    condition
                    offset
                    pageSize
                    sortFields
                }
                rows{
${nestedFields}
                }
                rowCount
            }
        }`
}


/**
 * Creates an actual GraphQL query from data in condition editor format.
 *
 * @param {string} rootType             starting typer
 * @param {Object} queryConfig          query config (in the ConditionEditor sense :\ )
 * @param {Array} queryConfig.select    Array of field (e.g. "owner.login")
 * @param {Object} queryConfig.where    FilterDSL condition graph
 * @param {Array} queryConfig.sort      Array of sort fields
 * @param {QueryConfig} [config]        query config to provide offset and paging (Default is no offset, 100 elements)
 */
export default function createQuery(rootType, queryConfig, config)
{
    const { select, where, sort } = queryConfig

    return new GraphQLQuery(
        createIQuery(rootType, select),
        {
            config: {
                sortFields: sort,
                condition: where,
                offset: 0,
                pageSize: 100,
                ... config
            }
        }
    )
}
