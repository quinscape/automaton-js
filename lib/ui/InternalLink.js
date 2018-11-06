"use strict";

Object.defineProperty(exports, "__esModule", {
    value: true
});

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _react = require("react");

var _react2 = _interopRequireDefault(_react);

var _classnames = require("classnames");

var _classnames2 = _interopRequireDefault(_classnames);

var _config = require("../config");

var _config2 = _interopRequireDefault(_config);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

var InternalLink = function (_React$Component) {
    _inherits(InternalLink, _React$Component);

    function InternalLink() {
        var _ref;

        var _temp, _this, _ret;

        _classCallCheck(this, InternalLink);

        for (var _len = arguments.length, args = Array(_len), _key = 0; _key < _len; _key++) {
            args[_key] = arguments[_key];
        }

        return _ret = (_temp = (_this = _possibleConstructorReturn(this, (_ref = InternalLink.__proto__ || Object.getPrototypeOf(InternalLink)).call.apply(_ref, [this].concat(args))), _this), _this.onClick = function (ev) {
            var uri = _this.props.uri;
            var appName = _config2.default.appName,
                contextPath = _config2.default.contextPath;


            if (contextPath && uri.indexOf(contextPath) !== 0) {
                // if we have a context path, we only intercept when the link starts with the context path.
                return;
            }

            var baseSegment = contextPath + "/" + appName;
            if (uri.indexOf(baseSegment) !== 0) {
                // we don't intercept if the link goes to another end-point
                return;
            }

            ev.preventDefault();
        }, _temp), _possibleConstructorReturn(_this, _ret);
    }

    _createClass(InternalLink, [{
        key: "render",
        value: function render() {
            var _props = this.props,
                uri = _props.uri,
                className = _props.className,
                children = _props.children;


            return _react2.default.createElement(
                "a",
                {
                    className: (0, _classnames2.default)("link-internal", className),
                    href: uri,
                    onClick: this.onClick
                },
                children
            );
        }
    }]);

    return InternalLink;
}(_react2.default.Component);

exports.default = InternalLink;
//# sourceMappingURL=InternalLink.js.map