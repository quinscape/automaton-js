"use strict";

Object.defineProperty(exports, "__esModule", {
    value: true
});

exports.default = function (inputSchema, query) {
    var vars = {};

    var document = (0, _parser.parse)(query);

    if (!document || document.kind !== _kinds.Kind.DOCUMENT) {
        throw new Error("Could not parse query: " + query + " => " + JSON.stringify(document));
    }

    var definitions = document.definitions;


    for (var i = 0; i < definitions.length; i++) {
        var definition = definitions[i];
        if (definition.kind === _kinds.Kind.OPERATION_DEFINITION) {
            var variableDefinitions = definition.variableDefinitions;


            for (var j = 0; j < variableDefinitions.length; j++) {
                var variableDefinition = variableDefinitions[j];

                var name = variableDefinition.variable.name.value;
                vars[name] = transformType(inputSchema, variableDefinition.type);
            }
        }
    }

    return vars;
};

var _parser = require("graphql/language/parser");

var _kinds = require("graphql/language/kinds");

var KIND_NON_NULL = "NON_NULL";
var KIND_OBJECT = "OBJECT";
var KIND_SCALAR = "SCALAR";
var KIND_LIST = "LIST";

function transformType(inputSchema, type) {
    if (type.kind === _kinds.Kind.NON_NULL_TYPE) {
        return {
            kind: KIND_NON_NULL,
            ofType: transformType(inputSchema, type.type)
        };
    } else if (type.kind === _kinds.Kind.NAMED_TYPE) {
        var name = type.name.value;

        var typeDef = inputSchema.getType(name);

        return {
            kind: typeDef.kind === KIND_SCALAR ? KIND_SCALAR : KIND_OBJECT,
            name: name
        };
    } else if (type.kind === _kinds.Kind.LIST_TYPE) {
        return {
            kind: KIND_LIST,
            ofType: transformType(inputSchema, type.type)
        };
    }

    throw new Error("Unhandled type: " + JSON.stringify(type));
}

/**
 * Parses the given query and returns a map with type references for the used variables.
 *
 * @param {InputSchema} inputSchema     input schema
 * @param {String} query                GraphQL query document
 *
 * @return {Object} object mapping variable names to type references.
 */
//# sourceMappingURL=parseQuery.js.map