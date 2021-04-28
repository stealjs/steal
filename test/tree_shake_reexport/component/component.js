export default "component";

function Component() {

}

Component.extend = function() {
	return new Component();
};

export { Component };
