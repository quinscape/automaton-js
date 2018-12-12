"use strict";

Object.defineProperty(exports, "__esModule", {
    value: true
});

var _extends = Object.assign || function (target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i]; for (var key in source) { if (Object.prototype.hasOwnProperty.call(source, key)) { target[key] = source[key]; } } } return target; };

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var secret = Symbol("AuthSecret");

function mapRoles(roles) {
    var rolesMap = {};
    for (var i = 0; i < roles.length; i++) {
        rolesMap[roles[i]] = true;
    }
    return rolesMap;
}

var Authentication = function () {
    function Authentication(data) {
        _classCallCheck(this, Authentication);

        this[secret] = _extends({}, data, {
            roles: mapRoles(data.roles)
        });
    }

    _createClass(Authentication, [{
        key: "hasRole",


        /**
         * Returns true if the user has any of the given roles.
         *
         * @param {... String} roles    roles
         * @return {boolean}
         */
        value: function hasRole() {
            for (var _len = arguments.length, roles = Array(_len), _key = 0; _key < _len; _key++) {
                roles[_key] = arguments[_key];
            }

            for (var i = 0; i < roles.length; i++) {
                if (this[secret].roles.hasOwnProperty(roles[i])) {
                    return true;
                }
            }
            return false;
        }
    }, {
        key: "login",
        get: function get() {
            return this[secret].login;
        }
    }, {
        key: "id",
        get: function get() {
            return this[secret].id;
        }
    }]);

    return Authentication;
}();

exports.default = Authentication;
//# sourceMappingURL=auth.js.map