"use strict";

Object.defineProperty(exports, "__esModule", {
    value: true
});

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _react = require("react");

var _react2 = _interopRequireDefault(_react);

var _classnames = require("classnames");

var _classnames2 = _interopRequireDefault(_classnames);

var _runProcess = require("../runProcess");

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

/**
 * Special automaton link that can do process changes within the current page context.
 *
 * You can use it like a normal link and if the URI patterns match, it will do its magic thing and otherwise
 * it will just be a link.
 */
var Link = function (_React$Component) {
    _inherits(Link, _React$Component);

    function Link() {
        var _ref;

        var _temp, _this, _ret;

        _classCallCheck(this, Link);

        for (var _len = arguments.length, args = Array(_len), _key = 0; _key < _len; _key++) {
            args[_key] = arguments[_key];
        }

        return _ret = (_temp = (_this = _possibleConstructorReturn(this, (_ref = Link.__proto__ || Object.getPrototypeOf(Link)).call.apply(_ref, [this].concat(args))), _this), _this.onClick = function (ev) {
            var href = _this.props.href;

            // we use the runProcessURI variant because we're starting out with a URI. (Not the runProcess variant that allows
            // process execution based on process name and processed input map).

            var promise = (0, _runProcess.runProcessURI)(href);
            if (!promise) {
                // wasn't a process URI, so we ignore it and let default handling handle it
                return;
            }

            // no default handling
            ev.preventDefault();
        }, _temp), _possibleConstructorReturn(_this, _ret);
    }

    _createClass(Link, [{
        key: "render",
        value: function render() {
            var _props = this.props,
                href = _props.href,
                title = _props.title,
                role = _props.role,
                className = _props.className,
                children = _props.children;


            return _react2.default.createElement(
                "a",
                {
                    className: (0, _classnames2.default)("link-internal", className),
                    href: href,
                    onClick: this.onClick,
                    title: title,
                    role: role
                },
                children
            );
        }
    }]);

    return Link;
}(_react2.default.Component);

exports.default = Link;