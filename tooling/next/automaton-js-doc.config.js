const Group = require("./service/Group")

module.exports = {

    //basePath: "/test/automaton-js",

    // Forced doc types for cases where the naming and location rules aren't enough
    "groupOverrides": {
        "Hub": Group.UTIL,
        "Attachments": Group.UTIL,
        "config": Group.UTIL
    },

    handwritten: [
        {
            src: "config.md"
        },
        {
            replace: "config",
            src: "config-ref.md"
        },
        {
            into: "GraphQLQuery",
            src: "GraphQLQuery.md"
        },
        {
            after: "IQueryGrid",
            src: "GridExamples.md"
        },
        // {
        //     after: "RowSelector",
        //     src: "RowSelectorExample.md"
        // },
        {
            after: "Tree",
            src: "tree-navigation.md"
        },
        // {
        //     after: "Objects",
        //     src: "tree-objects.md"
        // },
        // {
        //     after: "IndexedObjects",
        //     src: "tree-indexed.md"
        // },
        // {
        //     after: "Folder",
        //     src: "tree-folder.md"
        // },
    ]
}
