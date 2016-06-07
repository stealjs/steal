const foobar = "works";
if (typeof window !== "undefined"){
	window.MODULE = {
		foobar: foobar
	}
}
export default foobar;