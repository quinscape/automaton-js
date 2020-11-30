import React from "react"
import assert from "power-assert"
import filterTransformer, { FieldResolver } from "../../src/util/filterTransformer";

import { field, value, values, and, or, not, condition, operation } from "../../src/FilterDSL";
import config from "../../src/config";
import InteractiveQuery from "../../src/model/InteractiveQuery";
import { __setWireFormatForTest } from "../../src/domain";
import { WireFormat } from "domainql-form";

const rawSchema = require("./mock-query-schema.json")

describe("createMockQuery Module", function () {


    it.skip("creates static mocks", function () {

        const inputSchema = new InputSchema(rawSchema);

        config.inputSchema = inputSchema;

        const wireFormat = new WireFormat(
            inputSchema,
            {
                InteractiveQueryBaz: InteractiveQuery,
                InteractiveQueryBazValue: InteractiveQuery
            }
        )

        __setWireFormatForTest(wireFormat);

    })

    it.skip("creates filtered mocks", function () {

    })


});
