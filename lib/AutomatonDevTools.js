"use strict";

Object.defineProperty(exports, "__esModule", {
    value: true
});

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

    var DevTools = devToolsModule.default;


    AutomatonDevTools = (0, _withAutomatonEnv2.default)(function (_React$Component2) {
        _inherits(_class, _React$Component2);

        function _class() {
            _classCallCheck(this, _class);

            return _possibleConstructorReturn(this, (_class.__proto__ || Object.getPrototypeOf(_class)).apply(this, arguments));
        }

        _createClass(_class, [{
            key: "render",
            value: function render() {
                if (process.env.NODE_ENV === "production") {
                    return false;
                }

                return _react2.default.createElement(DevTools, null);
            }
        }]);

        return _class;
    }(_react2.default.Component));
}

exports.default = AutomatonDevTools;
//# sourceMappingURL=AutomatonDevTools.js.map