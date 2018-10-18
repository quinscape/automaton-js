"use strict";

Object.defineProperty(exports, "__esModule", {
    value: true
});

var _extends = Object.assign || function (target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i]; for (var key in source) { if (Object.prototype.hasOwnProperty.call(source, key)) { target[key] = source[key]; } } } return target; };

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

exports.default = withScope;

var _react = require("react");

var _react2 = _interopRequireDefault(_react);

var _getDisplayName = require("./util/getDisplayName");

var _getDisplayName2 = _interopRequireDefault(_getDisplayName);

var _Process = require("./Process");

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

/**
 * High-order component to receive all standard enviroment contexts as props.
 *
 * This is not needed for process view component which receive those properties in any case.
 * 
 * @param Component
 * @return {React.Component} component with environment props
 */
function withScope(Component) {
    var _class, _temp;

    return _temp = _class = function (_React$Component) {
        _inherits(WithComponent, _React$Component);

        function WithComponent() {
            _classCallCheck(this, WithComponent);

            return _possibleConstructorReturn(this, (WithComponent.__proto__ || Object.getPrototypeOf(WithComponent)).apply(this, arguments));
        }

        _createClass(WithComponent, [{
            key: "render",
            value: function render() {
                var _this2 = this;

                return _react2.default.createElement(
                    _Process.AutomatonEnv.Consumer,
                    null,
                    function (env) {
                        return _react2.default.createElement(Component, _extends({}, _this2.props, {
                            env: env
                        }));
                    }
                );
            }
        }]);

        return WithComponent;
    }(_react2.default.Component), _class.displayName = "withScope(" + (0, _getDisplayName2.default)(Component) + ")", _temp;
}
//# sourceMappingURL=withEnv.js.map