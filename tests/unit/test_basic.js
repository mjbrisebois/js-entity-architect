const path				= require('path');
const log				= require('@whi/stdlog')(path.basename( __filename ), {
    level: process.env.LOG_LEVEL || 'fatal',
});

const expect				= require('chai').expect;
const { Architecture,
	EntityType,
	Entity,
	Collection,
	EntityArchitectError,
	UnregisteredTypeError,
	UnregisteredModelError,
	DuplicateTypeError,
	DuplicateModelError,
	logging }		= require('../../src/index.js');
const { HoloHash,
	AgentPubKey }			= require('@whi/holo-hash');

if ( process.env.LOG_LEVEL )
    logging();


const SomeType				= new EntityType("some_entry_type");

SomeType.model("info", function (content) {
    content.published_at		= new Date( content.published_at );
    content.last_updated		= new Date( content.last_updated );
    content.author			= new AgentPubKey(content.author);

    return content;
});

const SomeOtherType			= new EntityType("some_other_entry_type");
SomeOtherType.model("noop");

const AUTHOR				= (new HoloHash("uhCAkocJKdTlSkQFVmjPW_lA_A5kusNOORPrFYJqT8134Pag45Vjf")).bytes();
const ID				= (new HoloHash("uhCEkEvFsj08QdtgiUDBlEhwlcW5lsfqD4vKRcaGIirSBx0Wl7MVf")).bytes();
const HEADER				= (new HoloHash("uhCkkn_kIobHe9Zt4feh751we8mDGyJuBXR50X5LBqtcSuGLalIBa")).bytes();
const ADDRESS				= (new HoloHash("uhCEkU7zcM5NFGXIljSHjJS3mk62FfVRpniZQlg6f92zWHkOZpb2z")).bytes();
const BASE				= (new HoloHash(AUTHOR)).toType("EntryHash").bytes();

let entity_payload = {
    "id": ID,
    "header": HEADER,
    "address": ADDRESS,
    "type": {
	"name": "some_entry_type",
	"model": "info",
    },
    "content": {
	"published_at": 1624661323383,
	"last_updated": 1624661325451,
	"author": AUTHOR,
    }
};

let bad_type_entity_payload = {
    "id": ID,
    "header": HEADER,
    "address": ADDRESS,
    "type": {
	"model": "info",
    },
    "content": {}
};

let bad_model_entity_payload = {
    "id": ID,
    "header": HEADER,
    "address": ADDRESS,
    "type": {
	"name": "some_entry_type",
	"model": "summary",
    },
    "content": {}
};

let missing_prop_entity_payload = {
    "id": ID,
    "type": {
	"name": "some_entry_type",
	"model": "summary",
    },
    "content": {}
};

let bad_prop_entity_payload = {
    "id": ID,
    "header": HEADER,
    "address": ADDRESS,
    "type": {
	"name": null,
	"model": "summary",
    },
    "content": {}
};

let primitive_entity_payload = {
    "id": ID,
    "header": HEADER,
    "address": ADDRESS,
    "type": {
	"name": "some_other_entry_type",
	"model": "noop",
    },
    "content": null
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

	expect( data.author		).to.be.instanceof( HoloHash );
	expect( String(data.author)	).to.equal("uhCAkocJKdTlSkQFVmjPW_lA_A5kusNOORPrFYJqT8134Pag45Vjf");
    });

    it("should deconstruct 'entity_collection' using schema", async () => {
	const schema			= new Architecture([
	    SomeType,
	]);
	let data			= schema.deconstruct( "entity_collection", {
	    "base": BASE,
	    "items": [
		entity_payload,
	    ],
	});

	expect( data.$base		).to.be.instanceof( HoloHash );
	expect( String(data.$base)	).to.equal("uhCEkocJKdTlSkQFVmjPW_lA_A5kusNOORPrFYJqT8134Pag45Vjf");

	expect( data[0].author		).to.be.instanceof( HoloHash );
	expect( String(data[0].author)	).to.equal("uhCAkocJKdTlSkQFVmjPW_lA_A5kusNOORPrFYJqT8134Pag45Vjf");
    });
}

