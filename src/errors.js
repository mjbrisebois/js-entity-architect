
const { set_tostringtag }		= require('./utils.js');


class EntityArchitectError extends Error {
    static [Symbol.toPrimitive] ( hint ) {
	return hint === "number" ? null : `[${this.name} {}]`;
    }

    constructor( ...params ) {
	super( ...params );

	if (Error.captureStackTrace) {
	    Error.captureStackTrace(this, this.constructor);
	}

	this.name		= this.constructor.name;
    }

    [Symbol.toPrimitive] ( hint ) {
	return hint === "number" ? null : this.toString();
    }

    toString () {
	return `[${this.constructor.name}( ${this.message} )]`;
    }

    toJSON ( debug = false ) {
	return {
	    "error":	this.name,
	    "message":	this.message,
	    "stack":	debug === true
		? typeof this.stack === "string" ? this.stack.split("\n") : this.stack
		: undefined,
	};
    }
}
set_tostringtag( EntityArchitectError, "EntityArchitectError" );


class UnregisteredTypeError extends EntityArchitectError {}
set_tostringtag( UnregisteredTypeError, "UnregisteredTypeError" );

class UnregisteredModelError extends EntityArchitectError {}
set_tostringtag( UnregisteredModelError, "UnregisteredModelError" );

class DuplicateTypeError extends EntityArchitectError {}
set_tostringtag( DuplicateTypeError, "DuplicateTypeError" );

class DuplicateModelError extends EntityArchitectError {}
set_tostringtag( DuplicateModelError, "DuplicateModelError" );


module.exports = {
    EntityArchitectError,

    UnregisteredTypeError,
    UnregisteredModelError,
    DuplicateTypeError,
    DuplicateModelError,
};
