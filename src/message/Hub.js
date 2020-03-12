import i18n from "../i18n"


let ws = null;

let connectionId = null;

let messageCount = 0;

let notifiedAboutSessionLoss = false;

const REQUEST_TIMEOUT = 30000;
const NOT_REGISTERED = 4100;


function createWebSocket(cid, resolve, reject)
{
    const url = "ws://" + location.hostname + ":8080/automaton-ws?cid="+ cid;
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
        webSocket.onclose();
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

const Hub = {
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
    send:
    // Send message to server over socket.
        function (type, payload, noLog = false) {

            if (!noLog)
            {
                //console.log("SEND", type, payload)
            }

            const message = prepare(type, payload);

            //console.debug("send: ", message);

            const json = JSON.stringify(message);
            ws.send(json);

            return message.messageId;
        },
    request:
    // Send message to server over socket.
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
    init:
        function (cid) {
            connectionId = cid;

            this.promise = new Promise(function (resolve, reject) {

                ws = createWebSocket(cid, resolve, reject);
                return cid;
            });

            return this.promise;
        },
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
