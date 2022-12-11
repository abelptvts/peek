const EventEmitter = require("events");
const { RTCPeerConnection } = require("wrtc");

/**
 * @typedef PeekConsumerOpts
 * @type {object}
 * @property {IPeekSignaling} signaling
 * @property {string|null} topicPrefix
 * */

/**
 * @typedef PeekMessage
 * @type {object}
 * @property {string} service
 * @property {string|null} topic
 * @property {string} message
 * @property {string} timestamp
 */

class PeekConsumer extends EventEmitter {
    /**
     * @param {PeekConsumerOpts} opts
     */
    constructor(opts) {
        super();
        this.signaling = opts.signaling;
        /** @type {Map<string, RTCPeerConnection>} */
        this.peerConnections = new Map();
        /** @type {Map<string, RTCDataChannel>} */
        this.dataChannels = new Map();
        this.topicPrefix = opts.topicPrefix;

        this.init();
    }

    /**
     * @private
     */
    init() {
        this.signaling.on("description", this.onDescription.bind(this));
        this.signaling.on("icecandidate", this.onRemoteICECandidate.bind(this));
        this.signaling.on("new_node", this.onNewNode.bind(this));

        this.signaling.listen();
    }

    /**
     * @private
     */
    async onNewNode(event) {
        const { id, service } = event;
        if (this.peerConnections.has(id)) {
            this.peerConnections.get(id).close();
            this.peerConnections.delete(id);
        }
        if (this.dataChannels.has(id)) {
            this.dataChannels.get(id).close();
            this.dataChannels.delete(id);
        }
        console.log("connecting", id, service);
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
        });
        const channel = peerConnection.createDataChannel();
        channel.addEventListener("message", this.onMessage.bind(this));
        this.peerConnections.set(id, peerConnection);
        this.dataChannels.set(id, channel);

        peerConnection.addEventListener("icecandidate", (e) => this.onLocalICECandidate(id, e));
        peerConnection.addEventListener("connectionstatechange", () =>
            this.onConnectionStateChange(id)
        );

        const offer = await peerConnection.createOffer();
        await peerConnection.setLocalDescription(offer);
        this.signaling.sendSessionDescription(offer, id);
    }

    /**
     * @private
     */
    async onDescription(event) {
        const { from } = event;
        if (!this.peerConnections.has(from)) {
            return;
        }

        await this.peerConnections.get(from).setRemoteDescription(event.description);
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
    async onRemoteICECandidate({ candidate, from }) {
        if (!this.peerConnections.has(from)) {
            return;
        }

        await this.peerConnections.get(from).addIceCandidate(candidate);
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
    onMessage(event) {
        try {
            const parsed = JSON.parse(event.data);
            if (this.topicPrefix && !parsed.topic.startsWith(this.topicPrefix)) {
                // drop messages we don't care about
                return;
            }

            this.emit("message", parsed);
        } catch (error) {
            console.log(error);
        }
    }

    close() {
        this.signaling.close();
    }

    /**
     * Emitted upon receiving a message
     *
     * @event PeekConsumer#message
     * @type {object}
     * @property {PeekMessage} candidate
     * */
}

module.exports = PeekConsumer;
