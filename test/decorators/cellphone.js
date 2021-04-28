@addBrand("Bitovi")
export default class Cellphone {
}

function addBrand(brand) {
	return function decorator(klass) {
		klass.prototype.brand = brand;
	};
}
