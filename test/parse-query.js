import assert from "power-assert"
import parseQuery from "../src/parseQuery";
import { InputSchema } from "domainql-form";

import RAW_SCHEMA from "./test-schema.json";


describe("parseQuery", function () {

    it("parses GraphQL queries for their input types", function () {

        const inputSchema = new InputSchema(RAW_SCHEMA);

        // language=GraphQL
        const vars = parseQuery(inputSchema, `
            mutation testMutation($target: FooInput!, $count: Int){
                wireTestMutation(input : $target, count: $count)
                {
                    id
                    created
                    check
                }
            }`
        )

        assert.deepEqual(
            vars,
            {
                "target": {
                    "kind": "NON_NULL",
                    "ofType": {
                        "kind": "OBJECT",
                        "name": "FooInput"
                    }
                },
                "count": {
                    "kind": "SCALAR",
                    "name": "Int"
                }
            }
        )

    });

    it("parses GraphQL queries with list params", function () {

        const inputSchema = new InputSchema(RAW_SCHEMA);

        // language=GraphQL
        const vars = parseQuery(inputSchema, `
            mutation testMutation($list: [String]){
                wireTestMutation2(list: $list)
            }`
        )

        assert.deepEqual(
            vars,
            {
                "list": {
                    "kind": "LIST",
                    "ofType": {
                        "kind": "SCALAR",
                        "name": "String"
                    }
                }
            }
        )

    });

    it("parses raw queries", function () {

        const inputSchema = new InputSchema(RAW_SCHEMA);

        // language=GraphQL
        const vars = parseQuery(inputSchema, `
            {
                wireTestMutation
                {
                    id
                    created
                    check
                }
            }`
        );

        assert.deepEqual(
            vars,
            {}
        )

    });

});
