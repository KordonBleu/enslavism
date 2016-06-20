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

### Register
```
 1B     ?B
+---+--------+
| 0 | "JSON" |
+---+--------+
```

### AddSlaves
```
 1B     ?B
+---+=======+
| 1 | Slave |
+---+=======+
```

### RemoveSlaves
Unimplemented for now. JSON is used instead.
```
 1B   4B
+---+====+
| 2 | id |
+---+====+
```

### Offer
```
 1B   4B       ?B
+---+----+-------------+
| 2 | id | "SDP offer" |
+---+----+-------------+
```
