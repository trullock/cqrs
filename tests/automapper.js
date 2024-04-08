import { autoMapFromFirestore, autoMapToFirestore, registerClassForPersistence } from "../src/automapper.js";
import assert from "assert"

class Outer
{
	middles = [new Outer.Middle(), new Outer.Middle()];
	createdOn = null

	constructor()
	{
		this.createdOn = new Date()
	}

	static Middle = class
	{
		inner = new Outer.Middle.Inner();

		static Inner = class
		{
			createdOn = null

			constructor()
			{
				this.createdOn = new Date();
			}
		}
	}
}

registerClassForPersistence(Outer);

let sourceOuter = new Outer();

let mapped = autoMapToFirestore(sourceOuter);
let deserailised = JSON.parse(JSON.stringify(mapped));
let mappedBack = autoMapFromFirestore(deserailised);

assert.deepStrictEqual(mappedBack, sourceOuter)
