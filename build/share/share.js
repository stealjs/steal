steal('steal',function(s){
	
	return {
		/**
		 * Flattens the list of shares until each script has a minimal depth
		 * @param {Object} shares
		 * @param {Object} depth
		 */
		flatten : function(shares, depth){
			// make waste object
			// mark the size
			while(this.maxDepth(shares) > depth){
				var min = this.min(shares);
				this.merge(shares, min);
			}
		},
		/**
		 * Merges 2 shares contents.  Shares are expected to be in the order
		 * getMostShared removes them ... by lowest depenency first.
		 * We should merge into the 'lower' dependency.
		 * 
		 * @param {Object} shares
		 * @param {Object} min
		 *     
		 *     diff : {app1 : waste, app2 : waste, _waste: 0}, 
		 *     lower: i, - the 'lower' share whos contents will be merged into, and contents should run first
		 *     higher: j  - the 'higher' share
		 */
		merge: function(shares, min){
			var lower = shares[min.lower],
				upper = shares[min.higher],
				shortName = this.shortName;
			
			s.print("\n  Flattening "+shortName(upper.appNames)+">"+
				shortName(lower.appNames)/*+"=" + min.diff._waste*/)
			for(var appName in min.diff){
				if(appName !== '_waste' && min.diff[appName]){
					s.print("  + "+min.diff[appName]+" "+shortName([appName]))
				}
			}
			
			// remove old one
			shares.splice(min.higher,1);
			
			// merge in files, lowers should run first
			lower.files = lower.files.concat(upper.files)
			
			// merge in apps
			var apps = this.appsHash(lower);
			upper.appNames.forEach(function(appName){
				if(!apps[appName]){
					lower.appNames.push(appName);
				}
			})
			//lower.waste = min.diff;
		},
		/**
		 * Goes through and figures out which package has the greatest depth
		 */
		maxDepth: function(shares){
			var packageDepths = {},
				max = 0;
			shares.forEach(function(share){
				share.appNames.forEach(function(appName){
					packageDepths[appName] = (!packageDepths[appName] ? 1 : packageDepths[appName] +1 );
					max = Math.max(packageDepths[appName], max)
				});
			});
			return max;
		},
		/**
		 * Goes through every combination of shares and returns the one with the smallest difference.
		 * Shares can have a waste property that has how much waste the share currently has 
		 * accumulated.
		 * @param {{}} shares
		 * @return {min}
		 *     {
		 *       waste : 123213, // the amount of waste in the composite share
		 *       lower : share, // the more base share, whos conents should be run first
		 *       higher: share // the less base share, whos contents should run later
		 *     }
		 */
		min: function(shares){
			var min = {diff: {
				_waste: Infinity
			}};
			for(var i = 0; i < shares.length; i++){
				var shareA = shares[i];
				if( shareA.appNames.length == 1 ){
					continue;
				}
				for(var j = i+1; j < shares.length; j++){
					var shareB = shares[j],
						diff;
					
					if( shareB.appNames.length == 1 ){
						continue;
					}
					
					diff = this.diff(shareA, shareB);
					
					if(diff._waste < min.diff._waste){
						min = {
							diff : diff,
							lower: i,
							higher: j
						}
					}
				}
			}
			return min.waste === Infinity ? null : min;
		},
		/**
		 * returns a hash of the app names for quick checking
		 */
		appsHash : function(shared){
			var apps = {};
			shared.appNames.forEach(function(name){
				apps[name] = true;
			})
			return apps
		},
		// return a difference between one share and another
		// essentially, which apps will have the waste incured by loading
		// b
		diff: function(sharedA, sharedB){
			
			// combine files ....
			var files = sharedA.files.concat(sharedB.files),
				apps = {},
				totalWaste = 0;
			
			files.forEach(function(file){
				file.appNames.forEach(function(appName){
					apps[appName] = 0;
				})
			});
			
			for(var appName in apps){
				files.forEach(function(file){
					// check file's appName
					if(file.appNames.indexOf(appName) == -1){
						apps[appName] += file.stealOpts.text.length
					}
				})
				totalWaste += apps[appName];
			}
			apps._waste = totalWaste;
			return apps;
		},
		shortName : function(appNames){
			return appNames.map(function(l){
						return s.URI(l).filename()
					}).join('-')
		}
	}
	
})
