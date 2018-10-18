"use strict";

Object.defineProperty(exports, "__esModule", {
    value: true
});

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _react = require("react");

var _react2 = _interopRequireDefault(_react);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

var Column = function (_React$Component) {
    _inherits(Column, _React$Component);

    function Column() {
        _classCallCheck(this, Column);

        return _possibleConstructorReturn(this, (Column.__proto__ || Object.getPrototypeOf(Column)).apply(this, arguments));
    }

    _createClass(Column, [{
        key: "render",
        value: function render() {
            var _props = this.props,
                name = _props.name,
                context = _props.context,
                children = _props.children;


            if (typeof children === "function") {
                var result = children(context);

                console.log("FN-RESULT", result);

                return _react2.default.createElement(
                    "td",
                    null,
                    typeof result === "string" ? _react2.default.createElement(
                        "p",
                        {
                            className: "form-control-plaintext"
                        },
                        result
                    ) : result
                );
            }

            console.log("context[name] = ", context[name]);

            return _react2.default.createElement(
                "td",
                null,
                _react2.default.createElement(
                    "p",
                    {
                        className: "form-control-plaintext"
                    },
                    context[name]
                )
            );
        }
    }]);

    return Column;
}(_react2.default.Component);

/**
 * Data grid what works based on degenerified Paged<DomainObject> types.
 */


var DataGrid = function (_React$Component2) {
    _inherits(DataGrid, _React$Component2);

    function DataGrid() {
        _classCallCheck(this, DataGrid);

        return _possibleConstructorReturn(this, (DataGrid.__proto__ || Object.getPrototypeOf(DataGrid)).apply(this, arguments));
    }

    _createClass(DataGrid, [{
        key: "render",
        value: function render() {
            var _props2 = this.props,
                value = _props2.value,
                children = _props2.children;
            var rows = value.rows,
                rowCount = value.rowCount;


            return _react2.default.createElement(
                "table",
                { className: "table table-hover table-sm table-striped" },
                _react2.default.createElement(
                    "thead",
                    null,
                    _react2.default.createElement(
                        "tr",
                        null,
                        _react2.default.Children.map(children, function (col) {
                            return _react2.default.createElement(
                                "th",
                                null,
                                col.props.heading
                            );
                        })
                    )
                ),
                _react2.default.createElement(
                    "tbody",
                    null,
                    rows.map(function (context, idx) {
                        return _react2.default.createElement(
                            "tr",
                            { key: idx },
                            _react2.default.Children.map(children, function (col) {
                                return _react2.default.cloneElement(col, {
                                    context: context
                                });
                            })
                        );
                    })
                )
            );
        }
    }]);

    return DataGrid;
}(_react2.default.Component);

DataGrid.Column = Column;
exports.default = DataGrid;
//# sourceMappingURL=DataGrid.js.map