"use strict";

Object.defineProperty(exports, "__esModule", {
    value: true
});
exports.deleteDomainObject = deleteDomainObject;
exports.storeDomainObject = storeDomainObject;

var _GraphQLQuery = require("./GraphQLQuery");

var _GraphQLQuery2 = _interopRequireDefault(_GraphQLQuery);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

// language=GraphQL
var DeleteQuery = new _GraphQLQuery2.default("\n    mutation deleteDomainObject($type: String!, $id: String!){\n        deleteDomainObject( type: $type, id: $id)\n    }");

// language=GraphQL
// language=GraphQL
var StoreQuery = new _GraphQLQuery2.default("\n    mutation storeDomainObject($domainObject: DomainObject!){\n        storeDomainObject(domainObject: $domainObject)\n    }");

/**
 * Deletes the given domain object with the given id.
 *
 * @param {String} type     domain type name
 * @param {String} id       id field
 *
 * @return {Promise<Boolean, Array>} resolves to a boolean that is true when exactly one row was deleted from the table.
 *                                   Rejects if the domain object couldn't be deleted -- either because it is still referenced
 *                                   or because the table has no id field.
 */
function deleteDomainObject(type, id) {
    return DeleteQuery.execute({
        type: type,
        id: id
    });
}

function storeDomainObject(domainObject) {
    return StoreQuery.execute({
        domainObject: domainObject
    });
}
//# sourceMappingURL=standard-queries.js.map