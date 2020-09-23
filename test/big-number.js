import { describe, it } from "mocha";
import { WireFormat, InputSchema } from "domainql-form";
import rawSchema from "./big-number-schema.json";

import assert from "power-assert"
import registerBigDecimalConverter from "../src/registerBigDecimalConverter";
import { __setWireFormatForTest } from "../src/domain";
import BigNumber from "bignumber.js";

describe("Big Number support", function () {

    it("does wire conversion String -> BigNumber, BigNumber -> String", function () {

        const schema = new InputSchema(rawSchema);

        const wireFormat = new WireFormat(schema, {

        });

        __setWireFormatForTest(wireFormat);
        
        registerBigDecimalConverter();

        const converted = wireFormat.convert({
            kind: "OBJECT",
            name : "Garply"
        }, {
            "name" : "Test-Garply",
            "value":  "123.45",
            "opt":  null

        }, true);

        assert(converted.name === "Test-Garply")
        assert(converted.value.toPrecision(5) === "123.45")
        assert(converted.opt === null)

        const converted2 = wireFormat.convert({
            kind: "OBJECT",
            name : "Garply"
        }, {
            "name" : "Test-Garply",
            "value":  new BigNumber("234.56"),
            "opt":  null

        }, false);


    })

    it("does input conversion String -> BigNumber, BigNumber -> String", function () {

        const schema = new InputSchema(rawSchema);

        const wireFormat = new WireFormat(schema, {

        });

        __setWireFormatForTest(wireFormat);

        registerBigDecimalConverter();

        const num = InputSchema.scalarToValue("BigDecimal", new BigNumber("345.67"));
        assert(num === "345.67")

        const num2 = InputSchema.scalarToValue("BigDecimal", null);
        assert(num2 === "")

        const num3 = InputSchema.valueToScalar("BigDecimal", "456.78");
        assert(num3.toPrecision(5) === "456.78")

        const num4 = InputSchema.valueToScalar("BigDecimal", "");
        assert(num4 === null)

    })
});
