import Element from './element';
import { propToAttr } from './utils';

function SelectElement(tagName, ownerDocument) {
	this.elementConstructor(tagName, ownerDocument);
	this.selectedIndex = 0;
}

SelectElement.prototype = Object.create(Element.prototype);
SelectElement.prototype.constructor = SelectElement;
SelectElement.prototype.elementConstructor = Element;

propToAttr(SelectElement, "value");

export default SelectElement;
