import i18n from "../i18n"
import config from "../config"


let ws = null;

let connectionId = null;

let messageCount = 0;

let notifiedAboutSessionLoss = false;

const REQUEST_TIMEOUT = 30000;
const NOT_REGISTERED = 4100;


function createWebSocket(cid, resolve, reject)
{
    const origin = location.origin.replace(/^http/, "ws");
    const pathname = `/${config.contextPath}/automaton-ws`.replace(/\/\//g, "/");
    const search = `?cid=${cid}`;

    const url = `${origin}${pathname}${search}`;
    const webSocket = new WebSocket(url);

    webSocket.onopen = function () {
        //console.log("ws.onopen");

        //start = new Date().getTime();
        console.log(`Connection ${cid} ready`);

        resolve(cid);
    };
    webSocket.onclose = function (ev) {

        if (ev && ev.code === NOT_REGISTERED)
        {
            if (!notifiedAboutSessionLoss)
            {
                notifiedAboutSessionLoss = true;
                alert(
                    i18n("Server Restarted. Please Reload")
                );
            }
            return;
        }

        setTimeout(
            () => {
                ws = createWebSocket(cid, resolve, reject);
            },
            2000
        );
    };
    webSocket.onerror = function (err) {
        //console.log("ws.onerror");
        webSocket.onclose(null);
        reject(err);
    };
    webSocket.onmessage = ev => {
        //console.log("ws.onMessage", ev);
        const data = JSON.parse(ev.data);

        //console.debug("RECEIVE: %o", data);

        const array = handlers[data.type];
        if (!array)
        {
            console.warn("unhandled message: ", data);
        }
        else
        {
            try
            {
                array.forEach(handler => handler(data.payload));
            }
            catch (ex)
            {
                console.error("Error in Hub event handler", ex);
            }
        }
    };

    return webSocket;
}

function prepare(type, payload)
{
    const messageId = ++messageCount;

    return {
        connectionId,
        messageId,
        type,
        payload
    };
}

const handlers = {};

const promises = {};

function lookupPromiseArray(key)
{
    if (!key)
    {
        return null;
    }

    const promiseArray = promises[key];
    if (promiseArray)
    {
        window.clearTimeout(promiseArray[2]);
        delete promises[key];
    }
    return promiseArray;
}


/**
 * Low-level websocket handler for automaton.
 *
 * Before you use this, make sure you actually want to and not the more convenient pubsub implemented on top of this.
 *
 * @category websocket
 *
 */
const Hub = {
    /**
     * Registers a handler for the given message type.
     *
     * @param {String} type     message type
     * @param {function} fn     callback that will receive the message payload
     * 
     * @return {function(): void} unregister function
     */
    register:
        function (type, fn) {
            //console.log("Hub.register(", type, fn, ")");

            let array = handlers[type];
            if (!array)
            {
                handlers[type] = array = [];
            }

            array.push(fn);

            return () => {
                handlers[type] = handlers[type].filter( f => f !== fn);
            }
        },
    /**
     * Sends a message via websocket.
     *
     * @param {String} type         message type
     * @param {object} payload      message payload
     *
     * @return {number} message id
     */
    send:
        function (type, payload) {

            const message = prepare(type, payload);

            //console.debug("send: ", message);

            const json = JSON.stringify(message);
            ws.send(json);

            return message.messageId;
        },

    /**
     * Initiate a request/response over websocket.
     *
     * The server has to react to the message received by sending a Response message referencing the message id of the
     * message.
     *
     * @see de.quinscape.automaton.runtime.ws.DefaultAutomatonClientConnection.respond
     *
     * @param {String} type     message type
     * @param payload           message payload
     *
     * @return {Promise<unknown>}
     */
    request:
        function (type, payload) {
            return new Promise((resolve, reject) => {

                //console.log("REQUEST", type, payload);

                const messageId = this.send(type, payload, true);
                const timerId = window.setTimeout(() => {

                    // promise still active?
                    const promiseArray = promises[messageId];
                    if (promiseArray)
                    {
                        promiseArray[1](new Error("Timeout"));
                    }

                    delete promises[messageId];

                }, REQUEST_TIMEOUT);

                promises[messageId] = [resolve, reject, timerId];
            });
        },
    /**
     * Initializes the Hub with the prepared connection id for the client.
     *
     * @param {String} cid      connection id
     *
     * @return {Promise<String>} resolves with the connection id after the websocket connection is established.
     */
    init:
        function (cid) {
            connectionId = cid;

            this.promise = new Promise(function (resolve, reject) {

                ws = createWebSocket(cid, resolve, reject);
                return cid;
            });

            return this.promise;
        },

    /**
     * Returns the current connection id.
     *
     * @return {String} connection id
     */
    getConnectionId: function ()
    {
        return connectionId;
    }
};

Hub.register("ERROR", function (data) {
    console.error("ERROR: %s", data);
});

Hub.register("RESPONSE", function (reply) {
    //console.log("RESPONSE", reply);

    const promiseArray = lookupPromiseArray(reply.responseTo);
    const { payload } = reply;
    if (promiseArray)
    {
        const [ resolve, reject ] = promiseArray;

        if (reply.error)
        {
            reject(new Error("ERROR REPLY: " + JSON.stringify(reply.error)));
        }
        else
        {
            //console.log("REPLY", payload);
            resolve(payload);
        }
    }
    else
    {
        console.warn("received unsolicited reply: %o", reply);
    }
});

export default Hub;
