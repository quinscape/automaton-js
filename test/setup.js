/*
 * Some environment patching for "jsdom-global/register"
 */
require("jsdom-global/register");

const mobx = require("mobx");

mobx.configure({
    enforceActions: "observed"
});


// Allow Date to be accessed by window.Date for "wait-for-expect"
window.Date = global.Date;

global.__DEV = true;
global.__PROD = false;

global.requestAnimationFrame = setImmediate;
global.cancelAnimationFrame = () => 0;

global.document.createRange = () => ({
    setStart: () => {},
    setEnd: () => {},
    commonAncestorContainer: {
        nodeName: 'BODY',
        ownerDocument: document,
    },
});

