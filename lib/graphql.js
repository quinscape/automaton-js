"use strict";

Object.defineProperty(exports, "__esModule", {
    value: true
});
exports.defaultErrorHandler = defaultErrorHandler;
exports.formatGraphQLError = formatGraphQLError;
exports.default = graphql;

var _config = require("./config");

var _config2 = _interopRequireDefault(_config);

var _domain = require("./domain");

var _GraphQLQuery = require("./GraphQLQuery");

var _GraphQLQuery2 = _interopRequireDefault(_GraphQLQuery);

var _Process = require("./Process");

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }

/**
 * Logs graphql errors
 * @param errors
 */
function defaultErrorHandler(errors) {
    console.error("GraphQL Request failed");
    console.table(errors);
}

function convertInput(varTypes, variables) {
    if (!variables) {
        return;
    }

    var wireFormat = (0, _domain.getWireFormat)();

    var out = {};

    for (var name in variables) {
        if (variables.hasOwnProperty(name)) {
            var value = variables[name];
            var varType = varTypes[name];
            if (!varType) {
                throw new Error("Cannot convert invalid variable '" + name + "'");
            }

            out[name] = wireFormat.convert(varType, value, false);
        }
    }

    return out;
}

function formatGraphQLError(query, errors) {
    return "\n" + query + "\n\n" + errors.map(function (e) {
        return e.message + (e.path ? "\nPath: " + e.path.join(".") : "") + " " + (e.locations ? e.locations.map(function (l) {
            return "line " + l.line + ", " + l.column;
        }).join(", ") : "") + "\n";
    });
}

/**
 * GraphQL query service
 *
 * @param {Object} params                   Parameters
 * @param {String} params.query             query string
 * @param {Object} [params.variables]       query variables
 * @param {Object} [params.autoConvert]     if false, don't convert input ( default is true)
 *
 * @returns {Promise<any>} Promise resolving to query data
 */
function graphql(params) {

    //console.log("QUERY: ", params);

    var csrfToken = _config2.default.csrfToken,
        contextPath = _config2.default.contextPath;


    var queryDecl = void 0;
    if (params.query instanceof _GraphQLQuery2.default) {
        queryDecl = params.query;
    } else {
        console.log("NEW QUERY DECL");

        queryDecl = new _GraphQLQuery2.default(params.query);
    }

    var autoConvert = params.autoConvert !== false;

    var variables = params.variables;

    if (autoConvert) {
        variables = convertInput(queryDecl.getVars(), variables);
    }

    return fetch(window.location.origin + contextPath + "/graphql", {
        method: "POST",
        credentials: "same-origin",
        headers: _defineProperty({
            "Content-Type": "application/json"

        }, csrfToken.header, csrfToken.value),
        body: JSON.stringify({
            query: queryDecl.query,
            variables: variables
        })
    }).then(function (response) {
        return response.json();
    }).then(function (_ref) {
        var data = _ref.data,
            errors = _ref.errors;

        if (errors) {
            var err = new Error(formatGraphQLError(queryDecl.query, errors));

            return Promise.reject(err);
        }

        if (autoConvert) {
            for (var methodName in data) {
                if (data.hasOwnProperty(methodName)) {
                    var typeRef = (0, _Process.getGraphQLMethodType)(methodName);

                    //console.log("AUTO-CONVERT", methodName, "type = ", typeRef);

                    data[methodName] = (0, _domain.getWireFormat)().convert(typeRef, data[methodName], true);

                    //console.log("converted", data[methodName]);
                }
            }
        }

        return data;
    });
}
//# sourceMappingURL=graphql.js.map