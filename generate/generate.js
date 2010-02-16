Generate = function(path, data, viewPrefix, first){
	this.paths = [path];
	this.data = data;
	this.first = first !== undefined ? first : true;
	this.viewPrefix = viewPrefix;
	this.indent= "             "
}

Generate.prototype ={
	push : function(p){
		this.paths.push(p)
		return this;
	},
	pop : function(){
		this.paths.pop();
		return this;
	},
	render : function(file, ejs, data) {
	    if(file)
			file = this.paths.length ? this.paths.concat(file).join("/") : file;
		else
			file = this.paths.join("/")
		data = data || this.data
		this.print_generating_message(file);
		
		if(this.viewPrefix){
			ejs = this.viewPrefix+ejs;
		}
		
	    new steal.File(file).save( new EJS({ url : ejs }).render(data)  );
		return this;
	},
	print_generating_message : function(path) {
		if (this.first)
			print("Generating...\n");
		
		print(this.indent + path);
		this.first = false;
		return this;
	},
	renderTextTo : function(file, text) {
		if(file)
			file = this.paths.length ? this.paths.concat(file).join("/") : file;
		else
			file = this.paths.join("/")
		this.print_generating_message(file);
		new steal.File(file).save(text);
		return this;
	},
	folder : function(file) {
		if(file)
			file = this.paths.length ? this.paths.concat(file).join("/") : file;
		else
			file = this.paths.join("/")
		this.print_generating_message(file);
		new steal.File(file).mkdirs();
		return this;
	},
	postGenerationMessage : function() {
		print("\n" + this.indent + "Make sure to add new files to your application and test file!\n");
		return this;
	}
};

Generate.regexps = {
        colons : /::/,
        words: /([A-Z]+)([A-Z][a-z])/g,
        lowerUpper : /([a-z\d])([A-Z])/g,
        dash : /([a-z\d])([A-Z])/g
    }
Generate.underscore = function(s){
        var regs = this.regexps;
        return s.replace(regs.colons, '/').
                 replace(regs.words,'$1_$2').
                 replace(regs.lowerUpper,'$1_$2').
                 replace(regs.dash,'_').toLowerCase()
    }




