import fetchMock from "fetch-mock"
import assert from "power-assert"
import InputSchema from "domainql-form/lib/InputSchema";

import RAW_SCHEMA from "./schema.json";



describe.skip("graphql", function () {


    before(() => {
        fetchMock.mock('http://example.com', 200);

    })
    after(() => {
        fetchMock.restore();
    })

    it("performs GraphQL requests", function () {

        // TODO: write
    });

    it("auto-converts inputs/outputs", function () {

        // TODO: write
    });

    it("does type-based post-processing", function () {

        // TODO: write
    });
});
