const SocketIOPeekSignaling = require("../src/signaling/SocketIOPeekSignaling");
const PeekProducer = require("../src/PeekProducer");
const PeekConsumer = require("../src/PeekConsumer");

/**
 * @typedef PeekProducerOptions
 * @type {object}
 * @property {string} signalingUrl - URL of the signaling server
 * @property {string} service - The service this instance is part of
 * @property {string} secret - Shared secret needed to communicate with the signaling server
 */

/**
 * Create a new PeekProducer
 * @param {PeekProducerOptions} opts
 * @return {PeekProducer}
 */
function configureProducer(opts) {
    const signaling = new SocketIOPeekSignaling({
        url: opts.signalingUrl,
        service: opts.service,
        secret: opts.secret,
    });
    return new PeekProducer({ service: opts.service, signaling });
}
module.exports.configureProducer = configureProducer;

/**
 * @typedef PeekConsumerOptions
 * @type {object}
 * @property {string} signalingUrl - URL of the signaling server
 * @property {Array<string>} subscriptions - The list of services to subscribe to
 * @property {string} secret - Shared secret needed to communicate with the signaling server
 * @property {string|null} topicPrefix - Drop messages that don't start with topicPrefix
 */

/**
 * Create a new PeekConsumer
 * @param {PeekConsumerOptions} opts
 * @return {PeekConsumer}
 */
function configureConsumer(opts) {
    const signaling = new SocketIOPeekSignaling({
        url: opts.signalingUrl,
        secret: opts.secret,
        subscriptions: opts.subscriptions,
    });
    return new PeekConsumer({ signaling, topicPrefix: opts.topicPrefix || null });
}
module.exports.configureConsumer = configureConsumer;
