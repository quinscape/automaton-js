import Hub from "./Hub"


/** Handler map: handlerKey(topic, id) -> handler function */
const topicToHandlers = new Map();

let handlerCounter = 0;

/** pubsub registration message type */
const PUBSUB = "PUBSUB";

/** topic update message type */
const TOPIC = "TOPIC";

Hub.register(
    TOPIC,
    // See de.quinscape.automaton.runtime.pubsub.TopicUpdate
    ({topic, payload, ids}) => {

        for (let i = 0; i < ids.length; i++)
        {
            const key = handlerKey(topic, ids[i]);
            const handler = topicToHandlers.get(key);
            handler(payload);
        }
    }
);


function handlerKey(topic, id)
{
    return topic + ":" + id;
}


/**
 * Subscribes the given message handler to the given topic. Returns an unsubscribe function.
 *
 * @param {String} topic        topic name
 * @param {Function} handler    message handler function. Receives the (filtered) messages for the given topic.
 * @param {object} [filter]     Filter DSL expression
 *
 * @returns {function(...[*]=)} unsubscribe function
 */
export default function subscribeToTopic(topic, handler, filter) {

    const id = ++handlerCounter;

    Hub.send(
        PUBSUB,
        {
            op: "SUBSCRIBE",
            topic,
            filter,
            id
        }
    );

    const key = handlerKey(topic, id);

    topicToHandlers.set(key, handler);
    return () => {
        Hub.send(
            PUBSUB,
            {
                op: "UNSUBSCRIBE",
                topic,
                id
            }
        );

        topicToHandlers.delete(key);
    }
}
