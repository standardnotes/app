(function($R)
{
    $R.add('plugin', 'textexpander', {
        init: function(app)
        {
            this.app = app;
            this.opts = app.opts;
            this.utils = app.utils;
            this.editor = app.editor;
            this.marker = app.marker;
            this.keycodes = app.keycodes;
            this.selection = app.selection;
        },
        // public
        start: function()
        {
            if (!this.opts.textexpander) return;

            var $editor = this.editor.getElement();
			$editor.on('keyup.redactor-plugin-textexpander', this._expand.bind(this));
		},
		stop: function()
		{
            var $editor = this.editor.getElement();
			$editor.off('.redactor-plugin-textexpander');
		},

		// private
		_expand: function(e)
		{
            var key = e.which;
			if (key === this.keycodes.SPACE)
			{
    			var len = this.opts.textexpander.length;
                for (var i = 0; i < len; i++)
                {
                    var str = this.opts.textexpander[i];
    			    var re = new RegExp(this.utils.escapeRegExp(str[0]) + '\\s$');
                    var rangeText = this.selection.getTextBeforeCaret(str[0].length + 1).replace(/\s$/, '');

    			    if (str[0] === rangeText)
    			    {
        			    return this._replaceSelection(re, str[1]);
    			    }

                }
			}
		},
		_replaceSelection: function(re, replacement)
		{
    		var marker = this.marker.insert('start');
            var current = marker.previousSibling;
            var currentText = current.textContent;

            currentText = currentText.replace(/&nbsp;/, ' ');
        	currentText = currentText.replace(re, replacement);
        	current.textContent = currentText;

 			this.selection.restoreMarkers();

            return;
		}
    });
})(Redactor);