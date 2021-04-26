# Peek 👀

WebRTC-based distributed tracing for Node.js services.

## Installation

Install both on producer and consumer side:

```
npm i peek
```

## Usage

Producer side:

```js
const Peek = require("peek");
const peek = Peek.createProducer({
    service: "test",
    signalingUrl: "https://example.signaling.com",
    secret: "supersecret"
});

peek.log("My first message from Peek!");

// optionally replace console.log with peek.log
const originalLog = console.log;
console.log = (...args) => {
    const message = args.join(' ');
    originalLog(message);
    peek.log(message);
}
```

Consumer side:

```js
const Peek = require("peek");
const peek = Peek.createConsumer({
    subscriptions: ["test"],
    signalingUrl: "https://example.signaling.com",
    secret: "supersecret"
});

peek.on("message", message => {
    console.log("Message from Peek producer:", message);
});
```