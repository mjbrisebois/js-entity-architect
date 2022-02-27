[![](https://img.shields.io/npm/v/@whi/entity-architect/latest?style=flat-square)](http://npmjs.com/package/@whi/entity-architect)

# Entity Architect (for Holochain)
A Javascript library for deconstructing DNA responses according to the Entity specification.

[![](https://img.shields.io/github/issues-raw/mjbrisebois/js-entity-architect?style=flat-square)](https://github.com/mjbrisebois/js-entity-architect/issues)
[![](https://img.shields.io/github/issues-closed-raw/mjbrisebois/js-entity-architect?style=flat-square)](https://github.com/mjbrisebois/js-entity-architect/issues?q=is%3Aissue+is%3Aclosed)
[![](https://img.shields.io/github/issues-pr-raw/mjbrisebois/js-entity-architect?style=flat-square)](https://github.com/mjbrisebois/js-entity-architect/pulls)


## Overview
This module is intended to help transform DNA responses and reduce data clutter.  It is designed to
integrate directly after a zome call and seamlessly restructure the contents to more GUI friendly
formats.

This is achieved by using `Object.definePropterty` to hide tracking values such as Entry/Header
hashes.  It keeps the contextual information available, but out of the way.


### Features

- Modular architecture definitions for supporting multi-DNA GUIs
- Automatically wrap an Entity's `HoloHash` properties using `@whi/holo-hash`
- Transform Entity contents based on the type model
- Detailed error classes for unexpected input


## Install

```bash
npm i @whi/entity-architect
```


## Basic usage

```javascript
const { Architecture, EntityType } = require('@whi/entity-architect');

const SomeType = new EntityType("some_type");

// Catch-all symbol "*"
SomeType.model("*", content => {
    content.published_at = new Date( content.published_at );
    content.last_updated = new Date( content.last_updated );

    return content;
});

// This will run after the catch-all callback
SomeType.model("some_model", content => {
    content.author = new AgentPubKey(content.author);

    return content;
});


const schema = new Architecture([ SomeType ]);

schema.deconstruct( "entity", {
    "id": Uint8Array [
        132,  33,  36,  18, 241, 108, 143,  79,
         16, 118, 216,  34,  80,  48, 101,  18,
         28,  37, 113, 110, 101, 177, 250, 131,
        226, 242, 145, 113, 161, 136, 138, 180,
        129, 199,  69, 165, 236, 197,  95
    ],
    "header": Uint8Array [
        132,  41,  36, 159, 249,   8, 161, 177,
        222, 245, 155, 120, 125, 232, 123, 231,
         92,  30, 242,  96, 198, 200, 155, 129,
         93,  30, 116,  95, 146, 193, 170, 215,
         18, 184,  98, 218, 148, 128,  90
    ],
    "address": Uint8Array [
        132,  33,  36,  83, 188, 220,  51, 147,
         69,  25, 114,  37, 141,  33, 227,  37,
         45, 230, 147, 173, 133, 125,  84, 105,
        158,  38,  80, 150,  14, 159, 247, 108,
        214,  30,  67, 153, 165, 189, 179
    ],
    "type": {
        "name": "some_type",
        "model": "some_model",
    },
    "content": {
        "published_at": 1624661323383,
        "last_updated": 1624661325451,
        "author": Uint8Array [
            132,  32,  36, 161, 194,  74, 117,  57,  82,
            145,   1,  85, 154,  51, 214, 254,  80,  63,
              3, 153,  46, 176, 211, 142,  68, 250, 197,
             96, 154, 147, 243,  93, 248,  61, 168,  56,
            229,  88, 223
        ],
    }
});
// {
//     [$id]: EntryHash("uhCEkEvFsj08QdtgiUDBlEhwlcW5lsfqD4vKRcaGIirSBx0Wl7MVf"),
//     [$header]: HeaderHash("uhCkkn_kIobHe9Zt4feh751we8mDGyJuBXR50X5LBqtcSuGLalIBa"),
//     [$address]: EntryHash("uhCEkU7zcM5NFGXIljSHjJS3mk62FfVRpniZQlg6f92zWHkOZpb2z"),
//     [$type]: { "name": "some_type", "model": "some_model" },
//
//     "published_at": Date(1624661325451),
//     "last_updated": Date(1624661325451),
//     "author": AgentPubKey("uhCAkocJKdTlSkQFVmjPW_lA_A5kusNOORPrFYJqT8134Pag45Vjf"),
// }
```

### API Reference

See [docs/API.md](docs/API.md)

### Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md)
