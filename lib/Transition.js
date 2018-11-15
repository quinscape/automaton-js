"use strict";

Object.defineProperty(exports, "__esModule", {
    value: true
});

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var secret = Symbol("TransitionSecret");

/**
 * Encapsulates a runtime transition within a process.
 */

var Transition = function () {
    function Transition(process, source, target, context) {
        _classCallCheck(this, Transition);

        this[secret] = {
            process: process,
            source: source,
            target: target,
            context: context,
            isCanceled: false
        };
    }

    /**
     * Process this transition happens in.
     *
     * @return {*}
     */


    _createClass(Transition, [{
        key: "cancel",


        /**
         * Cancels the transition and reverts the process scope changes.
         *
         */
        value: function cancel() {
            this[secret].isCanceled = true;
            this[secret].target = null;
        }
    }, {
        key: "process",
        get: function get() {
            return this[secret].process;
        }

        /**
         * Context object. Can be set by calling t.selectTargetObject().
         * @return {*}
         */

    }, {
        key: "context",
        get: function get() {
            return this[secret].context;
        },
        set: function set(value) {
            this[secret].context = value;
        }

        /**
         * Returns true if the transition has been canceled.
         *
         * @return {boolean}
         */

    }, {
        key: "isCanceled",
        get: function get() {
            return this[secret].isCanceled;
        }

        /**
         * Source state
         *
         * @return {String}
         */

    }, {
        key: "source",
        get: function get() {
            return this[secret].source;
        }

        /**
         * Returns the current target state
         *
         * @return {String}
         */

    }, {
        key: "target",
        get: function get() {
            return this[secret].target;
        }

        /**
         * Sets the current target state
         * @param name
         */
        ,
        set: function set(name) {
            var access = this[secret];

            var process = access.process;


            console.log("Process of transition", process);

            if (!process.states[name]) {
                throw new Error("'" + name + "' is no valid target state in process '" + process.name + "'");
            }

            access.target = name;
        }
    }]);

    return Transition;
}();

exports.default = Transition;
//# sourceMappingURL=Transition.js.map