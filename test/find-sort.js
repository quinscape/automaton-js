import assert from "power-assert"

import { and, or, not, field, value, component, operation } from "../src/FilterDSL"
import findSort from "../src/ui/datagrid/findSort";


describe("findSort", function () {

    it("finds sort field expressions", function () {

        assert( findSort(["name"], "name") === 1);
        assert( findSort(["!name"], "name") === 2);
        assert( findSort(["num"], "name") === 0);

        assert( findSort([field("name")], "name") === 1);
        assert( findSort([operation("desc", [field("name")])], "name") === 2);
        assert( findSort([field("num")], "name") === 0);

        const sort = field("name");

        assert( findSort(["name"], sort) === 1);
        assert( findSort(["!name"], sort) === 2);
        assert( findSort(["num"], sort) === 0);

        assert( findSort([field("name")], sort) === 1);
        assert( findSort([operation("desc", [field("name")])], sort) === 2);
        assert( findSort([operation("desc", [field("num")])], sort) === 0);


        const complex = field("numa").add(field("numb"));
        const inverseComplex = operation("desc", [field("numa").add(field("numb"))])

        assert( findSort(["num", complex], complex) === 1);
        assert( findSort(["!num", inverseComplex], complex) === 2);
        assert( findSort([field("num")], complex) === 0);

    });

});
