"use strict";

Object.defineProperty(exports, "__esModule", {
    value: true
});
exports.default = undefined;

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _parseQuery = require("./parseQuery");

var _parseQuery2 = _interopRequireDefault(_parseQuery);

var _config = require("./config");

var _config2 = _interopRequireDefault(_config);

var _graphql = require("./graphql");

var _graphql2 = _interopRequireDefault(_graphql);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

/**
 * GraphQL query abstraction for both GraphQL queries and mutations.
 *
 * Can be used to parse application queries only once and then .execute() them.
 *
 * The graphql service will always create a new instance of GraphQLQuery on every request otherwise.
 *
 */
var GraphQLQuery = function () {
    function GraphQLQuery(query) {
        _classCallCheck(this, GraphQLQuery);

        this.query = query;
        this.vars = null;
    }

    _createClass(GraphQLQuery, [{
        key: "getVars",
        value: function getVars() {
            // lazily parse query on first usage.
            if (!this.vars) {
                this.vars = (0, _parseQuery2.default)(_config2.default.inputSchema, this.query);
            }
            return this.vars;
        }

        /**
         * Executes this GraphQL query/mutation with the given variables
         *
         * @param {object} [variables]    variables object map
         *
         * @return {Promise<*,*>}   Resolves with query/mutation result or rejects with a GraphQL error.
         */

    }, {
        key: "execute",
        value: function execute(variables) {
            return (0, _graphql2.default)({
                query: this,
                variables: variables
            });
        }
    }]);

    return GraphQLQuery;
}();

exports.default = GraphQLQuery;
//# sourceMappingURL=GraphQLQuery.js.map