# Hub: Automaton-Js Websocket support

The automaton system offers integration of Spring Websocket without Socket.js/STOMP. The `Hub` module of automaton-js
provides the client-side API for that.

The Hub is a static control object for all things Websocket

## Hub Methods

```javascript 1.6
Hub.init(connectionId).then(() => { ... })
```

Hub.init needs to be called before any Websocket activity can occur. The connection id from the initial
data-block ( See [Configuring Automaton Websockets](https://github.com/quinscape/automaton/blob/master/docs/automaton-websocket.md#configuring-automaton-websockets))
is passed to `Hub.init` which returns a Promise that resolves when the Websocket connection is etablished.


```javascript 1.6
Hub.send(message)
```

Sends a JSON object as message to the server. 



```javascript 1.6
Hub.request(message).then( reply => { /* ... */ })
```

`Hub.request` sends a JSON message with request/response pairing. It returns a Promise that resolves with the 
reply data when a [Response](https://github.com/quinscape/automaton/blob/master/src/main/java/de/quinscape/automaton/model/message/Response.java) message referencing
the request message comes in. 

## Handling messages from the server


```javascript
    const unregisterFn = Hub.register("TYPE", message => { /* ... */ })
```

`Hub.register` registers an event handler to handle one type of message (OutgoinMessage on the server-side).

The return function unregisters the event handler (compatible with `useEffect` in react components).

