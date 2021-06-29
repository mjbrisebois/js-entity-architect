
const { HoloHash,
	EntryHash,
	HeaderHash,
	...holohashes }			= require('@whi/holo-hash');

const { set_tostringtag }		= require('./utils.js');
const { EntityArchitectError,
	UnregisteredTypeError,
	UnregisteredModelError,
	DuplicateTypeError,
	DuplicateModelError  }		= require('./errors.js');

let debug				= false;

function log ( msg, ...args ) {
    let datetime			= (new Date()).toISOString();
    console.log(`${datetime} [ src/index. ]  INFO: ${msg}`, ...args );
}


function define_hidden_prop ( obj, key, value ) {
    if ( obj[key] === undefined ) {
	Object.defineProperty( obj, key, {
	    "value": value,
	    "writable": false,
	    "enumerable": false,
	    "configurable": false,
	});
    }
}

class Entity {
    static REQUIRED_PROPERTIES		= ["id", "header", "address", "type", "content"];

    constructor ( data ) {
	if ( Entity.REQUIRED_PROPERTIES.map(key => typeof data[key]).includes("undefined") )
	    throw new TypeError(`Entity data is missing one of the required properties (${Entity.REQUIRED_PROPERTIES})`);

	if ( typeof data.type.name !== "string"  )
	    throw new TypeError(`Entity expects [type.name] to be a string; not type '${typeof data.type.name}'`);

	if ( typeof data.type.model !== "string"  )
	    throw new TypeError(`Entity expects [type.model] to be a string; not type '${typeof data.type.model}'`);

	if ( typeof data.content !== "object" || data.content === null )
	    throw new TypeError(`Entity content cannot be a primitive value; found content (${typeof data.content}): ${data.content}`);

	Object.assign( this, data.content );

	let $id				= new EntryHash(data.id);
	let $header			= new HeaderHash(data.header);
	let $addr			= new EntryHash(data.address);

	define_hidden_prop( this, "$id",	$id );
	define_hidden_prop( this, "$header",	$header );
	define_hidden_prop( this, "$address",	$addr );
	define_hidden_prop( this, "$addr",	$addr ); // alias to $address
	define_hidden_prop( this, "$type",	data.type );
    }

    toJSON () {
	return {
	    "id":	this.$id.bytes(),
	    "header":	this.$header.bytes(),
	    "address":	this.$address.bytes(),
	    "type":	Object.assign( {}, this.$type ),
	    "content":	Object.assign( {}, this ),
	};
    }
}
set_tostringtag( Entity, "Entity" );


class Collection extends Array {
    constructor ( ...args ) {
	if ( typeof args[0] === "object" && args[0] !== null
	     && args[0].base !== undefined && args[0].items !== undefined ) {
	    let input			= args[0];
	    super( ...input.items );

	    define_hidden_prop( this, "$base", new EntryHash(input.base) );
	}
	else {
	    super( ...args );
	}
    }

    slice () {
	throw new Error(`Collection is not intended to by sliced; use <Collection>.items(start, end) to get a native Array`);
    }

    items ( ...args ) {
	return Object.assign([], super.slice( ...args ));
    }

    toJSON () {
	return {
	    "base":	this.$base.bytes(),
	    "items":	this.items(),
	};
    }
}
set_tostringtag( Collection, "Collection" );


class Architecture {
    constructor ( entity_types ) {
	if ( !Array.isArray(entity_types) )
	    throw new TypeError(`Architecture constructor expects input to be an array; not type '${typeof entity_types}'`);

	this.entity_types		= {};

	for (let [i,type_class] of Object.entries(entity_types)) {
	    if ( !(type_class instanceof EntityType) ) {
		let constructor_name	= typeof type_class === "object"
		    ? (type_class === null
		       ? "null"
		       : type_class.constructor.name )
		    : typeof type_class;
		throw new TypeError(`Architecture constructor expects an array of EntityType instances; item '${i}' is type '${constructor_name}'`);
	    }

	    let type			= type_class.name;

	    if ( this.entity_types[type] !== undefined )
		throw new DuplicateTypeError(`Entity type '${type}' is already registered: ${Object.keys(this.entity_types)}`);

	    this.entity_types[type]	= type_class;
	}
    }

    deconstruct ( composition, input ) {
	debug && log("Parsed msg value (composition: %s): %s", composition, typeof input );

	if ( composition === "entity" ) {
	    return this.transform( input.type, new Entity( input ) );
	}
	else if ( composition === "entity_collection" ) {
	    return new Collection( input )
		.map( item => this.deconstruct( "entity", item ) );
	}
	else if ( composition === "value" ) {
	    return input;
	}
	else if ( composition === "value_collection" ) {
	    return new Collection( input );
	}
	else
	    throw new Error(`Unknown composition: ${composition}`);
    }

    transform ( type, content ) {
	if ( typeof type.name !== "string" )
	    throw new TypeError(`Transform expects [type.name] to be a string; not type '${typeof type.name}'`);

	let type_class = this.entity_types[type.name];

	if ( type_class === undefined )
	    throw new UnregisteredTypeError(`Entity type '${type.name}' is not recognized; registered types are: ${Object.keys(this.entity_types)}`);

	return type_class.remodel( type.model, content );
    }
}
set_tostringtag( Architecture, "Architecture" );


class EntityType {
    constructor ( name ) {
	if ( typeof name !== "string" )
	    throw new TypeError(`EntityType constructor expects argument 0 to be a string; not type '${typeof name}'`);

	this.name			= name;
	this.remodelers			= {};
    }

    model ( id, callback ) {
	if ( typeof id !== "string" )
	    throw new TypeError(`EntityType model expects argument 0 to be a string; not type '${typeof id}'`);

	if ( callback === undefined )
	    callback			= (content => content);
	else if ( typeof callback !== "function" )
	    throw new TypeError(`EntityType model expects callback argument to be a function; not type '${typeof callback}'`);

	if ( this.remodelers[id] !== undefined )
	    throw new DuplicateModelError(`Model named '${id}' is already registered for type: ${this.name}`);

	this.remodelers[id]		= callback;
    }

    remodel ( id, content ) {
	let remodeler			= this.remodelers[id];

	if ( remodeler === undefined )
	    throw new UnregisteredModelError(`Entity model '${id}' is not recognized; registered models are: ${Object.keys(this.remodelers)}`);

	debug && log("Remodeling '%s' content to '%s' model", this.name, id );
	return remodeler.call( this, content );
    }
}
set_tostringtag( EntityType, "EntityType" );


module.exports = {
    Architecture,
    EntityType,

    Entity,
    Collection,

    EntityArchitectError,
    UnregisteredTypeError,
    UnregisteredModelError,
    DuplicateTypeError,
    DuplicateModelError,

    HoloHash,
    EntryHash,
    HeaderHash,
    ...holohashes,

    logging ( deep = false ) {
	debug				= true;
	if ( deep === true )
	    objwalk.logging();
    },
};
