Generator ={
	first: true,
	indent: "             ",
	renderTo : function(file, ejs, data) {
	    this.print_generating_message(file);
	    new steal.File(file).save( new EJS({ url : ejs }).render(data)  );
	},
	print_generating_message : function(path) {
		if (this.first)
			print("Generating...\n");
		
		print(this.indent + path);
		this.first = false;
	},
	renderTextTo : function(file, text) {
		this.print_generating_message(file);
		new steal.File(file).save(text);
	},
	createFolder : function(file) {
		this.print_generating_message(file);
		new steal.File(file).mkdirs();

	},
	postGenerationMessage : function() {
		print("\n" + this.indent + "Make sure to add new files to your application and test file!\n");
	}
};




