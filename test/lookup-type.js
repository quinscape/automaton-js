import assert from "power-assert"
import InputSchema from "domainql-form/lib/InputSchema";

import config from "../src/config";
import lookupType from "../src/util/lookupType"

import RAW_SCHEMA from "./test-schema.json"
config.inputSchema = new InputSchema(RAW_SCHEMA);

describe("lookupType", function () {
    it("looks up types", function () {

        assert.deepEqual(lookupType("PagedOrder", "rows") , {
            "kind": "OBJECT",
            "name": "Order",
            "ofType": null
        })

        assert.deepEqual(lookupType("PagedOrder", "rows.trackingNumber") , {
            "kind": "SCALAR",
            "name": "String",
            "ofType": null
        })

        assert.deepEqual(lookupType("FooInput", "name") , {
            kind:"SCALAR",
            name:"String",
            ofType:null
        })

    });

});
