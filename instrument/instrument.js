// disclaimers
// - this is very slow in FF, but very fast in chrome
// - in FF if you use this with funcunit apps that have steals inside a script tag
//   it won't instrument those scripts (this works in chrome though)
// - this might not work correctly with iframes

steal.instrument = {};
steal("./parser.js").then("./process.js", "./utils.js", function(){

var utils = steal.instrument.utils,
	origJSConverter = steal.types.js.require,
	extend = function(orig, newO){
		for(var k in newO){
			orig[k] = newO[k];
		}
	}

extend(steal.instrument, {
	// keep track of all current instrumentation data (also stored in localStorage)
	files: {},
	ignores: steal.options.instrumentIgnore || utils.parentWin().steal.options.instrumentIgnore || [],
	compileStats: function(){
		var cov = utils.parentWin().steal.instrument.files;
		var stats = {
			files: {},
			total: {}
		};
		for(var fileName in cov){
			var lines = steal.instrument.lineCoverage(steal.instrument.files[fileName], cov[fileName].blocksCovered);
			stats.files[fileName] = lines;
		}
		var totalLines = 0,
			totalLinesHit = 0,
			totalBlocks = 0,
			totalBlocksHit = 0,
			totalLineCoverage,
			totalBlockCoverage;
		for(var fileName in stats.files){
			totalLines += stats.files[fileName].lines;
			totalBlocks += stats.files[fileName].blocks;
			totalLinesHit += stats.files[fileName].lines*stats.files[fileName].lineCoverage;
			totalBlocksHit += stats.files[fileName].blocks*stats.files[fileName].blockCoverage;
		}
		var total = {
			lineCoverage: totalLinesHit/totalLines,
			blockCoverage: totalBlocksHit/totalBlocks,
			lines: totalLines,
			blocks: totalBlocks
		}
		stats.total = total;
		return stats;
	},
	// The following method was adapted from Google's ScriptCover tool
	// Copyright 2011 Google Inc. All Rights Reserved.
	//
	// Licensed under the Apache License, Version 2.0 (the "License");
	// you may not use this file except in compliance with the License.
	// You may obtain a copy of the License at
	//
	//     http://www.apache.org/licenses/LICENSE-2.0
	//
	// Unless required by applicable law or agreed to in writing, software
	// distributed under the License is distributed on an "AS IS" BASIS,
	// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
	// See the License for the specific language governing permissions and
	// limitations under the License.
	addInstrumentation: function(scriptContent, fileName) {
	
		// parse() constructs the syntax tree by given JS code.
		// gen_code() generates the JS code by given syntax tree.
		var rebuiltScript = exports.gen_code(exports.parse(scriptContent), { beautify: true }),
			tokens = rebuiltScript.split('\n'),
			instrumentedContent = [], index = 1,
			// Counter of instructions in this script.
			counter = 0,
			// Counter of blocks in this script.
			blockCounter = 0,
			// Stack for numbers of blocks we are in.
			blockStack = [],
			// object that keeps track of which line numbers correspond to which block numbers: {1: [2, 3, 4], 2: [5, 8, 9]}
			blockMap = {},
			lineCount = 0,
			commands = [];
	
		for (var j = 0; j < tokens.length; j++) {
			var trimmedToken = utils.trim(tokens[j]);
			if (trimmedToken != '') {
				var concreteToken = tokens[j],
					isCommand = true;
				
				if (concreteToken.indexOf('%BRT_BLOCK_BEGIN%') != -1) {
					var blockNumber = ++blockCounter;
					blockStack.push(blockNumber);
					blockMap[blockNumber] = [];
					concreteToken = concreteToken.replace('%BRT_BLOCK_BEGIN%',
						'//BRT_BLOCK_BEGIN:' + blockNumber);
					isCommand = false;
				} else if (concreteToken.indexOf('%BRT_BLOCK_COUNTER%') != -1) {
					var blockNumber = blockStack[blockStack.length - 1];
					concreteToken = concreteToken.replace(
						'window.scriptObjects[%BRT_SCRIPT_INDEX%].' +
						'executedBlock[%BRT_BLOCK_COUNTER%] = true',
						'__s("'+fileName+'", '+blockNumber+')');
					isCommand = false;
				} else if (concreteToken.indexOf('%BRT_BLOCK_END%') != -1) {
					blockStack.pop();
					var blockNumber = blockStack[blockStack.length-1];
					concreteToken = concreteToken.replace('%BRT_BLOCK_END%',
						'//BRT_BLOCK_END:' + blockNumber);
					isCommand = false;
				}
				
				if (isCommand) {
					if (trimmedToken.indexOf('}') != 0) { // if line starts with }, don't include it
						blockMap[blockNumber].push(counter);
						lineCount++;
					}
					commands.push(concreteToken)
					counter++;
				}
				instrumentedContent.push(concreteToken);
			}
		}
		
		return {
			fileName: fileName,
			nbrBlocks: blockCounter,
			nbrLines: lineCount,
			blockMap: blockMap,
			instrumentedCode: instrumentedContent.join("\n"),
		  	code: commands.join("\n")
		};
	},
	lineCoverage: function(data, blocksUsed) {
		var linesUsed = {},
			blockMap,
			lines = 0,
			lineHits = 0,
			blockHits = 0;
		for(var i=0; i<data.nbrBlocks; i++){
			blockMap = data.blockMap[i+1];
			if(blocksUsed[i] > 0){
				blockHits++;
			}
			for(var j=0; j<blockMap.length; j++){
				linesUsed[blockMap[j]] = blocksUsed[i];
				if(blocksUsed[i] > 0){
					lineHits++;
				}
			}
		}
		var lineCoverage = lineHits/data.nbrLines,
			blockCoverage = blockHits/data.nbrBlocks;
		return {
			linesUsed: linesUsed,
			src: data.code,
			lineCoverage: lineCoverage,
			blockCoverage: blockCoverage,
			lines: data.nbrLines,
			blocks: data.nbrBlocks
		}
	}
});

if(typeof steal.instrument.ignores === "string"){
	steal.instrument.ignores = [steal.instrument.ignores];
}

// defaults to this if nothing provided
if(!steal.instrument.ignores.length){
	steal.instrument.ignores = ["jquery","funcunit","steal","documentjs","*/test","*_test.js", "mxui"]
}

steal.type("js", function(options, success, error){
		var files = utils.parentWin().steal.instrument.files,
			fileName = options.rootSrc,
			instrumentation = files[fileName],
			processInstrumentation = function(instrumentation){
				var code = instrumentation.instrumentedCode;
				// console.log(code)
				// use globalEval so anything declared as a var is a global
				utils.globalEval(code);
				success();
			}
		if(utils.shouldIgnore(fileName) || 
			location.host !== steal.File(options.originalSrc).domain() ||  
			options.type != "js"){
			return origJSConverter.apply(this, arguments);
		}	
		if(instrumentation){
			processInstrumentation(instrumentation)
			return;
		}
		
		
		steal.request(options, function(text){
			// check cache first
			var fileHash = utils.hashCode(text),
				instrumentation = utils.cache.get(fileName, fileHash);
			if(!instrumentation){
				instrumentation = steal.instrument.addInstrumentation(text, fileName);
				utils.cache.set(options.rootSrc, fileHash, instrumentation);
			}
			if(!files[fileName]){
				files[fileName] = instrumentation;
			}
			setupCoverage(instrumentation.fileName, instrumentation.nbrBlocks);
			processInstrumentation(instrumentation);
		});
	})

// only keep track in top window
window.__s = function(fileName, blockNbr){
	var cov = utils.parentWin().steal.instrument.files;
	cov[fileName].blocksCovered[blockNbr-1]++;
}

// only keep track in top window
// total statements per file
// fileName, lines
var setupCoverage = function(fileName, totalBlocks){
	var cov = utils.parentWin().steal.instrument.files;
	cov[fileName].blocksCovered = [];
	for(var i=0; i<totalBlocks; i++){
		cov[fileName].blocksCovered.push(0)
	}
}


})