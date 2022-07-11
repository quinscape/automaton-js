import React from "react"
import assert from "power-assert"
import cloneJSONObject from "../../src/util/cloneJSONObject";

import { field, value, values, and, or, not, condition, operation } from "../../src/FilterDSL";

describe("clone", function () {

    it("clones JSON object graphs", function () {

        {
            const obj = { a : "Hello", b: "There", c: [1,2,3], d: true, e: 123}
            const copy = cloneJSONObject(obj)

            assert(obj !== copy)
            assert(obj.a === copy.a)
            assert(obj.b === copy.b)
            assert(obj.c !== copy.c)
            assert(obj.c[0] === copy.c[0])
            assert(obj.c[1] === copy.c[1])
            assert(obj.c[2] === copy.c[2])
            assert(obj.d === copy.d)
            assert(obj.e === copy.e)

        }

        {
            const obj = [1,{foo:"bar"}]
            const copy = cloneJSONObject(obj)

            assert(obj !== copy)
            assert(obj[0] === copy[0])
            assert(obj[1] !== copy[1])
            assert(obj[1].foo === copy[1].foo)

        }

    })
});
