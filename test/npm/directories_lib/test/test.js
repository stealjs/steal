import foo from "directories_lib/foo";
import directories_lib from "directories_lib";
import { foo as other } from "./another";

export default {
	name: "test/test",
	foo: foo,
	directories_lib: directories_lib,
	other: other
};