function json_tests () {
    it("should produce Entity data-interchange structure for Entity", async () => {
	let data			= new Entity( entity_payload );

	expect( data			).to.be.an("Entity");
	expect( data.toJSON()		).to.deep.equal( entity_payload );
    });

    it("should produce Entity data-interchange structure for Collection", async () => {
	let input			= {
	    "base": BASE,
	    "items": [ true ],
	};
	let list			= new Collection( input );

	expect( list			).to.be.an("Collection");
	expect( list.toJSON()		).to.deep.equal( input );
    });
}

function errors_tests () {
    it("should fail to construct Entity because of invalid input", async () => {
	expect( () => {
	    new Entity( missing_prop_entity_payload );
	}).to.throw( TypeError, "Entity data is missing one of the required properties" );

	expect( () => {
	    new Entity( bad_prop_entity_payload );
	}).to.throw( TypeError, "[type.name] to be a string; not type 'object'" );
    });

    it("should fail to construct Architecture because of invalid input", async () => {
	expect( () => {
	    new Architecture();
	}).to.throw( TypeError, "to be an array; not type 'undefined'" );

	expect( () => {
	    new Architecture([ SomeType, "invalid" ]);
	}).to.throw( TypeError, "item '1' is type 'string'" );

	expect( () => {
	    new Architecture([ SomeType, null ]);
	}).to.throw( TypeError, "item '1' is type 'null'" );

	expect( () => {
	    new Architecture([ SomeType, SomeType ]);
	}).to.throw( DuplicateTypeError, "'some_entry_type' is already registered" );
    });

    it("should fail to transform because of unregistered entity type", async () => {
	const schema			= new Architecture([ SomeOtherType ]);

	expect( () => {
	    schema.deconstruct( "entity", entity_payload );
	}).to.throw( UnregisteredTypeError, "registered types are: some_other_entry_type" );
    });

    it("should fail to construct EntityType because of invalid input", async () => {
	expect( () => {
	    new EntityType( null );
	}).to.throw( TypeError, "expects argument 0 to be a string; not type 'object'" );
    });

    it("should fail to register model because of invalid input", async () => {
	expect( () => {
	    SomeType.model( null )
	}).to.throw( TypeError, "expects argument 0 to be a string; not type 'object'" );

	expect( () => {
	    SomeType.model( "summary", null )
	}).to.throw( TypeError, "argument to be a function; not type 'object'" );
    });

    it("should fail to register model because of duplicate name", async () => {
	expect( () => {
	    SomeType.model( "info" );
	}).to.throw( DuplicateModelError, "'info' is already registered for type: some_entry_type" );
    });

    it("should fail to deconstruct because invalid entity type", async () => {
	expect( () => {
	    const schema		= new Architecture([ SomeType ]);
	    schema.deconstruct( "entity", bad_type_entity_payload );
	}).to.throw( TypeError, "[type.name] to be a string; not type 'undefined'" );
    });

    it("should fail to deconstruct because invalid entity model", async () => {
	expect( () => {
	    const schema		= new Architecture([ SomeType ]);
	    schema.deconstruct( "entity", bad_model_entity_payload );
	}).to.throw( UnregisteredModelError, "registered models are: info" );
    });

    it("should fail to deconstruct 'entity' with primitive value", async () => {
	const schema			= new Architecture([
	    SomeOtherType,
	]);

	expect( () => {
	    schema.deconstruct( "entity", primitive_entity_payload );
	}).to.throw( TypeError, "cannot be a primitive value; found content (object): null" );
    });
}


describe("Compositions", () => {

    describe("Basic", basic_tests );
    describe("JSON", json_tests );
    describe("Errors", errors_tests );

});
