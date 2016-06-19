# Enslavism

A framework to connect browser clients to WebRTC peer servers with the help of a master server.

It has been created to be used by [JumpSuit](https://github.com/KordonBleu/jumpsuit).
The goal is to implement a framework to deal with a master server architecture such as JumpSuit's, but with WebRTC's DataChannels instead of WebSockets. It is also to make it reusable.

It is yet very WIP.

## Uses
 * transmiting encrypted data without having to register a SSL certificate (unlike secure WebSockets)
 * configurable reliability (unreliable is fast!)
 * configurable delivery ordering (unordered is fast!)
 * an architecture that allows browser clients to choose which independent server to connect to (usefull for games)

## Developpement setup

```sh
$ npm install
$ node tests/master.js
```

Now open your browser at `http://localhost:8081/`. The page you will see loads `client.js`.

If you modify `client.js` or `message.js`, you have to restart the server because these files are cached by it.
