# Smart Home Project @ HKR

## Getting started

### **Player Commands**
#### `+play music`—to play music in the smart home send this command.
#### `+pause music`—to pause music in the smart home send this command.
#### `+stop music`—to stop music in the smart home send this command.
#### `+next song`—to play next song from the list in the smart home send this command.
#### `+prev song`—to play previous song from the list in the smart home send this command.
#### `+get song`—to retrieve current played song in the smart home send this command.
#### `+update list`—to update the music list in the smart home send this command.
#### `+enable filemon`—to enable monitoring of `music` folder in the smart home send this command.
#### `+disable filemon`—to disable monitoring of `music` folder in the smart home send this command.
#### `+enable autoplay`—to enable autoplay of music in the smart home send this command.
#### `+disable autoplay`—to disable autoplay of music in the smart home send this command.

## JSON file

Listen to the event "Info" on socket.io

```json
[
    {
        "_id": "641ca1388afec7a3bdca3669",
        "component": "dr",
        "state": 0
    },
    {
        "_id": "641ca16d8afec7a3bdca366a",
        "component": "wi",
        "state": 0
    },
    {
        "_id": "641ca18b8afec7a3bdca366b",
        "component": "bz",
        "state": 0
    },
    {
        "_id": "641ca1b18afec7a3bdca366c",
        "component": "fan",
        "state": 0
    },
    {
        "_id": "641ca2478afec7a3bdca366d",
        "component": "il",
        "state": 0
    },
    {
        "_id": "641ca26a8afec7a3bdca366e",
        "component": "ol",
        "state": 0
    },
    {
        "_id": "641ca28b8afec7a3bdca366f",
        "component": "re",
        "state": 0
    },
    {
        "_id": "64309fe9606d8c2ff3fff12e",
        "component": "light",
        "state": 715
    },
    {
        "_id": "6430a00d606d8c2ff3fff12f",
        "component": "gas",
        "state": 20
    },
    {
        "_id": "6430a074606d8c2ff3fff130",
        "component": "mot",
        "state": 0
    },
    {
        "_id": "6430a0a9606d8c2ff3fff131",
        "component": "soil",
        "state": 0
    },
    {
        "_id": "6430a0cb606d8c2ff3fff132",
        "component": "steam",
        "state": 0
    }
]
```