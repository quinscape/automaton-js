import React from "react"
import assert from "power-assert"
import filterTransformer, { FieldResolver } from "../../src/util/filterTransformer";

import { field, value, values, and, or, not, condition, operation } from "../../src/FilterDSL";
import { now, today } from "../../filter"
import { DateTime } from "luxon"
import sleep from "../ui/sleep"

describe("filterTransformer", function () {

    function transform(cond, obj)
    {
        obj = obj || {
            name: "Test Foo #9473",
            regex: "a+bc",
            num: 938,
            flag: false
        };

        const resolver = name => () => obj[name];

        return filterTransformer(cond,resolver);
    }

    function exec(cond, obj)
    {
        return transform(cond,obj)();
    }


    it("transforms JSON conditions into JS", function () {


        assert(
            exec(field("name").eq(value("Test Foo #9473")))
        )
        assert(
            !exec(field("name").eq(value("Test")))
        )

        assert(
            exec(
                and(
                    field("name").eq(value("Test Foo #9473")),
                    field("num").eq(value(938))
                )
            )
        )

        assert(
            !exec(
                and(
                    field("name").eq(value("Test Foo #9473")),
                    field("num").eq(value(800))
                )
            )
        )

        assert(
            exec(
                and(
                    field("name").eq(value("Test Foo #9473")),
                    not(field("num").eq(value(800)))
                )
            )
        )

        assert(
            exec(
                field("name").equalIgnoreCase(value("TEST FOO #9473"))
            )
        )

        assert(
            !exec(
                field("name").equalIgnoreCase(value("TEST FUH #9473"))
            )
        )

        assert(
            exec(and(condition("true"),condition("true")))
        )
        assert(
            !exec(and(condition("true"),condition("false")))
        )

        assert(
            exec(or(condition("true"),condition("true")))
        )
        assert(
            exec(or(condition("true"),condition("false")))
        )
        assert(
            !exec(or(condition("false"),condition("false")))
        )

        //////////////

        assert( exec(condition("true")));
        assert(!exec(condition("false")));
        assert( exec(condition("orNot", [ value(false), value(false) ])) === true);
        assert( exec(condition("orNot", [ value(true), value(false) ])) === false);

        assert( exec(condition("andNot", [ value(true), value(true) ])) === false);
        assert( exec(condition("andNot", [ value(true), value(false) ])) === true);

        assert( exec(condition("greaterOrEqual", [value(100), value(90)])));
        assert( exec(condition("greaterOrEqual", [value(90), value(90)])));
        assert(!exec(condition("greaterOrEqual", [value(100), value(110)])));

        assert( exec(condition("lessOrEqual", [value(100), value(110)])));
        assert( exec(condition("lessOrEqual", [value(100), value(100)])));
        assert(!exec(condition("lessOrEqual", [value(100), value(90)])));

        assert( exec(condition("lt", [value(100), value(110)])));
        assert(!exec(condition("lt", [value(100), value(100)])));
        assert(!exec(condition("lt", [value(100), value(90)])));

        assert( exec(condition("notBetweenSymmetric", [value(90),value(100), value(200)])));
        assert(!exec(condition("notBetweenSymmetric", [value(100),value(100), value(200)])));
        assert( exec(condition("notBetweenSymmetric", [value(90),value(200), value(100)])));
        assert(!exec(condition("notBetweenSymmetric", [value(100),value(200), value(100)])));


        assert( exec(condition("notEqualIgnoreCase", [value("aaa"), value("Baa")])));
        assert(!exec(condition("notEqualIgnoreCase", [value("aaa"), value("Aaa")])));

        assert( exec(condition("betweenSymmetric", [value(100),value(100), value(200)])));
        assert(!exec(condition("betweenSymmetric", [value(90),value(100), value(200)])));
        assert( exec(condition("betweenSymmetric", [value(100),value(200), value(100)])));
        assert(!exec(condition("betweenSymmetric", [value(90),value(200), value(100)])));

        assert( exec(condition("lessThan", [value(100), value(110)])));
        assert(!exec(condition("lessThan", [value(100), value(100)])));
        assert(!exec(condition("lessThan", [value(100), value(90)])));

        assert( exec(condition("equalIgnoreCase", [value("aaa"), value("Aaa")])));
        assert(!exec(condition("equalIgnoreCase", [value("aaa"), value("Baa")])));
        assert(!exec(condition("equalIgnoreCase", [value("aaa"), value(null, "String")])));

        assert.throws(() => exec(condition("isDistinctFrom", [])), /isDistinctFrom is not supported in Javascript evaluation/);

        assert( exec(condition("between", [value(100),value(100), value(200)])));
        assert(!exec(condition("between", [value(90),value(100), value(200)])));

        assert( exec(condition("ge", [value(120), value(110)])));
        assert( exec(condition("ge", [value(100), value(100)])));
        assert(!exec(condition("ge", [value(80), value(90)])));

        assert( exec(condition("greaterThan", [value(120), value(110)])));
        assert(!exec(condition("greaterThan", [value(100), value(100)])));
        assert(!exec(condition("greaterThan", [value(80), value(90)])));

        assert( exec(condition("isNotNull", [value("aaa")])));
        assert(!exec(condition("isNotNull", [value(null, "String")])));

        assert( exec(condition("notLikeRegex", [value("aaa"), value("a+bc")])));
        assert(!exec(condition("notLikeRegex", [value("aaabc"), value("a+bc")])));

        assert( exec(condition("notBetween", [value(90),value(100), value(200)])));
        assert(!exec(condition("notBetween", [value(100),value(100), value(200)])));

        assert( exec(condition("notEqual", [value("aaa"), value("Aaa")])));
        assert( exec(condition("notEqual", [value("aaa"), value("bbb")])));
        assert(!exec(condition("notEqual", [value("aaa"), value("aaa")])));

        assert( exec(condition("isFalse", [value(false)])));
        assert(!exec(condition("isFalse", [value(true)])));

        assert( exec(condition("containsIgnoreCase", [value("FLABCAR"), value("abc")])));
        assert(!exec(condition("containsIgnoreCase", [value("FLUBCAR"), value("abc")])));

        assert(!exec(condition("eq", [value("aaa"), value("Aaa")])));
        assert(!exec(condition("eq", [value("aaa"), value("bbb")])));
        assert( exec(condition("eq", [value("aaa"), value("aaa")])));

        assert( exec(condition("gt", [value(120), value(110)])));
        assert(!exec(condition("gt", [value(100), value(100)])));
        assert(!exec(condition("gt", [value(80), value(90)])));

        assert(!exec(condition("equal", [value("aaa"), value("Aaa")])));
        assert(!exec(condition("equal", [value("aaa"), value("bbb")])));
        assert( exec(condition("equal", [value("aaa"), value("aaa")])));

        assert( exec(condition("likeRegex", [value("aaabc"), value("a+bc")])));
        assert(!exec(condition("likeRegex", [value("aaa"), value("a+bc")])));

        assert( exec(condition("likeRegex", [value("aaabc"), field("regex")])));
        assert(!exec(condition("likeRegex", [value("aaa"), field("regex")])));

        assert( exec(condition("isTrue", [value(true)])));
        assert(!exec(condition("isTrue", [value(false)])));

        assert( exec(condition("contains", [value("abcd"), value("bc")])));
        assert(!exec(condition("contains", [value("abcd"), value("be")])));


        assert(!exec(condition("notContainsIgnoreCase", [value("FLABCAR"), value("abc")])));
        assert( exec(condition("notContainsIgnoreCase", [value("FLUBCAR"), value("abc")])));


        assert(!exec(condition("notContains", [value("abcd"), value("bc")])));
        assert( exec(condition("notContains", [value("abcd"), value("be")])));

        assert( exec(condition("ne", [value("aaa"), value("Aaa")])));
        assert( exec(condition("ne", [value("aaa"), value("bbb")])));
        assert(!exec(condition("ne", [value("aaa"), value("aaa")])));

        assert( exec(condition("isNull", [value(null, "String")])));
        assert(!exec(condition("isNull", [value(123)])));
        
        assert( exec(condition("endsWith", [value("abcd"), value("cd")])));
        assert(!exec(condition("endsWith", [value("abcd"), value("bc")])));

        assert( exec(condition("le", [value(100), value(110)])));
        assert( exec(condition("le", [value(100), value(100)])));
        assert(!exec(condition("le", [value(100), value(90)])));

        assert.throws(() => exec(condition("isNotDistinctFrom")), /isNotDistinctFrom is not supported in Javascript evaluation/);

        assert( exec(condition("startsWith", [value("abcd"), value("ab")])));
        assert(!exec(condition("startsWith", [value("abcd"), value("bc")])));
        assert( exec(condition("in", [value("ab"), values("String", "ab","bc","cd")])));
        assert( exec(condition("in", [value("cd"), values("String", "ab","bc","cd")])));
        assert(!exec(condition("in", [value("ef"), values("String", "ab","bc","cd")])));

        /// OPERATIONS

        assert(exec(operation("bitNand", [value(-1), value(2)])) === -3);
        assert(exec(operation("mod", [value(100), value(3)])) === 1);
        assert(exec(operation("div", [value(1200), value(10)])) === 120);
        assert(exec(operation("neg", [value(100)])) === -100);
        assert(exec(operation("rem", [value(13), value(7)])) === 6);

        assert(exec(operation("add", [value(10), value(123)])) === 133);
        assert(exec(operation("subtract", [value(2321), value(72)])) === 2249);
        assert(exec(operation("plus", [value(92), value(7)])) === 99);
        assert(exec(operation("bitAnd", [value(-2), value(7)])) === 6);
        assert(exec(operation("bitXor", [value(0xff), value(0xaa)])) === 0x55);
        assert(exec(operation("shl", [value(2), value(3)])) === 16);
        assert(exec(operation("unaryMinus", [value(-133)])) === 133);
        assert(exec(operation("bitNor", [value(1), value(4)])) === -6);
        assert(exec(operation("shr", [value(128), value(2)])) === 32);
        assert(exec(operation("modulo", [value(10), value(3)])) === 1);
        assert(exec(operation("bitXNor", [value(111), value(222)])) === -178);
        assert(exec(operation("bitNot", [value(0xaaaa)])) === -43691);
        assert(exec(operation("sub", [value(101), value(23)])) === 78);
        assert(exec(operation("minus", [value(11), value(7)])) === 4);
        assert(exec(operation("mul", [value(5), value(7)])) === 35);
        assert(exec(operation("bitOr", [value(129), value(7)])) === 135);
        assert(exec(operation("times", [value(10), value(11)])) === 110);
        assert(exec(operation("pow", [value(2), value(0.5)])) === 1.4142135623730951);
        assert(exec(operation("divide", [value(120), value(4)])) === 30);
        assert(exec(operation("power", [value(2), value(3)])) === 8);
        assert(exec(operation("multiply", [value(23), value(10)])) === 230);
        assert(exec(operation("unaryPlus", [value(10)])) === 10);
        assert(exec(operation("unaryPlus", [value("121")])) === 121);
        assert.throws(() =>  exec(operation("asc", [])), /asc is not supported in Javascript evaluation/);
        assert.throws(() => exec(operation("desc", [])), /desc is not supported in Javascript evaluation/);

        assert(exec(operation("lower", [value("ÄBC")])) === "äbc");
        assert(exec(operation("upper", [value("äbc")])) === "ÄBC");

        assert( exec(operation("toString", [value(123)])) === "123");

        assert( exec(operation("concat", [value("aaa"), value(234)])) === "aaa234");
        assert( exec(operation("concat", [value(null, "String"), value("bbb")])) === "bbb");

        const nowFn = transform(now())
        const todayFn = transform(today())

        const nw = DateTime.now()
        return sleep(100)
            .then(
                () => {
                    const delta = nowFn().toMillis() - nw.toMillis()
                    assert(delta >= 100);
                    assert( +todayFn() === +DateTime.now().startOf("day") );
                }
            )


    });

    it("resolves fields references at runtime", () => {
        const objects = [
            {
                name: "Test Foo #123",
                num: 938,
                flag: false
            },
            {
                name: "Test Foo #4812",
                num: 111,
                flag: true
            },
            {
                name: "Test Foo #9473",
                num: 222,
                flag: false
            }
        ];

        const resolver = new FieldResolver();

        const condition = or(
            field("name").eq(value("Test Foo #123")),
            field("num").eq(value(222))
        );

        // XXX: this test ensures that the evaluation order is right. field references must not be evaluated during the
        //      translation phase (current is set to null initially)

        // preparation
        const fn = filterTransformer(
            condition,
            resolver.resolve
        );

        // XXX: now that the filter is transformed, we provide the current obj reference for our resolver and
        //      everything is peachy

        // runtime
        const filtered = objects.filter( obj => {
            resolver.current = obj;
            return fn();
        })

        assert(filtered.length === 2)
        assert(filtered[0].num === 938)
        assert(filtered[1].name === "Test Foo #9473")

    })
});
