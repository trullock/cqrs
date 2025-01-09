
let classes = {}

let mappings = [
	
	/// DateTimes
	{
		toFirestore: (key, value) => {
			if(value instanceof Date)
				return value.getTime()
			return undefined;
		},
		fromFirestore: (key, value) => {
			if(key.substr(key.length - 2, 2) == 'On' && typeof value == 'number')
			{
				let date = new Date();
				date.setTime(value);
				return date;
			}
	
			return undefined;
		}
	}
];

function serialiseClassName(type)
{
	for(let [key, value] of Object.entries(classes))
	{
		if(type == value)
			return key;
	}

	return null;
}

function deserialiseClassName(name)
{
	return classes[name] || null
}

export function registerClassForPersistence(type, name, parent)
{
	let key = name ? name : type.name;
	if(parent)
		key = parent + '.' + name;

	classes[key] = type;

	// static nested classes
	for(let [k, value] of Object.entries(type))
	{
		if(value?.toString()?.substr(0, 5) == 'class')
			registerClassForPersistence(value, k, key)
	}
}

export function convertToFirestore(obj, converter)
{
	let converted = converter ? converter(obj) : autoMapToFirestore(obj);
	return converted;
}

export function convertFromFirestore(obj, converter)
{
	if(converter)
	{
		let converted = converter(obj);
		return converted;
	}

	let converted = autoMapFromFirestore(obj);
	return converted;
}

export function autoMapToFirestore(obj)
{
	if(obj == null)
		return null;
	
	if(Array.isArray(obj))
		return obj.map(o => autoMapToFirestore(o));

	if(obj?.constructor == Object || typeof obj == 'object')
	{
		let retval = {};

		if(obj.constructor.toString()?.substr(0, 5) == 'class')
			retval._type = serialiseClassName(obj.constructor)

		for(let [key, value] of Object.entries(obj))
		{
			let mapped = false;
			for(let mapping of mappings)
			{
				let result = mapping.toFirestore(key, value)
				if(result !== undefined)
				{
					retval[key] = result;
					mapped = true;
					break;
				}
			}

			if(!mapped)
				retval[key] = autoMapToFirestore(value);
		}
		return retval;
	}
	
	return obj;
}

export function autoMapFromFirestore(obj)
{
	if(obj == null)
		return null;

	// Handle Objects
	if(obj?.constructor == Object)
	{
		let dest = {};

		if(obj._type)
		{
			let type = deserialiseClassName(obj._type)
			dest = new type();
		}

		for(let [key, value] of Object.entries(obj))
		{
			if(key == '_type')
				continue;
				
			let mapped = false;
			for(let mapping of mappings)
			{
				let result = mapping.fromFirestore(key, value)
				if(result !== undefined)
				{
					dest[key] = result;
					mapped = true;
					break;
				}
			}

			if(!mapped)
				dest[key] = autoMapFromFirestore(value);
		}

		return dest;
	}

	// Handle Arrays
	if(Array.isArray(obj))
		return obj.map(autoMapFromFirestore);

	// Handle Primitives
	return obj;
}