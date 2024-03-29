import "raf/polyfill"
import { configure } from "mobx"
/*
 * Some environment patching for "jsdom-global/register"
 */
require("jsdom-global/register");

configure({
    enforceActions: "observed"
});


// Allow Date to be accessed by window.Date for "wait-for-expect"
window.Date = global.Date;

global.__DEV = true;
global.__PROD = false;


global.document.createRange = () => ({
    setStart: () => {},
    setEnd: () => {},
    commonAncestorContainer: {
        nodeName: 'BODY',
        ownerDocument: document,
    },
});

