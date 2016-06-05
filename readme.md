# Enslavism

A framework to connect browser clients to WebRTC peer servers thanks to a master server.

It will be used by [JumpSuit](https://github.com/KordonBleu/jumpsuit), and is initially though to be used by web game, but there are many more applications!
The goal is to implement a framework to deal with a master server architecture such as JumpSuit's, but with WebRTC's DataChannels instead of WebSockets. It is also to make it reusable.
Very WIP. Probably a lot of code will come from JumpSuit.

## Developpement setup

```sh
$ npm install
$ node tests/master.js
```

Now open your browser at `http://localhost:8081/`. The page you will see loads `client.js`.
