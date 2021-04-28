import util from "./util";
import other from "directories_lib/other";
import dep from "dep";
import depUtil from "dep/util";


if(window.assert) {
	assert.equal(util.name, "util", "got util");
	assert.equal(other.name, "other", "got other");
	assert.equal(depUtil, "123", "meta applied");

} else {
	console.log(depUtil);
}


export default {name: "main", util: util, "dep": dep, "other": other};
