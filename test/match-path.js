import assert from "power-assert"
import matchPath from "../src/matchPath";


describe("matchPath", function () {

    it("matches model types based on relative path", function () {

        assert.deepEqual(
            matchPath("./processes/test/test.js"),
            {
                processName: "test",
                shortName: "test",
                isDomain: false,
                isState: false,
                isComposite: false,
                isQuery: false
            }
        );


        assert.deepEqual(
            matchPath("./processes/test/composites/Composite.js"),
            {
                processName: "test",
                shortName: "Composite",
                isDomain: false,
                isState: false,
                isComposite: true,
                isQuery: false

            }
        );

        assert.deepEqual(
            matchPath("./domain/Foo.js"),
            {
                processName: null,
                shortName: "Foo",
                isDomain: true,
                isState: false,
                isComposite: false,
                isQuery: false

            }
        );


        assert.deepEqual(
            matchPath("./scopes.js"),
            {
                processName: null,
                shortName: "scopes",
                isDomain: false,
                isState: false,
                isComposite: false,
                isQuery: false
            }
        );

        assert.deepEqual(
            matchPath("./processes/test/queries/Q_Test.js"),
            {
                processName: "test",
                shortName: "Q_Test",
                isDomain: false,
                isState: false,
                isComposite: false,
                isQuery: true
            }
        );

        assert.deepEqual(
            matchPath("./queries/Q_Test.js"),
            {
                processName: null,
                shortName: "Q_Test",
                isDomain: false,
                isState: false,
                isComposite: false,
                isQuery: true
            }
        );

        assert.deepEqual(
            matchPath("./processes/test/states/MyState.js"),
            {
                processName: "test",
                shortName: "MyState",
                isDomain: false,
                isState: true,
                isComposite: false,
                isQuery: false
            }
        );
    });
});
