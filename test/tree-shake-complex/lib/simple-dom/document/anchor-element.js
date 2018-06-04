import Element from './element';
import extend from '../extend';


function AnchorElement(tagName, ownerDocument) {
  this.elementConstructor(tagName, ownerDocument);

  extend(this, Location.parse(''));
}

AnchorElement.prototype = Object.create(Element.prototype);
AnchorElement.prototype.constructor = AnchorElement;
AnchorElement.prototype.elementConstructor = Element;

AnchorElement.prototype.setAttribute = function(_name, value){
  Element.prototype.setAttribute.apply(this, arguments);
  if(_name.toLowerCase() === "href") {
    extend(this, Location.parse(value));
  }
};

export default AnchorElement;
