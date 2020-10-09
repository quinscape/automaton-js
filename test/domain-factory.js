import { describe, it } from "mocha";
import { InputSchema, registerDomainObjectFactory, WireFormat } from "domainql-form";
import rawSchema from "./domain-factory-test.json";

import assert from "power-assert"
import { __setWireFormatForTest } from "../src/domain";
import { automatonDomainObjectFactory } from "../src/startup";
import config from "../src/config";
import { observable } from "mobx";


describe("Automaton Domain Object Factory", () => {

    it("enables correct cloning", function () {

        const schema = new InputSchema(rawSchema);

        config.inputSchema = schema;
        const wireFormat = new WireFormat(schema, {

        });
        __setWireFormatForTest(wireFormat);

        registerDomainObjectFactory(automatonDomainObjectFactory);

        const foo = observable({
            _type: "Foo",
            name: "Test Foo",
            num:2983,
            created: new Date("2020-10-09T12:00:00.000Z"),
        })

        const clone = schema.clone(foo);

        assert(clone.name === "Test Foo")
        assert(clone.num === 2983)
        assert(clone.created.toISOString() === "2020-10-09T12:00:00.000Z")
        assert(clone.description === undefined)
    })
});
