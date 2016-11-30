# Enslavism

A framework to manage distributed WebRTC servers that communicate with browser clients.

It has been created to be used by [JumpSuit](https://github.com/KordonBleu/jumpsuit). It is generally great for web-based games, but I am sure you will find other uses.

Basically, you have:

* **a** master server (Node.js)
    * knows all slaves and all clients
    * synchronises the slave list across all clients
* slaves (Node.js)
    * where you handle the business logic of your application (ex: game server)
    * you may accept WebRTC connections from clients
* clients (browser)
    * you may request a WebRTC connection to a slave in the slave list


## The point

* transmiting encrypted data without having to register a SSL certificate (unlike secure WebSockets)
* configurable reliability (unreliable is fast!)
* configurable delivery ordering (unordered is fast!)
* an architecture that allows browser clients to choose which independent server to connect to (useful for games)

## API

### Master

*To be written.*

### Slave

*To be written.*


## Try the example!

```sh
$ npm install
$ node bundler.js # generate Enslavism
$ node example/master.js
$ node example/slave.js # in a different terminal
```

Now open your browser at `http://localhost:8081/`. The page you will see loads `client.js`.

If you modify `client.js` or `message.js`, you have to restart the server because these files are cached by it, unless you set `$NODE_ENV` to `development`.
