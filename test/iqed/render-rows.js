import { describe, it } from "mocha"
import assert from "power-assert"
import { EditorState, renderRows } from "../../src/ui/iqed/EditorState";


function dump(value)
{
    console.log(JSON.stringify(value, null, 4));
    return value;
}

describe("IQueryEditor: renderRows", function () {

    it("renders GraphQL fields", function () {

        const state = new EditorState();

        state.fields = new Set([
            "corgeLinks",
            "corgeLinks.assoc",
            "corgeLinks.assoc.name",
            "corgeLinks.assoc.num",
            "id",
            "name",
            "num",
            "owner",
            "owner.login"
        ]);

        const rows = state.graphQLFields;

        assert(rows ===
               "        corgeLinks {\n" +
               "            assoc {\n" +
               "                name\n" +
               "                num\n" +
               "            }\n" +
               "        }\n" +
               "        id\n" +
               "        name\n" +
               "        num\n" +
               "        owner {\n" +
               "            login\n" +
               "        }\n"
        )


    })
});
