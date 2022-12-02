[back to README.md](../README.md)

# API Reference

Examples assume the module is loaded like this
```javascript
const { Architecture, EntityType,
        Collection, Entity } = require('@whi/entity-architect');
```

### Module exports
```javascript
{
    Architecture,
    EntityType,

    Entity,
    Collection,

    // Entity Architect Error type
    EntityArchitectError,

    // Entity Architect Error classes
    UnregisteredTypeError,
    DuplicateTypeError,

    // Export includes all exports from @whi/holo-hash
    ...require('@whi/holo-hash'),
}
```

## `new Architecture( entity_types )`

- `entity_types` - (*required*) an array of `EntityType` instances.

Example usage
```javascript
const schema			= new Architecture([
    SomeType,
]);
```

### `<Architecture>.deconstruct( composition, input )`

- `composition` - (*required*) indicates the input's composition
  - supported compositions are: `entity`, `entity_collection`, `value`, `value_collection`
- `input` - (*required*) the appropriate data for the given composition

Example usage
```javascript
schema.deconstruct( "entity", {
    "id": Uint8Array [
        132,  41,  36,  18, 241, 108, 143,  79,
         16, 118, 216,  34,  80,  48, 101,  18,
         28,  37, 113, 110, 101, 177, 250, 131,
        226, 242, 145, 113, 161, 136, 138, 180,
        129, 199,  69, 165, 236, 197,  95
    ],
    "action": Uint8Array [
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
    "type": "some_type",
    "content": any
});
```


### `<Architecture>.transform( type, content )`
Transform the given `content` using the corrosponding `EntityType` instance.

- `type` - (*required*) Entity type name
- `content` - (*required*) the data to be transformed.  Should match the expected content structure.

```javascript
schema.transform("some_type", content )
```


## `new EntityType( name )`

- `name` - (*required*) the name of this entity type.  This will typically match the entry type name
  in your DNA.

Example usage
```javascript
const SomeType = new EntityType("some_type");
```


### `<EntityType>.remodel( content, context )`
Remodel the given `content` using the remodeler.

- `content` - (*required*) the data to be remodeled.  Should match the structure expected by the
  registered callback.
- `context` - (*optional*) the `this` context that will be used when calling remodelers

Returns the transformed content.

Example usage
```javascript
SomeType.remodel( content );
```


## `new Entity( input )`

- `input` - (*required*) the Entity data-interchange structure described in the Entity specification

> **NOTE:** Entity content cannot be a primitive value (eg. `bool, string, number, null`).  This is
> because the Entity specification discourages those values and `Object.defineProperty` cannot be
> called on non-objects.


Example usage
```javascript
let content = new Entity({
    "id": Uint8Array [
        132,  41,  36,  18, 241, 108, 143,  79,
         16, 118, 216,  34,  80,  48, 101,  18,
         28,  37, 113, 110, 101, 177, 250, 131,
        226, 242, 145, 113, 161, 136, 138, 180,
        129, 199,  69, 165, 236, 197,  95
    ],
    "action": Uint8Array [
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
    "type": "some_type",
    "content": content
});
```


### `<Entity>.toJSON()`
Returns a JSON compatible object that matches the constructor's input structure.



## `new Collection( input )`

- `input` - (*required*) the Collection data-interchange structure described in the Entity specification

Example usage
```javascript
let list = new Collection({
    "base": Uint8Array [
        132,  33,  36, 161, 194,  74, 117,  57,  82,
        145,   1,  85, 154,  51, 214, 254,  80,  63,
          3, 153,  46, 176, 211, 142,  68, 250, 197,
         96, 154, 147, 243,  93, 248,  61, 168,  56,
        229,  88, 223
    ],
    "items": [ true ],
});
```


### `<Collection>.slice(...)`
Will throw `Error` because a subset of this collection would no longer represent the results from
`this.$base`.  Use `this.items(...)` instead if you don't need to retain the `$base` value.


### `<Collection>.items( start, end )`
This method behaves the same as `.slice(...)` except that it returns a instance of `Array` rather
than an instance of `Collection`.

- `start` - (*optional*) same as `Array.prototype.slice( start )`
- `end` - (*optional*) same as `Array.prototype.slice( undefined, end )`


### `<Collection>.toJSON()`
Returns a JSON compatible object that matches the constructor's input structure.
