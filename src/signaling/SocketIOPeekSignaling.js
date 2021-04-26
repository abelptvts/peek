const IO = require("socket.io-client");
const { RTCSessionDescription, RTCIceCandidate } = require("wrtc");
const IPeekSignaling = require("./IPeekSignaling");

/**
 * @typedef SocketIOSignalingOpts
 * @type {object}
 * @property {string} url
 * @property {string} secret
 * @property {string} service
 * @property {Array<string> | undefined} subscriptions
 * */

class SocketIOPeekSignaling extends IPeekSignaling {
    /**
     * @param {SocketIOSignalingOpts} opts
     */
    constructor(opts) {
        super();
        const query = {};
        if (opts.service) {
            query.service = opts.service;
        }
        if (opts.subscriptions) {
            query.subscriptions = opts.subscriptions;
        }
        this.socket = IO(opts.url, {
            autoConnect: false,
            auth: {
                token: opts.secret,
            },
            query,
        });
        console.log({
            service: opts.service ? opts.service : undefined,
            subscriptions: opts.subscriptions ? opts.subscriptions : undefined,
        });
        this.initSocket();
    }

    /**
     * @private
     */
    initSocket() {
        this.socket.on("description", (event) => {
            if (!event.description) {
                console.warn("Invalid event", event);
                return;
            }

            this.emit("description", {
                description: new RTCSessionDescription(event.description),
                from: event.from,
            });
        });
        this.socket.on("icecandidate", (event) => {
            if (!event.candidate) {
                console.warn("Invalid event", event);
                return;
            }

            this.emit("icecandidate", {
                candidate: new RTCIceCandidate(event.candidate),
                from: event.from,
            });
        });
        this.socket.on("new_node", (event) => {
            if (!event.id && !event.service) {
                console.warn("Invalid event", event);
                return;
            }

            this.emit("new_node", {
                id: event.id,
                service: event.service,
            });
        });
        this.socket.on("connect_error", console.log);
    }

    listen() {
        this.socket.connect();
    }

    sendSessionDescription(description, to) {
        this.socket.emit("description", { description, to });
    }

    sendICECandidate(candidate, to) {
        this.socket.emit("icecandidate", { candidate, to });
    }

    close() {
        this.socket.close();
    }
}
module.exports = SocketIOPeekSignaling;
