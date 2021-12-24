(function($R)
{
    $R.add('plugin', 'fontcolor', {
        translations: {
            en: {
                "fontcolor": "Text Color",
                "text": "Text",
                "highlight": "Highlight"
            }
        },
        init: function(app)
        {
            this.app = app;
            this.opts = app.opts;
            this.lang = app.lang;
            this.inline = app.inline;
            this.toolbar = app.toolbar;
            this.selection = app.selection;

            // local
    		this.colors = (this.opts.fontcolors) ? this.opts.fontcolors : [
    			'#ffffff', '#000000', '#eeece1', '#1f497d', '#4f81bd', '#c0504d', '#9bbb59', '#8064a2', '#4bacc6', '#f79646', '#ffff00',
    			'#f2f2f2', '#7f7f7f', '#ddd9c3', '#c6d9f0', '#dbe5f1', '#f2dcdb', '#ebf1dd', '#e5e0ec', '#dbeef3', '#fdeada', '#fff2ca',
    			'#d8d8d8', '#595959', '#c4bd97', '#8db3e2', '#b8cce4', '#e5b9b7', '#d7e3bc', '#ccc1d9', '#b7dde8', '#fbd5b5', '#ffe694',
    			'#bfbfbf', '#3f3f3f', '#938953', '#548dd4', '#95b3d7', '#d99694', '#c3d69b', '#b2a2c7', '#b7dde8', '#fac08f', '#f2c314',
    			'#a5a5a5', '#262626', '#494429', '#17365d', '#366092', '#953734', '#76923c', '#5f497a', '#92cddc', '#e36c09', '#c09100',
    			'#7f7f7f', '#0c0c0c', '#1d1b10', '#0f243e', '#244061', '#632423', '#4f6128', '#3f3151', '#31859b',  '#974806', '#7f6000'
    		];
        },
        // messages
        onfontcolor: {
            set: function(rule, value)
            {
                this._set(rule, value);
            },
            remove: function(rule)
            {
                this._remove(rule);
            }
        },

        // public
        start: function()
        {
            var btnObj = {
                title: this.lang.get('fontcolor')
            };

            var $dropdown = this._buildDropdown();

            this.$button = this.toolbar.addButton('fontcolor', btnObj);
			this.$button.setIcon('<i class="re-icon-fontcolor"></i>');
			this.$button.setDropdown($dropdown);
        },

        // private
        _buildDropdown: function()
        {
            var $dropdown = $R.dom('<div class="redactor-dropdown-cells">');

            this.$selector = this._buildSelector();

            this.$selectorText = this._buildSelectorItem('text', this.lang.get('text'));
            this.$selectorText.addClass('active');

            this.$selectorBack = this._buildSelectorItem('back', this.lang.get('highlight'));

            this.$selector.append(this.$selectorText);
            this.$selector.append(this.$selectorBack);

            this.$pickerText = this._buildPicker('textcolor');
            this.$pickerBack = this._buildPicker('backcolor');

            $dropdown.append(this.$selector);
            $dropdown.append(this.$pickerText);
            $dropdown.append(this.$pickerBack);

            this._buildSelectorEvents();

            $dropdown.width(242);

            return $dropdown;
        },
        _buildSelector: function()
        {
            var $selector = $R.dom('<div>');
            $selector.addClass('redactor-dropdown-selector');

			return $selector;
        },
        _buildSelectorItem: function(name, title)
        {
            var $item = $R.dom('<span>');
            $item.attr('rel', name).html(title);
            $item.addClass('redactor-dropdown-not-close');

            return $item;
        },
        _buildSelectorEvents: function()
        {
			this.$selectorText.on('mousedown', function(e)
			{
				e.preventDefault();

                this.$selector.find('span').removeClass('active');
				this.$pickerBack.hide();
				this.$pickerText.show();
				this.$selectorText.addClass('active');

			}.bind(this));

			this.$selectorBack.on('mousedown', function(e)
			{
				e.preventDefault();

                this.$selector.find('span').removeClass('active');
				this.$pickerText.hide();
				this.$pickerBack.show();
				this.$selectorBack.addClass('active');

			}.bind(this));
        },
        _buildPicker: function(name)
		{
			var $box = $R.dom('<div class="re-dropdown-box-' + name + '">');
			var rule = (name == 'backcolor') ? 'background-color' : 'color';
			var len = this.colors.length;
			var self = this;
			var func = function(e)
			{
				e.preventDefault();

				var $el = $R.dom(e.target);
				self._set($el.data('rule'), $el.attr('rel'));
			};

			for (var z = 0; z < len; z++)
			{
				var color = this.colors[z];

				var $swatch = $R.dom('<span>');
				$swatch.attr({ 'rel': color, 'data-rule': rule });
				$swatch.css({ 'background-color': color, 'font-size': 0, 'border': '2px solid #fff', 'width': '22px', 'height': '22px' });
				$swatch.on('mousedown', func);

				$box.append($swatch);
			}

			var $el = $R.dom('<a>');
			$el.attr({ 'href': '#' });
			$el.css({ 'display': 'block', 'clear': 'both', 'padding': '8px 5px', 'font-size': '12px', 'line-height': 1 });
			$el.html(this.lang.get('none'));

			$el.on('click', function(e)
			{
				e.preventDefault();
				self._remove(rule);
			});

			$box.append($el);

			if (name == 'backcolor') $box.hide();

            return $box;
		},
		_set: function(rule, value)
		{
    		var style = {};
    		style[rule] = value;

    		var args = {
        	    tag: 'span',
        	    style: style,
        	    type: 'toggle'
    		};

			this.inline.format(args);
		},
		_remove: function(rule)
		{
			this.inline.remove({ style: rule });
		}
    });
})(Redactor);