import Hub from "./Hub"

/**
 * Publishes the given message payload for the given topic
 *
 * @category websocket

 * @param {String} topic        topic name
 * @param {object} message      message payload
 *
 */
export default function publish(topic, message)
{
    Hub.send("PUBSUB", {
        op: "PUBLISH",
        topic,
        message
    });
}
