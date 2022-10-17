(function($R)
{
    $R.add('plugin', 'table', {
        translations: {
            en: {
        		"table": "Table",
        		"insert-table": "Insert table",
        		"insert-row-above": "Insert row above",
        		"insert-row-below": "Insert row below",
        		"insert-column-left": "Insert column left",
        		"insert-column-right": "Insert column right",
        		"add-head": "Add head",
        		"delete-head": "Delete head",
        		"delete-column": "Delete column",
        		"delete-row": "Delete row",
        		"delete-table": "Delete table"
        	}
        },
        init: function(app)
        {
            this.app = app;
            this.lang = app.lang;
            this.opts = app.opts;
            this.caret = app.caret;
            this.editor = app.editor;
            this.toolbar = app.toolbar;
            this.component = app.component;
            this.inspector = app.inspector;
            this.insertion = app.insertion;
            this.selection = app.selection;
        },
        // messages
        ondropdown: {
            table: {
                observe: function(dropdown)
                {
                    this._observeDropdown(dropdown);
                }
            }
        },
        onbottomclick: function()
        {
            this.insertion.insertToEnd(this.editor.getLastNode(), 'table');
        },

        // public
        start: function()
        {
			var dropdown = {
    			observe: 'table',
    			'insert-table': {
    				title: this.lang.get('insert-table'),
    				api: 'plugin.table.insert'
    			},
    			'insert-row-above': {
                    title: this.lang.get('insert-row-above'),
    				classname: 'redactor-table-item-observable',
                    api: 'plugin.table.addRowAbove'
    			},
    			'insert-row-below': {
        			title: this.lang.get('insert-row-below'),
        			classname: 'redactor-table-item-observable',
                    api: 'plugin.table.addRowBelow'
    			},
    			'insert-column-left': {
        			title: this.lang.get('insert-column-left'),
        			classname: 'redactor-table-item-observable',
                    api: 'plugin.table.addColumnLeft'
    			},
    			'insert-column-right': {
        			title: this.lang.get('insert-column-right'),
        			classname: 'redactor-table-item-observable',
                    api: 'plugin.table.addColumnRight'
    			},
    			'add-head': {
        			title: this.lang.get('add-head'),
        			classname: 'redactor-table-item-observable',
                    api: 'plugin.table.addHead'
    			},
    			'delete-head': {
        			title: this.lang.get('delete-head'),
        			classname: 'redactor-table-item-observable',
                    api: 'plugin.table.deleteHead'
    			},
    			'delete-column': {
        			title: this.lang.get('delete-column'),
        			classname: 'redactor-table-item-observable',
                    api: 'plugin.table.deleteColumn'
    			},
    			'delete-row': {
        			title: this.lang.get('delete-row'),
        			classname: 'redactor-table-item-observable',
                    api: 'plugin.table.deleteRow'
    			},
    			'delete-table': {
        			title: this.lang.get('delete-table'),
        			classname: 'redactor-table-item-observable',
                    api: 'plugin.table.deleteTable'
    			}
			};
            var obj = {
                title: this.lang.get('table')
            };

			var $button = this.toolbar.addButtonBefore('link', 'table', obj);
			$button.setIcon('<i class="re-icon-table"></i>');
			$button.setDropdown(dropdown);
        },
		insert: function()
		{
            var rows = 2;
			var columns = 3;
			var $component = this.component.create('table');

			for (var i = 0; i < rows; i++)
			{
			    $component.addRow(columns);
			}

			$component =  this.insertion.insertHtml($component);
			this.caret.setStart($component);
		},
        addRowAbove: function()
        {
            var $component = this._getComponent();
            if ($component)
            {
                var current = this.selection.getCurrent();
                var $row = $component.addRowTo(current, 'before');

                this.caret.setStart($row);
            }
        },
        addRowBelow: function()
        {
            var $component = this._getComponent();
            if ($component)
            {
                var current = this.selection.getCurrent();
                var $row = $component.addRowTo(current, 'after');

                this.caret.setStart($row);
            }
        },
        addColumnLeft: function()
        {
            var $component = this._getComponent();
            if ($component)
            {
                var current = this.selection.getCurrent();

                this.selection.save();
                $component.addColumnTo(current, 'left');
                this.selection.restore();
            }
        },
        addColumnRight: function()
        {
            var $component = this._getComponent();
            if ($component)
            {
                var current = this.selection.getCurrent();

                this.selection.save();
                $component.addColumnTo(current, 'right');
                this.selection.restore();
            }
        },
        addHead: function()
        {
            var $component = this._getComponent();
            if ($component)
            {
                this.selection.save();
                $component.addHead();
                this.selection.restore();
            }
        },
        deleteHead: function()
        {
            var $component = this._getComponent();
            if ($component)
            {
                var current = this.selection.getCurrent();
                var $head = $R.dom(current).closest('thead');
                if ($head.length !== 0)
                {
                    $component.removeHead();
                    this.caret.setStart($component);
                }
                else
                {
                    this.selection.save();
                    $component.removeHead();
                    this.selection.restore();
                }
            }
        },
        deleteColumn: function()
        {
            var $component = this._getComponent();
            if ($component)
            {
                var current = this.selection.getCurrent();

                var $currentCell = $R.dom(current).closest('td, th');
                var nextCell = $currentCell.nextElement().get();
                var prevCell = $currentCell.prevElement().get();

                $component.removeColumn(current);

                if (nextCell) this.caret.setStart(nextCell);
                else if (prevCell) this.caret.setEnd(prevCell);
                else this.deleteTable();
            }
        },
        deleteRow: function()
        {
            var $component = this._getComponent();
            if ($component)
            {
                var current = this.selection.getCurrent();

                var $currentRow = $R.dom(current).closest('tr');
                var nextRow = $currentRow.nextElement().get();
                var prevRow = $currentRow.prevElement().get();
                var $head = $R.dom(current).closest('thead');

                $component.removeRow(current);

                if (nextRow) this.caret.setStart(nextRow);
                else if (prevRow) this.caret.setEnd(prevRow);
                else if ($head.length !== 0) {
                    $component.removeHead();
                    this.caret.setStart($component);
                }
                else this.deleteTable();
            }
        },
        deleteTable: function()
        {
            var table = this._getTable();
            if (table)
            {
                this.component.remove(table);
            }
        },

        // private
        _getTable: function()
        {
            var current = this.selection.getCurrent();
            var data = this.inspector.parse(current);
            if (data.isTable())
            {
                return data.getTable();
            }
        },
        _getComponent: function()
        {
            var current = this.selection.getCurrent();
            var data = this.inspector.parse(current);
            if (data.isTable())
            {
                var table = data.getTable();

                return this.component.create('table', table);
            }
        },
        _observeDropdown: function(dropdown)
        {
            var table = this._getTable();
            var items = dropdown.getItemsByClass('redactor-table-item-observable');
            var tableItem = dropdown.getItem('insert-table');
            if (table)
            {
                this._observeItems(items, 'enable');
                tableItem.disable();
            }
            else
            {
                this._observeItems(items, 'disable');
                tableItem.enable();
            }
        },
        _observeItems: function(items, type)
        {
            for (var i = 0; i < items.length; i++)
            {
                items[i][type]();
            }
        }
    });
})(Redactor);
(function($R)
{
    $R.add('class', 'table.component', {
        mixins: ['dom', 'component'],
        init: function(app, el)
        {
            this.app = app;

            // init
            return (el && el.cmnt !== undefined) ? el : this._init(el);
        },

        // public
        addHead: function()
        {
			this.removeHead();

			var columns = this.$element.find('tr').first().children('td, th').length;
			var $head = $R.dom('<thead>');
            var $row = this._buildRow(columns, '<th>');

            $head.append($row);
            this.$element.prepend($head);
        },
        addRow: function(columns)
        {
            var $row = this._buildRow(columns);
            this.$element.append($row);

            return $row;
        },
        addRowTo: function(current, type)
        {
            return this._addRowTo(current, type);
        },
        addColumnTo: function(current, type)
        {
            var $current = $R.dom(current);
            var $currentRow = $current.closest('tr');
            var $currentCell = $current.closest('td, th');

            var index = 0;
            $currentRow.find('td, th').each(function(node, i)
			{
				if (node === $currentCell.get()) index = i;
			});

			this.$element.find('tr').each(function(node)
			{
    			var $node = $R.dom(node);
				var origCell = $node.find('td, th').get(index);
				var $origCell = $R.dom(origCell);

				var $td = $origCell.clone();
				$td.html('<div data-redactor-tag="tbr"></div>');

				if (type === 'right') $origCell.after($td);
				else                  $origCell.before($td);
			});
        },
        removeHead: function()
        {
			var $head = this.$element.find('thead');
			if ($head.length !== 0) $head.remove();
        },
        removeRow: function(current)
        {
            var $current = $R.dom(current);
            var $currentRow = $current.closest('tr');

            $currentRow.remove();
        },
        removeColumn: function(current)
        {
            var $current = $R.dom(current);
            var $currentRow = $current.closest('tr');
            var $currentCell = $current.closest('td, th');

            var index = 0;
            $currentRow.find('td, th').each(function(node, i)
			{
				if (node === $currentCell.get()) index = i;
			});

			this.$element.find('tr').each(function(node)
			{
    			var $node = $R.dom(node);
				var origCell = $node.find('td, th').get(index);
				var $origCell = $R.dom(origCell);

				$origCell.remove();
			});
        },

        // private
        _init: function(el)
        {
            var wrapper, element;
            if (typeof el !== 'undefined')
            {
                var $node = $R.dom(el);
                var node = $node.get();
                var $figure = $node.closest('figure');
                if ($figure.length !== 0)
                {
                    wrapper = $figure;
                    element = $figure.find('table').get();
                }
                else if (node.tagName === 'TABLE')
                {
                    element = node;
                }
            }

            this._buildWrapper(wrapper);
            this._buildElement(element);
            this._initWrapper();
        },
        _addRowTo: function(current, position)
        {
            var $current = $R.dom(current);
            var $currentRow = $current.closest('tr');
            if ($currentRow.length !== 0)
            {
                var columns = $currentRow.children('td, th').length;
                var $newRow = this._buildRow(columns);

                $currentRow[position]($newRow);

                return $newRow;
            }
        },
        _buildRow: function(columns, tag)
        {
            tag = tag || '<td>';

            var $row = $R.dom('<tr>');
            for (var i = 0; i < columns; i++)
            {
                var $cell = $R.dom(tag);
                $cell.attr('contenteditable', true);
                $cell.html('<div data-redactor-tag="tbr"></div>');

                $row.append($cell);
            }

            return $row;
        },
        _buildElement: function(node)
        {
            if (node)
            {
                this.$element = $R.dom(node);
            }
            else
            {
                this.$element = $R.dom('<table>');
                this.append(this.$element);
            }
        },
        _buildWrapper: function(node)
        {
            node = node || '<figure>';

            this.parse(node);
        },
        _initWrapper: function()
        {
            this.addClass('redactor-component');
            this.attr({
                'data-redactor-type': 'table',
                'tabindex': '-1',
                'contenteditable': false
            });

            if (this.app.detector.isIe())
            {
                this.removeAttr('contenteditable');
            }
        }
    });

})(Redactor);