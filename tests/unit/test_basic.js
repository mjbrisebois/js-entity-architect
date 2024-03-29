const path				= require('path');
const log				= require('@whi/stdlog')(path.basename( __filename ), {
    level: process.env.LOG_LEVEL || 'fatal',
});

const expect				= require('chai').expect;
const { Architecture,
	EntityType,
	Entity,
	EntityArchitectError,
	UnregisteredTypeError,
	DuplicateTypeError,
	RemodelerError,
	logging }			= require('../../src/index.js');
const { HoloHash,
	EntryHash, ActionHash,
	AgentPubKey }			= require('@whi/holo-hash');

if ( process.env.LOG_LEVEL )
    logging();


const SomeType				= new EntityType("some_entry_type", function (content) {
    content.author		= new AgentPubKey(content.author);
    content.published_at	= new Date( content.published_at );
    content.last_updated	= new Date( content.last_updated );

    if ( content.some_entry )
	content.some_entry	= this.deconstruct( "entity", content.some_entry );
});

const SomeOtherType			= new EntityType("some_other_entry_type");

const ThrowEntryType			= new EntityType("throw_entry_type", function () {
    throw TypeError("Something is wrong");
});


const AUTHOR				= (new HoloHash("uhCAkocJKdTlSkQFVmjPW_lA_A5kusNOORPrFYJqT8134Pag45Vjf")).bytes();
const ID				= (new HoloHash("uhCkkEvFsj08QdtgiUDBlEhwlcW5lsfqD4vKRcaGIirSBx0Wl7MVf")).bytes();
const ACTION				= (new HoloHash("uhCkkn_kIobHe9Zt4feh751we8mDGyJuBXR50X5LBqtcSuGLalIBa")).bytes();
const ADDRESS				= (new HoloHash("uhCEkU7zcM5NFGXIljSHjJS3mk62FfVRpniZQlg6f92zWHkOZpb2z")).bytes();

function add_entity_context ( obj ) {
    return Object.assign( obj, {
	"id": ID,
	"action": ACTION,
	"address": ADDRESS,
    });
}
function new_entity ( type_name, content ) {
    return add_entity_context({
	"type": type_name,
	content,
    });
}

let entity_payload			= new_entity( "some_entry_type", {
    "published_at": 1624661323383,
    "last_updated": 1624661325451,
    "author": AUTHOR,
});
let complex_payload			= new_entity( "some_entry_type", {
    "published_at": 1624661323383,
    "last_updated": 1624661325451,
    "author": AUTHOR,
    "some_entry": entity_payload,
});
let invalid_type_entity_payload		= new_entity( null, {} );
let other_entity_payload		= new_entity( "some_other_entry_type", {});
let primitive_entity_payload		= new_entity( "some_other_entry_type", null );
let deprecated_entity_payload		= add_entity_context({
    "type": {
	"name": "old_type",
	"model": "irrelevant",
    },
    "content": {
	"message": "Hello world",
    },
});
let missing_prop_entity_payload		= {
    "id": ID,
    "type": "some_entry_type",
    "content": {}
};



