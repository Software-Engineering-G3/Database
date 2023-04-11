# Smart Home Project @ HKR

## Getting started

### **Player Commands**
#### `+play music`—to play music in the smart home send this command.
#### `+pause music`—to pause music in the smart home send this command.
#### `+stop music`—to stop music in the smart home send this command.
#### `+next song`—to play next song from the list in the smart home send this command.
#### `+prev song`—to play previous song from the list in the smart home send this command.
#### `+update list`—to update the music list in the smart home send this command.
#### `+enable filemon`—to enable monitoring of `music` folder in the smart home send this command.
#### `+disable filemon`—to disable monitoring of `music` folder in the smart home send this command.
#### `+enable autoplay`—to enable autoplay of music in the smart home send this command.
#### `+disable autoplay`—to disable autoplay of music in the smart home send this command.
#### `+volume n`—to adjust the volume (with n varying from 0 to 100). IMPORTANT n must be sent as plain text in the message field, it is not part of the event name!

## JSON "Schema"

Listen to the event "Info" on socket.io

```json
[
    {
        "component": "dr",
        "state": 0|1
    },
    {
        "component": "wi",
        "state": 0|1
    },
    {
        "component": "bz",
        "state": 0|1
    },
    {
        "component": "fan",
        "state": 0|100-255
    },
    {
        "component": "il",
        "state": 0-255
    },
    {
        "component": "ol",
        "state": 0|1
    },
    {
        "component": "re",
        "state": 0|1
    },
    {
        "component": "light",
        "state": 0|1023
    },
    {
        "component": "gas",
        "state": 0|1023
    },
    {
        "component": "mot",
        "state": 0|1023
    },
    {
        "component": "soil",
        "state": 0|1023
    },
    {
        "component": "steam",
        "state": 0|1023
    },
    {
        "component": "player",
        "state": "Playing|Paused",
        "autoplay": true|false,
        "artist": "Limp Bizkit",
        "title": "My Way",
        "volume": 0-100
    }
]
```
