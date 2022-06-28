(function($R)
{
    $R.add('plugin', 'specialchars', {
        translations: {
    		en: {
    			"specialchars": "Special Characters"
    		}
        },
        init: function(app)
        {
            this.app = app;
            this.lang = app.lang;
            this.toolbar = app.toolbar;
            this.insertion = app.insertion;

            // local
            this.chars = [

                '&lsquo;', '&rsquo;', '&ldquo;', '&rdquo;', '&ndash;', '&mdash;', '&divide;', '&hellip;', '&trade;', '&bull;',
            	'&rarr;', '&asymp;', '$', '&euro;', '&cent;', '&pound;', '&yen;', '&iexcl;',
            	'&curren;', '&brvbar;', '&sect;', '&uml;', '&copy;', '&ordf;', '&laquo;', '&raquo;', '&not;', '&reg;', '&macr;',
            	'&deg;', '&sup1;', '&sup2;', '&sup3;', '&acute;', '&micro;', '&para;', '&middot;', '&cedil;',  '&ordm;',
            	'&frac14;', '&frac12;', '&frac34;', '&iquest;', '&Agrave;', '&Aacute;', '&Acirc;', '&Atilde;', '&Auml;', '&Aring;',
            	'&AElig;', '&Ccedil;', '&Egrave;', '&Eacute;', '&Ecirc;', '&Euml;', '&Igrave;', '&Iacute;', '&Icirc;', '&Iuml;',
            	'&ETH;', '&Ntilde;', '&Ograve;', '&Oacute;', '&Ocirc;', '&Otilde;', '&Ouml;', '&times;', '&Oslash;', '&Ugrave;',
            	'&Uacute;', '&Ucirc;', '&Uuml;', '&Yacute;', '&THORN;', '&szlig;', '&agrave;', '&aacute;', '&acirc;', '&atilde;',
            	'&auml;', '&aring;', '&aelig;', '&ccedil;', '&egrave;', '&eacute;', '&ecirc;', '&euml;', '&igrave;', '&iacute;',
            	'&icirc;', '&iuml;', '&eth;', '&ntilde;', '&ograve;', '&oacute;', '&ocirc;', '&otilde;', '&ouml;',
            	'&oslash;', '&ugrave;', '&uacute;', '&ucirc;', '&uuml;', '&yacute;', '&thorn;', '&yuml;', '&OElig;', '&oelig;',
            	'&#372;', '&#374', '&#373', '&#375;'
            ];
        },
        // public
        start: function()
        {
            var btnObj = {
                title: this.lang.get('specialchars')
            };

            var $dropdown = this._buildDropdown();

            this.$button = this.toolbar.addButton('specialchars', btnObj);
			this.$button.setIcon('<i class="re-icon-specialcharacters"></i>');
			this.$button.setDropdown($dropdown);
        },

        // private
        _set: function(character)
        {
            this.insertion.insertChar(character);
        },
        _buildDropdown: function()
		{
    		var self = this;
            var $dropdown = $R.dom('<div class="redactor-dropdown-cells">');
            var func = function(e)
			{
				e.preventDefault();

				var $el = $R.dom(e.target);
				self._set($el.data('char'));
			};

            for (var i = 0; i < this.chars.length; i++)
            {
                var $el = $R.dom('<a>');
                $el.attr({ 'href': '#', 'data-char': this.chars[i] });
                $el.css({ 'line-height': '32px', 'width': '32px', 'height': '32px' });
                $el.html(this.chars[i]);
                $el.on('click', func);

                $dropdown.append($el);
            }

            return $dropdown;
		}
    });
})(Redactor);