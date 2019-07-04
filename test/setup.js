/*
 * Some environment patching for "jsdom-global/register"
 */
require("jsdom-global/register");

// Allow Date to be accessed by window.Date for "wait-for-expect"
window.Date = global.Date;

global.__DEV = true;
global.__PROD = false;
