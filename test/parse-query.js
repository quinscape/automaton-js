import assert from "power-assert"
import parseQuery from "../src/parseQuery";
import InputSchema from "domainql-form/lib/InputSchema";

import RAW_SCHEMA from "./test-schema.json";


describe("parseQuery", function () {

    it("parses GraphQL queries for their input types", function () {

        const inputSchema = new InputSchema(RAW_SCHEMA);

        // language=GraphQL
        const {vars, aliases} = parseQuery(inputSchema, `
            mutation testMutation($target: FooInput!, $count: Int){
                wireTestMutation(input : $target, count: $count)
                {
                    id
                    created
                    check
                }
            }`
        );

        assert(aliases === false);

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
        const {vars, aliases} = parseQuery(inputSchema, `

            mutation testMutation($list: [String]){
                wireTestMutation2(list: $list)
            }`
        )

        assert(aliases === false);

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
        const {vars, aliases} = parseQuery(inputSchema, `
            {
                wireTestMutation
                {
                    id
                    created
                    check
                }
            }`
        );

        assert(aliases === false);

        assert.deepEqual(
            vars,
            {}
        )

    });

    it("extracts field aliases", function () {

        const inputSchema = new InputSchema(RAW_SCHEMA);

        // language=GraphQL
        const {vars, aliases} = parseQuery(inputSchema, `
            mutation testMutation($target: FooInput!, $count: Int){
                wireTestMutation(input : $target, count: $count)
                {
                    f1: id
                    f2: created
                    f3: check
                }
            }`
        );

        assert.deepEqual(aliases, {
            "f1": "wireTestMutation.id",
            "f2" : "wireTestMutation.created",
            "f3" : "wireTestMutation.check"
        });

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

    it("extracts invoked queries/mutations", function () {

        const inputSchema = new InputSchema(RAW_SCHEMA);

        // language=GraphQL
        const {methodCalls, vars, aliases} = parseQuery(inputSchema, `
                    query getUsers
                    {
                        xxx: getUsers( limit: 1000)
                    {
                        rowCount
                        rows{
                            name : login
                            value : created
                        }
                    }
                    }
            `
        );

        assert.deepEqual(
            methodCalls,
            [
                "xxx"
            ]
        );

        assert.deepEqual(
            aliases,
            {
                "xxx" : "getUsers",
                "name" : "getUsers.rows.login",
                "value" : "getUsers.rows.created"
            }
        );

        assert.deepEqual(
            vars,
            {}
        )

    });
});
