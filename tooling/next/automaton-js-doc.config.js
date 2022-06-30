const Group = require("./service/Group")

module.exports = {

    // basePath for markdown links
    //basePath: "/test/automaton-js",

    // Forced doc types for cases where the naming and location rules aren't enough
    "groupOverrides": {
        "Hub": Group.UTIL,
        "Attachments": Group.UTIL,
        "FilterDSL": Group.UTIL,
        "config": Group.UTIL,
        "Process": Group.UTIL,
        "FieldResolver": Group.UTIL,
        "StartupRegistry": Group.UTIL,
        "InteractiveQuery": Group.UTIL
    },

    handwritten: [
        {
            src: "config.md"
        },

        { src: "documentation-introduction.md" },
        { src: "documentation-getting-started.md" },
        { src: "documentation-domain.md" },

        { src: "explanation-injection.md" },
        { src: "explanation-schema.md" },
        { src: "explanation-filter-dsl.md" },
        { src: "explanation-form-structure.md" },
        { src: "declarative-api.md" },

        { src: "howto-one.md" },

        {
            replace: "config",
            src: "config.md"
        },
        {
            replace: "FilterDSL.Type",
            src: "FilterDSL-Type.md"
        },
        {
            into: "GraphQLQuery",
            src: "GraphQLQuery.md"
        },
        {
            into: "DataGrid",
            src: "GridExamples.md"
        },
        // {
        //     after: "RowSelector",
        //     src: "RowSelectorExample.md"
        // },
        {
            into: "Tree",
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