function basic_tests () {
    it("should construct Entity from payload", async () => {
	let data			= new Entity( entity_payload );

	expect( data			).to.be.an("Entity");
	expect( Object.assign({},data)	).to.deep.equal( entity_payload.content );
    });

    it("should deconstruct 'entity' using schema", async () => {
	const schema			= new Architecture([
	    SomeType,
	]);
	let data			= schema.deconstruct( "entity", entity_payload );

	expect( data.published_at	).to.be.instanceof( Date );
	expect( data.last_updated	).to.be.instanceof( Date );
	expect( data.author		).to.be.instanceof( AgentPubKey );
	expect( String(data.author)	).to.equal("uhCAkocJKdTlSkQFVmjPW_lA_A5kusNOORPrFYJqT8134Pag45Vjf");
    });

    it("should deconstruct a complex entity with embeded structures", async () => {
	const schema			= new Architecture([
	    SomeType,
	]);
	let data			= schema.deconstruct( "entity", complex_payload );

	expect( data.$id		).to.be.instanceof( ActionHash );
	expect( data.$addr		).to.be.instanceof( EntryHash );
	expect( data.$action		).to.be.instanceof( ActionHash );
	expect( data.some_entry		).to.be.instanceof( Entity );
	expect( data.some_entry.author	).to.be.instanceof( AgentPubKey );
    });

    it("should deconstruct 'entity_collection' using schema", async () => {
	const schema			= new Architecture([
	    SomeType,
	]);
	let data			= schema.deconstruct( "entity_collection", [
	    entity_payload,
	]);

	expect( data[0].published_at	).to.be.instanceof( Date );
	expect( data[0].last_updated	).to.be.instanceof( Date );
	expect( data[0].author		).to.be.instanceof( AgentPubKey );
	expect( String(data[0].author)	).to.equal("uhCAkocJKdTlSkQFVmjPW_lA_A5kusNOORPrFYJqT8134Pag45Vjf");
    });

    it("should deconstruct 'entity' with empty schema", async () => {
	const schema			= new Architecture();
	let data			= schema.deconstruct( "entity", entity_payload );

	expect( data.$id		).to.be.instanceof( ActionHash );
	expect( data.$addr		).to.be.instanceof( EntryHash );
	expect( data.$action		).to.be.instanceof( ActionHash );
    });

    it("should deconstruct 'entity' with no transformer", async () => {
	const schema			= new Architecture([ SomeOtherType ], { "strict": true });
	const data			= schema.deconstruct( "entity", other_entity_payload );

	expect( data.$id		).to.be.instanceof( ActionHash );
    });

    it("should deconstruct 'entity' with deprecated type name/model", async () => {
	const schema			= new Architecture();
	const data			= schema.deconstruct( "entity", deprecated_entity_payload );

	expect( data.message		).to.equal("Hello world");
    });
}

function json_tests () {
    it("should produce Entity data-interchange structure for Entity", async () => {
	let data			= new Entity( entity_payload );

	expect( data			).to.be.an("Entity");
	expect( data.toJSON()		).to.deep.equal( entity_payload );
    });
}

function errors_tests () {
    it("should fail to construct Entity because of invalid input", async () => {
	expect( () => {
	    new Entity( missing_prop_entity_payload );
	}).to.throw( TypeError, "Entity data is missing one of the required properties" );

	expect( () => {
	    new Entity( invalid_type_entity_payload );
	}).to.throw( TypeError, "[type] to be a string; not type 'object'" );
    });

    it("should fail to construct Architecture because of invalid input", async () => {
	expect( () => {
	    new Architecture( null );
	}).to.throw( TypeError, "to be an array; not type 'object'" );

	expect( () => {
	    new Architecture([ SomeType, "invalid" ]);
	}).to.throw( TypeError, "item '1' is type 'string'" );

	expect( () => {
	    new Architecture([ SomeType, null ]);
	}).to.throw( TypeError, "item '1' is type 'null'" );

	expect( () => {
	    new Architecture([ SomeType, SomeType ], { "strict": true });
	}).to.throw( DuplicateTypeError, "'some_entry_type' is already registered" );
    });

    it("should fail to transform because of unregistered entity type", async () => {
	const schema			= new Architecture([ SomeOtherType ], { "strict": true });

	expect( () => {
	    schema.deconstruct( "entity", entity_payload );
	}).to.throw( UnregisteredTypeError, "registered types are: some_other_entry_type" );
    });

    it("should fail to construct EntityType because of invalid input", async () => {
	expect( () => {
	    new EntityType( null );
	}).to.throw( TypeError, "expects argument 0 to be a string; not type 'object'" );
    });

    it("should fail to deconstruct 'entity' with primitive value", async () => {
	const schema			= new Architecture([
	    SomeOtherType,
	]);

	expect( () => {
	    schema.deconstruct( "entity", primitive_entity_payload );
	}).to.throw( TypeError, "cannot be a primitive value; found content (object): null" );
    });

    it("should fail because remodeler raised error", async () => {
	let forced_error_payload        = new_entity( "throw_entry_type", {} );
	const schema                    = new Architecture([
	    ThrowEntryType,
	]);

	expect( () => {
	    schema.deconstruct( "entity", forced_error_payload );
	}).to.throw( RemodelerError, "Something is wrong" );

	expect( () => {
	    try {
		schema.deconstruct( "entity", forced_error_payload );
	    } catch (err) {
		err.unwrap();
	    }
	}).to.throw( TypeError, "Something is wrong" );
    });
}


describe("Compositions", () => {

    describe("Basic", basic_tests );
    describe("JSON", json_tests );
    describe("Errors", errors_tests );

});
