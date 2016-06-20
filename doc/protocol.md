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
 1B      4B       ?B
+---+----------+-------------+
| 2 | slave id | "SDP offer" |
+---+----------+-------------+
```

### OfferFromClient (master → slave)
```
 1B      4B       ?B
+---+-----------+-------------+
| 2 | client id | "SDP offer" |
+---+-----------+-------------+
```
