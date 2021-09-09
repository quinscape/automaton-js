import { computed, makeObservable, observable } from "mobx";

import { parse } from "graphql/language/parser"
import { Kind } from "graphql/language/kinds"


/**
 * Encapsulates a query and a default query config as user-editable query definition
 *
 * @category iquery
 */
export default class InteractiveQueryDefinition {

    constructor(query,queryConfig)
    {
        this.query = query;
        this.queryConfig = queryConfig;

        makeObservable(this)
    }

    @observable query;
    @observable queryConfig;
}
