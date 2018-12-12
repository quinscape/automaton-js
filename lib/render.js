"use strict";

Object.defineProperty(exports, "__esModule", {
    value: true
});
exports.default = render;

var _react = require("react");

var _react2 = _interopRequireDefault(_react);

var _reactDom = require("react-dom");

var _reactDom2 = _interopRequireDefault(_reactDom);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

/**
 * Renders the given React element and returns a promise that resolves when the rendering is done.
 *
 * @param {React.Element} elem      element to render
 * @param {String} [targetId]       Id attribute of the element to render into (default is our "root" element)
 * 
 * @return {Promise<>}  promise that resolves after the element has rendered. Exceptions happening during the ReactDOM.render call will cause a rejection of the promise.
 */
function render(elem) {
    var targetId = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : "root";


    if (!_react2.default.isValidElement(elem)) {
        throw new Error("Not a valid react element: " + elem);
    }

    return new Promise(function (resolve, reject) {
        try {
            _reactDom2.default.render(elem, document.getElementById(targetId), resolve);
        } catch (e) {
            reject(e);
        }
    });
}
//# sourceMappingURL=render.js.map