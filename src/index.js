
const { HoloHash,
	EntryHash,
	ActionHash,
	...holohashes }			= require('@whi/holo-hash');

const { set_tostringtag }		= require('./utils.js');
const { EntityArchitectError,
	UnregisteredTypeError,
	DuplicateTypeError,
	DynamicError }			= require('./errors.js');

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
    static REQUIRED_PROPERTIES		= ["id", "action", "address", "type", "content"];

    constructor ( data ) {
	if ( Entity.REQUIRED_PROPERTIES.map(key => typeof data[key]).includes("undefined") )
	    throw new TypeError(`Entity data is missing one of the required properties (${Entity.REQUIRED_PROPERTIES})`);

	if ( typeof data.type !== "string"  )
	    throw new TypeError(`Entity expects [type] to be a string; not type '${typeof data.type}'`);

	if ( typeof data.content !== "object" || data.content === null )
	    throw new TypeError(`Entity content cannot be a primitive value; found content (${typeof data.content}): ${data.content}`);

	Object.assign( this, data.content );

	let $id				= new EntryHash(data.id);
	let $action			= new ActionHash(data.action);
	let $addr			= new EntryHash(data.address);

	define_hidden_prop( this, "$id",	$id );
	define_hidden_prop( this, "$action",	$action );
	define_hidden_prop( this, "$address",	$addr );
	define_hidden_prop( this, "$addr",	$addr ); // alias to $address
	define_hidden_prop( this, "$type",	data.type );
    }

    toJSON () {
	return {
	    "id":	this.$id.bytes(),
	    "action":	this.$action.bytes(),
	    "address":	this.$address.bytes(),
	    "type":	this.$type,
	    "content":	Object.assign( {}, this ),
	};
    }
}
set_tostringtag( Entity, "Entity" );


const ARCHITECTURE_DEFAULT_OPTS		= {
    "strict": false,
};

class Architecture {
    constructor ( entity_types = [], options ) {
	this.options			= Object.assign( {}, ARCHITECTURE_DEFAULT_OPTS, options );

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
	    return input.map( item => this.deconstruct("entity", item) );
	}
	else if ( composition === "value" ) {
	    return input;
	}
	else if ( composition === "value_collection" ) {
	    return input;
	}
	else
	    throw new Error(`Unknown composition: ${composition}`);
    }

    transform ( type, content ) {
	if ( typeof type !== "string" )
	    throw new TypeError(`Transform expects [type] to be a string; not type '${typeof type}'`);

	let type_class = this.entity_types[type];

	if ( type_class === undefined ) {
	    if ( this.options.strict )
		throw new UnregisteredTypeError(`Entity type '${type}' is not recognized; registered types are: ${Object.keys(this.entity_types)}`);
	}
	else {
	    content			= type_class.remodel( content, this ) || content;
	}

	return content;
    }
}
set_tostringtag( Architecture, "Architecture" );


class EntityType {
    constructor ( name, remodeler ) {
	if ( typeof name !== "string" )
	    throw new TypeError(`EntityType constructor expects argument 0 to be a string; not type '${typeof name}'`);

	this.name			= name;
	this.remodeler			= remodeler || (() => {});
    }

    run_remodeler ( fn, content, context ) {
	try {
	    return fn.call( context, content );
	} catch ( err ) {
	    throw new DynamicError( err );
	}
    }

    remodel ( content, context ) {
	debug && log("Remodeling '%s' content", this.name );
	return this.run_remodeler( this.remodeler, content, context );
    }
}
set_tostringtag( EntityType, "EntityType" );


module.exports = {
    Architecture,
    EntityType,

    Entity,

    EntityArchitectError,
    UnregisteredTypeError,
    DuplicateTypeError,
    DynamicError,

    HoloHash,
    EntryHash,
    ActionHash,
    ...holohashes,

    logging ( deep = false ) {
	debug				= true;
	if ( deep === true )
	    objwalk.logging();
    },
};
