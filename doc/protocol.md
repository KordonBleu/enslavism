# Enslavism protocol specification

The protocol's endianness is big-endian.

## Subpayloads

### Slave
```
  4B         2B               ?B
+----+------------------+-------------+
| id | user data length | "user data" |
+----+------------------+-------------+
```

## Packets

### Register (slave → master)
```
 1B     ?B
+---+--------+
| 0 | "JSON" |
+---+--------+
```

### AddSlaves (master → client)
```
 1B     ?B
+---+=======+
| 1 | Slave |
+---+=======+
```

### RemoveSlaves (master → client)
Unimplemented for now. JSON is used instead.
```
 1B   4B
+---+====+
| 2 | id |
+---+====+
```

### OfferToSlave (client → master)
```
 1B      4B          ?B
+---+----------+-------------+
| 3 | slave id | "SDP offer" |
+---+----------+-------------+
```

### OfferFromClient (master → slave)
```
 1B      4B           ?B
+---+-----------+-------------+
| 4 | client id | "SDP offer" |
+---+-----------+-------------+
```

### AnswerToClient (client → master)
```
 1B      4B            ?B
+---+-----------+--------------+
| 5 | client id | "SDP answer" |
+---+-----------+--------------+
```

### AnswerFromSlave (master → slave)
```
 1B      4B           ?B
+---+----------+--------------+
| 6 | slave id | "SDP answer" |
+---+----------+--------------+
```

### IceCandidateToSlave (client → master)
```
 1B      4B           1B          0-255B         2B             ?B
+---+----------+---------------+~~~~~~~~~~+~~~~~~~~~~~~~~~+~~~~~~~~~~~~~+
| 7 | slave id | sdpMid length | "sdpMid" | spdMLineIndex | "candidate" |
+---+----------+---------------+~~~~~~~~~~+~~~~~~~~~~~~~~~+~~~~~~~~~~~~~+
```
If `sdpMid length` is set to zero, the value of the candidate is null. In this case (and this case only), the fields `spdMLineIndex`, `"sdpMid"` and `"candidate"` are not included in the message.

### IceCandidateFromClient (master → slave)
```
 1B      4B            1B          0-255B         2B             ?B
+---+-----------+---------------+~~~~~~~~~~+~~~~~~~~~~~~~~~+~~~~~~~~~~~~~+
| 8 | client id | sdpMid length | "sdpMid" | spdMLineIndex | "candidate" |
+---+-----------+---------------+~~~~~~~~~~+~~~~~~~~~~~~~~~+~~~~~~~~~~~~~+
```

### IceCandidateToClient (client → master)
```
 1B      4B            1B          0-255B         2B             ?B
+---+-----------+---------------+~~~~~~~~~~+~~~~~~~~~~~~~~~+~~~~~~~~~~~~~+
| 9 | client id | sdpMid length | "sdpMid" | spdMLineIndex | "candidate" |
+---+-----------+---------------+~~~~~~~~~~+~~~~~~~~~~~~~~~+~~~~~~~~~~~~~+
```

### IceCandidateFromSlave (master → slave)
```
  1B      4B           1B          0-255B         2B             ?B
+----+----------+---------------+~~~~~~~~~~+~~~~~~~~~~~~~~~+~~~~~~~~~~~~~+
| 10 | slave id | sdpMid length | "sdpMid" | spdMLineIndex | "candidate" |
+----+----------+---------------+~~~~~~~~~~+~~~~~~~~~~~~~~~+~~~~~~~~~~~~~+
```
