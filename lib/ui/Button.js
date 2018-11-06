"use strict";

Object.defineProperty(exports, "__esModule", {
    value: true
});

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _react = require("react");

var _react2 = _interopRequireDefault(_react);

var _withAutomatonEnv = require("../withAutomatonEnv");

var _withAutomatonEnv2 = _interopRequireDefault(_withAutomatonEnv);

var _propTypes = require("prop-types");

var _propTypes2 = _interopRequireDefault(_propTypes);

var _Icon = require("./Icon");

var _Icon2 = _interopRequireDefault(_Icon);

var _classnames = require("classnames");

var _classnames2 = _interopRequireDefault(_classnames);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

var Button = function (_React$Component) {
    _inherits(Button, _React$Component);

    function Button() {
        var _ref;

        var _temp, _this, _ret;

        _classCallCheck(this, Button);

        for (var _len = arguments.length, args = Array(_len), _key = 0; _key < _len; _key++) {
            args[_key] = arguments[_key];
        }

        return _ret = (_temp = (_this = _possibleConstructorReturn(this, (_ref = Button.__proto__ || Object.getPrototypeOf(Button)).call.apply(_ref, [this].concat(args))), _this), _this.onClick = function (ev) {
            var _this$props = _this.props,
                action = _this$props.action,
                transition = _this$props.transition,
                context = _this$props.context,
                env = _this$props.env;


            if (typeof action === "function") {
                action(context);
            } else {
                var process = env.process;

                process.transition(transition, context);
            }
        }, _temp), _possibleConstructorReturn(_this, _ret);
    }

    _createClass(Button, [{
        key: "render",
        value: function render() {
            var _props = this.props,
                className = _props.className,
                name = _props.name,
                icon = _props.icon,
                text = _props.text;


            return _react2.default.createElement(
                "button",
                {
                    type: "button",
                    name: name,
                    className: className,
                    onClick: this.onClick
                },
                icon && _react2.default.createElement(_Icon2.default, {
                    className: (0, _classnames2.default)(icon, "pr-1")
                }),
                text
            );
        }
    }]);

    return Button;
}(_react2.default.Component);

Button.propTypes = {
    action: _propTypes2.default.func,
    transition: _propTypes2.default.string,
    className: _propTypes2.default.string,
    icon: _propTypes2.default.string,
    text: _propTypes2.default.string
};
Button.defaultProps = {
    className: "btn btn-secondary",
    text: ""
};
exports.default = (0, _withAutomatonEnv2.default)(Button);