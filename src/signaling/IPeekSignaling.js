/* eslint-disable class-methods-use-this,no-unused-vars */
const EventEmitter = require("events");

/**
 * Base class for implementing WebRTC signaling
 *
 * */
class IPeekSignaling extends EventEmitter {
    /**
     * Start listening for WebRTC offers and ICE candidates.
     * @fires IPeekSignaling#description
     * @fires IPeekSignaling#icecandidate
     * */
    listen() {}

    /**
     * Send an offer to the listening peers, thus performing a "call".
     *
     * @param {RTCSessionDescription} description
     * @param {string|null} to
     * */
    sendSessionDescription(description, to = null) {}

    /**
     * Send an ICE candidate to the listening peers.
     *
     * @param {RTCIceCandidate} candidate
     * @param {string|null} to
     * */
    sendICECandidate(candidate, to = null) {}

    /**
     * Stop listening.
     * */
    close() {}

    /**
     * This peer received a session description. It's up to the peer to interpret it as an offer or
     * as an answer.
     *
     * @event IPeekSignaling#description
     * @type {object}
     * @property {RTCSessionDescription} description
     * @property {string} from
     * */

    /**
     * This peer received an ICE candidate.
     *
     * @event IPeekSignaling#icecandidate
     * @type {object}
     * @property {RTCIceCandidate} candidate
     * @property {string} from
     * */

    /**
     * A new producer node joined
     *
     * @event IPeekSignaling#new_node
     * @type {object}
     * @property {string} service
     * @property {string} id
     * */
}

module.exports = IPeekSignaling;
