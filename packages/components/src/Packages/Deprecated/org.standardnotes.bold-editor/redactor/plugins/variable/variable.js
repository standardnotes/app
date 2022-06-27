(function($R)
{
    $R.add('plugin', 'variable', {
        translations: {
            en: {
                "change": "Change",
                "variable": "Variable",
                "variable-select": "Please, select a variable"
            }
        },
        modals: {
            'variable': ''
        },
        init: function(app)
        {
            this.app = app;
            this.lang = app.lang;
            this.opts = app.opts;
            this.toolbar = app.toolbar;
            this.component = app.component;
            this.insertion = app.insertion;
            this.inspector = app.inspector;
            this.selection = app.selection;
        },

        // messages
        onmodal: {
            variable: {
                open: function($modal, $form)
                {
                    this._build($modal);
                }
            }
        },
        oncontextbar: function(e, contextbar)
        {
            var data = this.inspector.parse(e.target)
            if (data.isComponentType('variable'))
            {
                var node = data.getComponent();
                var buttons = {
                    "change": {
                        title: this.lang.get('change'),
                        api: 'plugin.variable.open',
                        args: node
                    },
                    "remove": {
                        title: this.lang.get('delete'),
                        api: 'plugin.variable.remove',
                        args: node
                    }
                };

                contextbar.set(e, node, buttons, 'bottom');
            }


        },

        // public
        start: function()
        {
            if (!this.opts.variables) return;

            var obj = {
                title: this.lang.get('variable'),
                api: 'plugin.variable.open'
            };

            var $button = this.toolbar.addButton('variable', obj);
            $button.setIcon('<i class="re-icon-variable"></i>');
        },
        open: function()
		{
            var options = {
                title: this.lang.get('variable'),
                width: '600px',
                name: 'variable'
            };

            this.$currentItem = this._getCurrent();
            this.app.api('module.modal.build', options);
		},
		insert: function($item)
		{
    		this.app.api('module.modal.close');

            var type = $item.attr('data-type');
            var $variable = this.component.create('variable');
            $variable.html(type);

            this.insertion.insertRaw($variable);
		},
        remove: function(node)
        {
            this.component.remove(node);
        },

        // private
		_getCurrent: function()
		{
    		var current = this.selection.getCurrent();
    		var data = this.inspector.parse(current);
    		if (data.isComponentType('variable'))
    		{
        		return this.component.build(data.getComponent());
    		}
		},
		_build: function($modal)
		{
            var $body = $modal.getBody();
            var $label = this._buildLabel();
            var $list = this._buildList();

            this._buildItems($list);

            $body.html('');
            $body.append($label);
            $body.append($list);
		},
		_buildLabel: function()
		{
            var $label = $R.dom('<label>');
            $label.html(this.lang.parse('## variable-select ##:'));

    		return $label;
		},
		_buildList: function()
		{
    		var $list = $R.dom('<ul>');
            $list.addClass('redactor-variables-list');

            return $list;
		},
		_buildItems: function($list)
		{
    		var selectedType = this._getCurrentType();
    		var items = this.opts.variables;

    		for (var i = 0; i < items.length; i++)
            {
                var type = items[i].trim();
                var $li = $R.dom('<li>');
                var $item = $R.dom('<span>');

                $item.attr('data-type', type);
                $item.html(type);
                $item.on('click', this._toggle.bind(this));

                if (selectedType === type)
                {
                    $item.addClass('redactor-variables-item-selected');
                }

                $li.append($item);
                $list.append($li);
            }
		},
		_getCurrentType: function()
		{
    		if (this.$currentItem)
    		{
        		var variableData = this.$currentItem.getData();

        		return variableData.type;
            }

    		return false;
		},
		_toggle: function(e)
		{
            var $item = $R.dom(e.target);

            this.app.api('plugin.variable.insert', $item);
		}
    });
})(Redactor);
(function($R)
{
    $R.add('class', 'variable.component', {
        mixins: ['dom', 'component'],
        init: function(app, el)
        {
            this.app = app;
            this.utils = app.utils;

            // init
            return (el && el.cmnt !== undefined) ? el : this._init(el);
        },
        // public
        getData: function()
        {
            return {
                type: this._getType()
            };
        },

        // private
        _init: function(el)
        {
            el = el || '<span>';

            this.parse(el);
            this._initWrapper();
        },
        _getType: function()
        {
            var text = this.text().trim();

            return this.utils.removeInvisibleChars(text);
        },
        _initWrapper: function()
        {
            this.addClass('redactor-component');
            this.attr({
                'data-redactor-type': 'variable',
                'tabindex': '-1',
                'contenteditable': false
            });
        }
    });
})(Redactor);