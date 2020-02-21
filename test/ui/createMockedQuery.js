// creates a GraphQLQuery instance with mocked .execute method that returns a fixed result.
import GraphQLQuery from "../../src/GraphQLQuery";


export function createMockedQuery(format, type, payload)
{
    //console.log({payload})

    const instance = new GraphQLQuery("", {});
    instance.execute = variables => {

        //console.log("MOCKED", JSON.stringify(converted, null, 4));

        if (typeof payload === "function")
        {
            return Promise.resolve(
                payload(variables)
            );
        }
        else
        {
            return Promise.resolve({
                testQuery: format.convert(
                    {
                        kind: "OBJECT",
                        name: type
                    },
                    payload,
                    true
                )
            });
        }
    };
    return instance;
}
