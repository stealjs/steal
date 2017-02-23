import util from "./util";
import other from "directories_lib/other";
import dep from "dep";
import depUtil from "dep/util";


if(window.QUnit) {
	QUnit.equal(util.name, "util", "got util");
	QUnit.equal(other.name, "other", "got other");
	QUnit.equal(depUtil, "123", "meta applied");
	
} else {
	console.log(depUtil);
}


export default {name: "main", util: util, "dep": dep, "other": other};
