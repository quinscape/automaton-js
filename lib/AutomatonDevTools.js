"use strict";

Object.defineProperty(exports, "__esModule", {
    value: true
});

var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; };

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _react = require("react");

var _react2 = _interopRequireDefault(_react);

var _classnames = require("classnames");

var _classnames2 = _interopRequireDefault(_classnames);

var _reactstrap = require("reactstrap");

var _mobx = require("mobx");

var _withAutomatonEnv = require("./withAutomatonEnv");

var _withAutomatonEnv2 = _interopRequireDefault(_withAutomatonEnv);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

var AutomatonDevTools = void 0;
if (process.env.NODE_ENV === "production") {
    // render as empty span
    AutomatonDevTools = "span";
} else {
    // noinspection JSUnusedLocalSymbols
    var DEV_TOOLS_CSS = require("../automaton-devtools.css");
    // optimization friendly late imports
    var devToolsModule = require("mobx-react-devtools");

    var JSONTree = require("react-json-tree").default;

    var ToolbarButton = function (_React$Component) {
        _inherits(ToolbarButton, _React$Component);

        function ToolbarButton() {
            _classCallCheck(this, ToolbarButton);

            return _possibleConstructorReturn(this, (ToolbarButton.__proto__ || Object.getPrototypeOf(ToolbarButton)).apply(this, arguments));
        }

        _createClass(ToolbarButton, [{
            key: "render",
            value: function render() {
                var _props = this.props,
                    active = _props.active,
                    onToggle = _props.onToggle,
                    className = _props.className;

                return _react2.default.createElement(
                    "button",
                    {
                        className: (0, _classnames2.default)("btn btn-sm pl-1 pt-1 pr-1 pb-0 mr-1", active && "active"),
                        onClick: onToggle,
                        role: "button",
                        "aria-pressed": active
                    },
                    _react2.default.createElement("i", { className: "fas " + className })
                );
            }
        }]);

        return ToolbarButton;
    }(_react2.default.Component);

    var DevTools = devToolsModule.default,
        GraphControl = devToolsModule.GraphControl,
        LogControl = devToolsModule.LogControl,
        UpdatesControl = devToolsModule.UpdatesControl;


    AutomatonDevTools = (0, _withAutomatonEnv2.default)(function (_React$Component2) {
        _inherits(_class2, _React$Component2);

        function _class2() {
            var _ref;

            var _temp, _this2, _ret;

            _classCallCheck(this, _class2);

            for (var _len = arguments.length, args = Array(_len), _key = 0; _key < _len; _key++) {
                args[_key] = arguments[_key];
            }

            return _ret = (_temp = (_this2 = _possibleConstructorReturn(this, (_ref = _class2.__proto__ || Object.getPrototypeOf(_class2)).call.apply(_ref, [this].concat(args))), _this2), _this2.state = {
                isOpen: false
            }, _this2.toggle = function () {
                return _this2.setState({ isOpen: !_this2.state.isOpen });
            }, _temp), _possibleConstructorReturn(_this2, _ret);
        }

        _createClass(_class2, [{
            key: "render",
            value: function render() {
                if (process.env.NODE_ENV === "production") {
                    return false;
                }

                var env = this.props.env;
                var isOpen = this.state.isOpen;


                return _react2.default.createElement(
                    _react2.default.Fragment,
                    null,
                    _react2.default.createElement(DevTools, { noPanel: true }),
                    _react2.default.createElement(
                        "div",
                        { className: "automaton-devtools p-0", style: { left: window.innerWidth * 0.93 | 0 } },
                        _react2.default.createElement(
                            GraphControl,
                            null,
                            _react2.default.createElement(ToolbarButton, { className: "fa-chart-bar" })
                        ),
                        _react2.default.createElement(
                            LogControl,
                            null,
                            _react2.default.createElement(ToolbarButton, { className: "fa-list-alt" })
                        ),
                        _react2.default.createElement(
                            UpdatesControl,
                            null,
                            _react2.default.createElement(ToolbarButton, { className: "fa-recycle" })
                        ),
                        _react2.default.createElement(ToolbarButton, { active: isOpen, className: "fa-font", onToggle: this.toggle })
                    ),
                    _react2.default.createElement(
                        _reactstrap.Modal,
                        {
                            isOpen: isOpen,
                            toggle: this.toggle,
                            backdrop: false,
                            modalTransition: { timeout: 100 }
                        },
                        _react2.default.createElement(
                            _reactstrap.ModalHeader,
                            null,
                            "Modal title"
                        ),
                        _react2.default.createElement(
                            _reactstrap.ModalBody,
                            null,
                            Object.keys(env).map(function (name) {
                                var value = env[name];

                                if ((0, _mobx.isObservable)(value)) {
                                    return _react2.default.createElement(
                                        _react2.default.Fragment,
                                        { key: name },
                                        _react2.default.createElement(
                                            "h6",
                                            null,
                                            name,
                                            " (observable)"
                                        ),
                                        _react2.default.createElement(JSONTree, { invertTheme: true, data: (0, _mobx.toJS)(value) })
                                    );
                                } else if (value && (typeof value === "undefined" ? "undefined" : _typeof(value)) === "object") {
                                    return _react2.default.createElement(
                                        _react2.default.Fragment,
                                        { key: name },
                                        _react2.default.createElement(
                                            "h6",
                                            null,
                                            name,
                                            " (observable)"
                                        ),
                                        _react2.default.createElement(JSONTree, { invertTheme: true, data: value })
                                    );
                                } else {
                                    return _react2.default.createElement(
                                        _react2.default.Fragment,
                                        { key: name },
                                        _react2.default.createElement(
                                            "h6",
                                            null,
                                            name,
                                            " (observable)"
                                        ),
                                        value
                                    );
                                }
                            })
                        )
                    )
                );
            }
        }]);

        return _class2;
    }(_react2.default.Component));
}

exports.default = AutomatonDevTools;

/* eslint react/no-multi-comp: 0, react/prop-types: 0 */

var ModalExample = function (_React$Component3) {
    _inherits(ModalExample, _React$Component3);

    function ModalExample(props) {
        _classCallCheck(this, ModalExample);

        var _this3 = _possibleConstructorReturn(this, (ModalExample.__proto__ || Object.getPrototypeOf(ModalExample)).call(this, props));

        _this3.state = {
            modal: false
        };

        _this3.toggle = _this3.toggle.bind(_this3);
        return _this3;
    }

    _createClass(ModalExample, [{
        key: "toggle",
        value: function toggle() {
            this.setState({
                modal: !this.state.modal
            });
        }
    }, {
        key: "render",
        value: function render() {
            var externalCloseBtn = _react2.default.createElement(
                "button",
                { className: "close", style: { position: "absolute", top: "15px", right: "15px" },
                    onClick: this.toggle },
                "\xD7"
            );
            return _react2.default.createElement(
                "div",
                null,
                _react2.default.createElement(
                    _reactstrap.Button,
                    { color: "danger", onClick: this.toggle },
                    this.props.buttonLabel
                )
            );
        }
    }]);

    return ModalExample;
}(_react2.default.Component);