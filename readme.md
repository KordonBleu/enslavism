# Enslavism

A framework to connect browser clients to WebRTC peer servers thanks to a master server.

It will be used by [JumpSuit](https://github.com/KordonBleu/jumpsuit), and is initially though to be used by web games, but there are many more applications!
The goal is to implement a framework to deal with a master server architecture such as JumpSuit's, but with WebRTC's DataChannels instead of WebSockets. It is also to make it reusable.

It is yet very WIP.

## Developpement setup

```sh
$ npm install
$ node tests/master.js
```

Now open your browser at `http://localhost:8081/`. The page you will see loads `client.js`.

If you modify files executed on the client, it is important that you rebuild them:
```sh
$ npm run postinstall
```
This is the same operation applied post-install, hence the name of the command.
It is recommended that you do this after every `git pull` as well, in case someone modified a file run by the client.
