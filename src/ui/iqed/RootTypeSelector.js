import React, { useMemo } from "react"
import config from "../../config";
import i18n from "../../i18n";
import { observer as fnObserver } from "mobx-react-lite";
import { INTERACTIVE_QUERY } from "../../domain";

import { ButtonToolbar } from "reactstrap"
import { getIQueryPayloadType } from "../../util/type-utils";
import { getGraphQLMethodType } from "../../Process";
import { OBJECT } from "domainql-form/lib/kind";


const RootTypeSelector = fnObserver(({state}) => {

    const iQueryMethods = useMemo(
        () => {

            const { inputSchema } = config;

            const queryMethods = inputSchema.getType("QueryType").fields;

            const types = [];

            for (let i = 0; i < queryMethods.length; i++)
            {
                const { name: queryMethod } = queryMethods[i];
                const graphQLMethodType = getGraphQLMethodType(queryMethod, true);
                if (graphQLMethodType.kind === OBJECT)
                {
                    const iQueryType = graphQLMethodType.name;
                    const payloadType = getIQueryPayloadType(iQueryType);
                    if (payloadType)
                    {
                        types.push({
                            queryMethod,
                            payloadType
                        });
                    }
                }
            }

            types.sort((a,b) => {

                const { queryMethod : queryMethodA, payloadType : payloadTypeA } = a;
                const { queryMethod : queryMethodB, payloadType : payloadTypeB } = b;

                if (payloadTypeA === payloadTypeB)
                {
                    return queryMethodA.localeCompare(queryMethodB);
                }
                return payloadTypeA.localeCompare(payloadTypeB);
            })

            return types;
        },
        []
    )

    return (
        <form>
            <div className="form-group">
                <select
                    className="custom-select"
                    size={ 10 }
                    onDoubleClick={
                        ev => {
                            state.setQueryMethod(iQueryMethods[+ev.target.value], true);
                        }
                    }
                    onChange={ ev => {
                        state.setQueryMethod(iQueryMethods[+ev.target.value]);
                    }}
                >
                    {
                        iQueryMethods.map( (entry, idx) => (
                            <option key={ entry.queryMethod } value={ idx }>
                                {
                                    idx > 0 && iQueryMethods[idx - 1].payloadType === entry.payloadType ?
                                    i18n("{0} via {1}", i18n(entry.payloadType), entry.queryMethod) :
                                    i18n(entry.payloadType)
                                }
                            </option>
                        ))
                    }
                </select>
            </div>

            <ButtonToolbar>
                <button
                    type="button"
                    className="btn btn-primary"
                    onClick={ () => state.confirmRoot() }
                >
                    {
                        i18n("Select Type")
                    }
                </button>
            </ButtonToolbar>
        </form>
    );
});

export default RootTypeSelector;
