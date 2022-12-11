const { RTCPeerConnection } = require("wrtc");

/**
 * @typedef PeekProducerOpts
 * @type {object}
 * @property {ISignaling} signaling
 * @property {string} service
 * */

/**
 * @typedef PeekMessage
 * @type {object}
 * @property {string} service
 * @property {string|null} topic
 * @property {string} message
 * @property {string} timestamp
 */

class PeekProducer {
    /**
     * @param {PeekProducerOpts} opts
     */
    constructor(opts) {
        this.signaling = opts.signaling;
        this.service = opts.service;
        /** @type {Map<string, RTCPeerConnection>} */
        this.peerConnections = new Map();
        /** @type {Map<string, RTCDataChannel>} */
        this.dataChannels = new Map();

        this.init();
    }

    /**
     * @private
     */
    init() {
        this.signaling.on("description", this.onDescription.bind(this));
        this.signaling.on("icecandidate", this.onRemoteICECandidate.bind(this));

        this.signaling.listen();
    }

    /**
     * @private
     */
    async onDescription(event) {
        const { from } = event;
        if (this.peerConnections.has(from)) {
            this.peerConnections.get(from).close();
            this.peerConnections.delete(from);
        }
        if (this.dataChannels.has(from)) {
            this.dataChannels.get(from).close();
            this.dataChannels.delete(from);
        }
        console.log("new connection", from);
        const peerConnection = new RTCPeerConnection({
            iceServers: [
                {
                    urls: "turn:34.118.17.44:3478?transport=tcp",
                    username: "user-1",
                    credential: "pass-1",
                },
                {
                    urls: "turn:34.116.135.155:3478?transport=udp",
                    username: "user-1",
                    credential: "pass-1",
                },
            ],
            // iceTransportPolicy: "relay",
        });
        this.peerConnections.set(from, peerConnection);

        peerConnection.addEventListener("datachannel", (e) => this.onDataChannel(from, e));
        peerConnection.addEventListener("icecandidate", (e) => this.onLocalICECandidate(from, e));
        peerConnection.addEventListener("connectionstatechange", () =>
            this.onConnectionStateChange(from)
        );

        await peerConnection.setRemoteDescription(event.description);
        const localDescription = await peerConnection.createAnswer();
        await peerConnection.setLocalDescription(localDescription);

        this.signaling.sendSessionDescription(localDescription, from);
    }

    /**
     * @private
     */
    onConnectionStateChange(id) {
        if (!this.peerConnections.has(id)) {
            return;
        }
        const state = this.peerConnections.get(id).connectionState;

        if (["disconnected", "failed", "closed"].includes(state)) {
            console.log("removing connection", id);
            this.peerConnections.delete(id);
        }
    }

    /**
     * @private
     */
    onLocalICECandidate(id, event) {
        if (!event.candidate) {
            return;
        }
        this.signaling.sendICECandidate(event.candidate, id);
    }

    /**
     * @private
     */
    async onRemoteICECandidate(event, from) {
        if (!this.peerConnections.has(from)) {
            return;
        }

        await this.peerConnections.get(from).addIceCandidate(event.candidate);
    }

    /**
     * @private
     * @param {string} from
     * @param {{channel: RTCDataChannel}} event
     */
    onDataChannel(from, event) {
        this.dataChannels.set(from, event.channel);
    }

    /**
     * Send a message to all consumers
     *
     * @param {string} message
     * @param {string|null} topic
     */
    log(message, topic = null) {
        if (this.dataChannels.size === 0) {
            return;
        }
        /** @type {PeekMessage} */
        const peekMessage = {
            service: this.service,
            topic,
            timestamp: new Date().toISOString(),
            message,
        };

        // eslint-disable-next-line no-restricted-syntax
        this.dataChannels.forEach((channel) => {
            if (channel.readyState !== "open") {
                return;
            }
            channel.send(JSON.stringify(peekMessage));
        });
    }

    close() {
        this.signaling.close();
    }
}
module.exports = PeekProducer;
