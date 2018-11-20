"use strict";

Object.defineProperty(exports, "__esModule", {
    value: true
});

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _react = require("react");

var _react2 = _interopRequireDefault(_react);

var _i18n = require("./i18n");

var _i18n2 = _interopRequireDefault(_i18n);

var _reactstrap = require("reactstrap");

var _index = require("./index");

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

var Dialog = function (_React$Component) {
    _inherits(Dialog, _React$Component);

    function Dialog() {
        var _ref;

        var _temp, _this, _ret;

        _classCallCheck(this, Dialog);

        for (var _len = arguments.length, args = Array(_len), _key = 0; _key < _len; _key++) {
            args[_key] = arguments[_key];
        }

        return _ret = (_temp = (_this = _possibleConstructorReturn(this, (_ref = Dialog.__proto__ || Object.getPrototypeOf(Dialog)).call.apply(_ref, [this].concat(args))), _this), _this.close = function () {
            return _this.props.process.endSubProcess(null);
        }, _temp), _possibleConstructorReturn(_this, _ret);
    }

    _createClass(Dialog, [{
        key: "render",


        // componentDidCatch(error, info) {
        //     this.props.reject({ error, info });
        // }

        value: function render() {
            var _props = this.props,
                children = _props.children,
                process = _props.process,
                className = _props.className,
                bodyClass = _props.bodyClass;


            return _react2.default.createElement(
                _reactstrap.Modal,
                { isOpen: true, toggle: this.close, className: className, size: "lg" },
                _react2.default.createElement(
                    _reactstrap.ModalHeader,
                    {
                        toggle: this.close
                    },
                    (0, _i18n2.default)("Sub-Process {0}", process.name)
                ),
                _react2.default.createElement(
                    _reactstrap.ModalBody,
                    { className: bodyClass },
                    _react2.default.createElement(
                        _reactstrap.Container,
                        { fluid: true },
                        children
                    )
                )
            );
        }
    }]);

    return Dialog;
}(_react2.default.Component);

exports.default = Dialog;