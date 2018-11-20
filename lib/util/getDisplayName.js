"use strict";

Object.defineProperty(exports, "__esModule", {
       value: true
});

exports.default = function (WrappedComponent) {
       return WrappedComponent.displayName || WrappedComponent.name || "Component";
};