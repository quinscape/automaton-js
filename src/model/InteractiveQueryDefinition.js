import { computed, observable } from "mobx";

import { parse } from "graphql/language/parser"
import { Kind } from "graphql/language/kinds"


/**
 * Encapsulates a query and a default query config as user-editable query definition
 */
export default class InteractiveQueryDefinition {

    constructor(query,queryConfig)
    {
        this.query = query;
        this.queryConfig = queryConfig;
    }

    @observable query;
    @observable queryConfig;
}
