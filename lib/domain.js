"use strict";

Object.defineProperty(exports, "__esModule", {
    value: true
});
exports.loadDomainDefinitions = loadDomainDefinitions;
exports.getWireFormat = getWireFormat;

var _domainqlForm = require("domainql-form");

var _config = require("./config");

var _config2 = _interopRequireDefault(_config);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var domainClasses = {};

var wireFormat = void 0;

var DOMAIN_REGEX = /^\.\/domain\/(.*?)\.js$/;

function loadDomainDefinitions(ctx) {
    var keys = ctx.keys();

    //console.log("Modules: ", keys);

    for (var i = 0; i < keys.length; i++) {
        var moduleName = keys[i];

        var m = DOMAIN_REGEX.exec(moduleName);
        if (m) {
            domainClasses[m[1]] = ctx(moduleName).default;
        }
    }

    console.log("DOMAIN-CLASSES", domainClasses);

    wireFormat = new _domainqlForm.WireFormat(_config2.default.inputSchema, domainClasses);
}

function getWireFormat() {
    return wireFormat;
}
//# sourceMappingURL=domain.js.map