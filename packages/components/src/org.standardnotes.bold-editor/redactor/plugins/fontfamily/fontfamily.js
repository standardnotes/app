(function($R)
{
    $R.add('plugin', 'fontfamily', {
        translations: {
            en: {
                "fontfamily": "Font",
                "remove-font-family":  "Remove Font Family"
            }
        },
        init: function(app)
        {
            this.app = app;
            this.opts = app.opts;
            this.lang = app.lang;
            this.inline = app.inline;
            this.toolbar = app.toolbar;

            // local
    		this.fonts = (this.opts.fontfamily) ? this.opts.fontfamily : ['Arial', 'Helvetica', 'Georgia', 'Times New Roman', 'Monospace'];
        },
        // public
        start: function()
        {
            var dropdown = {};
			for (var i = 0; i < this.fonts.length; i++)
			{
    			var font = this.fonts[i];
				dropdown[i] = {
    				title: font.replace(/'/g, ''),
    				api: 'plugin.fontfamily.set',
    				args: font
                };
			}

			dropdown.remove = {
    			title: this.lang.get('remove-font-family'),
    			api: 'plugin.fontfamily.remove'
            };

            var $button = this.toolbar.addButton('fontfamily', { title: this.lang.get('fontfamily') });
            $button.setIcon('<i class="re-icon-fontfamily"></i>');
			$button.setDropdown(dropdown);
        },
        set: function(value)
		{
    		var args = {
        	    tag: 'span',
        	    style: { 'font-family': value },
        	    type: 'toggle'
    		};

			this.inline.format(args);
		},
		remove: function()
		{
			this.inline.remove({ style: 'font-family' });
		}
    });
})(Redactor);