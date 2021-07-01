import { before, describe, it } from "mocha"
import config from "../../src/config";
import { findField } from "../../src/ui/iqed/EditorState";
import { InputSchema } from "domainql-form";

import rawSchema from "./search-schema.json";


function dump(value)
{
    console.log(JSON.stringify(value, null, 4));
    return value;
}



describe("IQueryEditor: field search", function () {

    beforeEach(
        () => {
            config.inputSchema = new InputSchema(rawSchema);
        }
    )


    it("searches deep", function () {


        const fields = findField("ABst", "name")

        console.log(fields.length);
        //console.log(fields.map(e => e.path).join("\n"));

    })
});
