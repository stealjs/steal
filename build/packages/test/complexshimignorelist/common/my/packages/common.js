steal.has("common/my/common-1.js", "common/my/common-2.js", "common/my/common.js");
steal({
	id : "common//packages/common.css",
	waits : !0,
	has : ["common/my/common-1.css", "common/my/common-2.css"]
});
steal("common/my/common-1.js", "common/my/common-2.js", "common/my/common.js");
steal.pushPending();
window.COMMON = window.COMMON || {};
window.COMMON.common_1 = function () {
};
steal.executed("common/my/common-1.js");
window.COMMON = window.COMMON || {};
window.COMMON.common_2 = function () {
};
steal.executed("common/my/common-2.js");
steal("common/my/common-1.js", "common/my/common-2.js", "common/my/common-1.css", "common/my/common-2.css").then(function () {
	COMMON.common_1();
	COMMON.common_2()
});
steal.executed("common/my/common.js");
steal.popPending();
