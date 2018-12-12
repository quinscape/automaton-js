"use strict";

Object.defineProperty(exports, "__esModule", {
    value: true
});

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _react = require("react");

var _react2 = _interopRequireDefault(_react);

var _withAutomatonEnv = require("../withAutomatonEnv");

var _withAutomatonEnv2 = _interopRequireDefault(_withAutomatonEnv);

var _domainqlForm = require("domainql-form");

var _propTypes = require("prop-types");

var _propTypes2 = _interopRequireDefault(_propTypes);

var _Icon = require("./Icon");

var _Icon2 = _interopRequireDefault(_Icon);

var _classnames = require("classnames");

var _classnames2 = _interopRequireDefault(_classnames);

var _mobxReact = require("mobx-react");

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
                contextFromProps = _this$props.context,
                env = _this$props.env,
                formConfig = _this$props.formConfig;

            // double check for safety

            if (_this.isDisabled()) {
                return;
            }

            //console.log("BUTTON-CLICK", { action, transition, context, env })

            if (typeof action === "function") {
                action(_this.getContext());
            } else {
                var entry = _this.getTransitionEntry();

                if (entry.discard) {
                    formConfig.root && formConfig.root.reset();
                } else {
                    var formInstance = formConfig.formInstance;

                    if (formInstance) {
                        formInstance.handleSubmit();
                    }
                }

                try {
                    var process = env.process;

                    //console.log("TRANSITION", transition, process);
                    // it's important to take context *after* we submit or reset it above

                    process.transition(transition, _this.getContext());
                } catch (e) {
                    console.error(e);
                }
            }
        }, _temp), _possibleConstructorReturn(_this, _ret);
    }

    _createClass(Button, [{
        key: "getContext",


        /**
         * Returns either the explicit context set as prop or the current form object model if present.
         *
         * @return {*} context
         */
        value: function getContext() {
            var _props = this.props,
                contextFromProps = _props.context,
                formConfig = _props.formConfig;
            // if no explicit context is set, use original form root (might be null)

            return contextFromProps !== undefined ? contextFromProps : formConfig.root && formConfig.root.model;
        }
    }, {
        key: "isDisabled",
        value: function isDisabled() {
            var _props2 = this.props,
                transition = _props2.transition,
                formConfig = _props2.formConfig,
                disabled = _props2.disabled;


            var isDisabled = false;

            if (typeof disabled === "function") {
                isDisabled = disabled(formConfig);
            }

            // if the `transition` prop is defined ..
            if (!isDisabled && transition) {
                var entry = this.getTransitionEntry();

                // .. and we're not discarding and we have errors, then disable button
                isDisabled = !entry.discard && formConfig.hasErrors();
            }

            return isDisabled;
        }
    }, {
        key: "getTransitionEntry",
        value: function getTransitionEntry() {
            var _props3 = this.props,
                env = _props3.env,
                transition = _props3.transition;

            var entry = env.process.getTransition(transition);
            if (!entry) {
                throw new Error("No transition '" + transition + "' in " + env.process.name + "/" + env.process.currentState);
            }
            return entry;
        }
    }, {
        key: "render",
        value: function render() {
            var _props4 = this.props,
                className = _props4.className,
                name = _props4.name,
                icon = _props4.icon,
                text = _props4.text;


            return _react2.default.createElement(
                "button",
                {
                    type: "button",
                    name: name,
                    className: className,
                    disabled: this.isDisabled(),
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
exports.default = (0, _withAutomatonEnv2.default)((0, _domainqlForm.withFormConfig)((0, _mobxReact.observer)(Button)));
//# sourceMappingURL=Button.js.map