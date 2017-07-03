(function($) {
	var PAGE_SIZE = 30, MIN_WIDTH = 80, SELECT_BOX_WIDTH = 35;
	var _defaults = {
		'pagination': false,
		'columns': [],  // name, width, id, formatter
		'url': '',
		'params': null,
		'data': [],
		'info': true,
		'selectable': false,
		'onLoad': function(){}
	};

	function makeThead(opts, columns) {
		var column, width, html = [];
		var w = 0;
		if(opts['selectable']) {
			html.push('<th class="free-table-selector"><input type="checkbox"/></th>')
		}
		var cssClass;
		var colMap = {};
		for(var i = 0, len = columns.length; i < len; i ++) {
			column = columns[i];
			if(null == column['id']) throw 'Each column must have an unique id';
			colMap[column['id']] = column;
			width = column['width'];
			cssClass = '';
			if(column['hide']) cssClass += 'hide';

			if(width) {
				html.push('<th class="' + cssClass + '" x-id=' + column['id'] + ' width="' + width + 'px">' + column['name'] + '</th>');
			} else {
				html.push('<th class="' + cssClass + '" x-id=' + column['id'] + '>' + column['name'] + '</th>');
			}

			w += width || MIN_WIDTH;
		}

		if(opts.selectable) w += SELECT_BOX_WIDTH;
		opts.$tableBox.css('width', w + 'px');
		opts.info && opts.$infoBox.css('width', w + 'px');
		opts['colMap'] = colMap;
		return html.join('');
	}

	function makeTr(columns, item, opts) {
		var html = [];

		if(opts['selectable']) {
			html.push('<td class="free-table-selector"><input type="checkbox"/></td>');
		}

		var td, col, colId, formatter, cssClass;
		for(var i = 0, len = columns.length; i < len; i ++) {
			col = columns[i];
			colId = col['id'];
			formatter = col['formatter'];

			if(typeof formatter === 'function') {
				text = formatter(item) + '';  // conver to string
			} else {
				text = item[col['id']] || '';
			}

			td = col['escape'] ? $('<i/>').text(text).html() : text;
			cssClass = col['hide'] ? 'hide' : '';

			if(col['cssClass']) {
				cssClass += ' ' + col['cssClass'];
			}
			if(cssClass) {
				td = '<td class=' + cssClass + '>' + td + '</td>';
			} else {
				td = '<td>' + td + '</td>';
			}
			html.push(td);
		}

		return '<tr>' + html.join('') + '</tr>';
	}

	function makeTbody(columns, items, opts) {
		var html = [];

		for(var i = 0, len = items.length; i < len; i ++) {
			html.push(makeTr(columns, items[i], opts));
		}

		return html;
	}

	function showPagination(opts, total) {
		opts.$pageBox.twbsPagination('destroy');
		opts.$pageBox.twbsPagination({
			'totalPages': Math.ceil(total / PAGE_SIZE),
			'visiblePages': 7,
			'hideOnlyOnePage': true,
			'initiateStartPageClick': false,
			'onPageClick': function(e, p){
				getPage(opts, false, p - 1);
			}
		}).show();
	}

	function makeTable(opts, items) {
        var $tbody = opts.$tableBox.find('tbody');
        $tbody.empty();

		if(items.length > 0) {
            $tbody.append(makeTbody(opts['columns'], items, opts));
			$tbody.find('tr').each(function(index) {
				$(this).data('item', items[index]);
			});
		} else {
			opts.$pageBox.hide();
		}
	}

	function getPage(opts, isFreshCall, page) {
		var api = opts['url'], params = opts['params'],
			prepare = opts['prepare'], pagination = opts['pagination'];

		params = params || {};
		page = page || 0;
		params['page'] = page;

		free.doGet(api, params, function(result) {
			if(prepare) result = prepare(result);

			var total, items;
			if(Array.isArray(result)) {
				total = result.length;
				items = result;
			} else {
				total = result['total'];
				items = result['items'];
			}

			makeTable(opts, items);
			opts['info'] && updateInfo(opts, (page + 1), Math.ceil(total / PAGE_SIZE), total);
			if(!pagination || total <= PAGE_SIZE) opts.$pageBox.hide();
			else if(isFreshCall) showPagination(opts, total);

            opts.onLoad(items);
		});
	}

	function updateInfo(opts, page, sumPage, total) {
		if(opts.pagination) {
			opts.$infoBox.find('span.page-num').text(page);
			opts.$infoBox.find('span.page-sum').text(sumPage);
		}

		opts.$infoBox.find('span.sum').text(total);
	}

	function _bind($self, opts) {
		var $table = opts.$tableBox;

		// selectable
		if(opts['selectable']) {
			$table.find('th.free-table-selector > input').on('change', function() {
				var checked = $(this).prop('checked');
				$table.find('tbody td.free-table-selector > input').prop('checked', checked);
				checked ? $table.find('tbody tr').addClass('selected') : $table.find('tbody tr').removeClass('selected');
			});

			$table.on('change', 'td.free-table-selector > input', function() {
				$(this).parents('tr').toggleClass('selected');

				var unSelected = $table.find('tbody tr:not(.selected)');
				$table.find('th.free-table-selector input').prop('checked', unSelected.length === 0);
				if(typeof opts['onSelectChange'] === 'function') {
					opts['onSelectChange']();
				}
			});

			$table.on('click', '.free-table-selector', function(e) {
				if($(e.target).is('input')) return;
				var $input = $(this).find('input');
				$input.prop('checked', !$input.prop('checked')).change();
			});
		}

		// hide & show columns
		$table.find('thead').on('contextmenu', function(e) {
			e.preventDefault();
			$self.find('.header-menu').remove();
			var $contextmenu = $('<div class="header-menu"></div>');
			$contextmenu.appendTo($self);
			var x = e.pageX, y = e.pageY;
			$contextmenu.css({
				'top': y,
				'left': x
			});
			var columns = opts['columns'];
			var html = [];
			for(var i = 0; i < columns.length; i ++) {
				html.push('<div class="item" x-id="' + columns[i]['id'] + '"><input type="checkbox"' +
					(columns[i]['hide'] ?  '' : 'checked') +
					'/><span class="name">' + columns[i]['name'] + '</span></div>');
			}
			$contextmenu.append(html.join(''));

			$contextmenu.on('click', '.item', function(e) {
				if($(e.target).is('input')) return;
				var $input = $(this).find('input');
				$input.prop('checked', !$input.prop('checked')).change();
			});
			$contextmenu.on('click', function(e) {
				e.stopPropagation();
			});
			$('body').one('click', function(e) {
				$contextmenu.remove();
			});
			$contextmenu.on('change', '.item > input', function(e) {
				var colId = $(this).parent().attr('x-id');
				var col = $self.find('thead th[x-id=' + colId + ']');
				opts.colMap[colId]['hide'] = !$(this).prop('checked');
				var colIdx = col.index() + 1;

				var $tds = $('tbody > tr > td:nth-child(' + colIdx + ')');
				col.toggleClass('hide');
				$tds.toggleClass('hide');
			});
		});
	}

	$.fn.table = function(options) {
		var $self = this;
		var $infoBox = $('<div class="info-box"><span class="page-info">第&nbsp;<span class="page-num">1</span>&nbsp;页，共&nbsp;<span class="page-sum"></span>&nbsp;页，</span>总共&nbsp;<span class="sum"></span>&nbsp;条数据</div>'),
			$tableBox = $('<div class="table-box"><table><thead></thead><tbody></tbody></table></div>'),
			$pageBox = $('<div class="page-box"></div>');

		// do not copy data
		var d = options['data'];
		delete options['data'];

		var opts = $.extend(true, {
			'$infoBox': $infoBox,
			'$tableBox': $tableBox,
			'$pageBox': $pageBox
		}, _defaults, options);

		if(d) {
			opts['data'] = d;
			options['data'] = d;
		}

		$self.addClass('free-table-container');
		if(opts.info) $self.append($infoBox);
		$self.append($tableBox);
		if(opts.pagination) $self.append($pageBox);
		else $infoBox.find('.page-info').hide();

		$tableBox.css('min-width', (opts['columns'].length * MIN_WIDTH) + 'px');  // add min width
		$tableBox.find('thead').append(makeThead(opts, opts['columns']));
		if(opts.url) {
			getPage(opts, true);
		} else if(opts['data']) {
			makeTable(opts, opts['data']);
			opts['info'] && updateInfo(opts, 1, 1, opts['data'].length);
		}

		_bind($self, opts);

		return {
			'refresh': function() {
				getPage(opts, true);
			},
			'setColumns': function(columns) {
				opts.columns = $.extend([], columns);
				$tableBox.find('thead').empty().append(makeThead(opts, columns));
			},
			'setData': function(data) {
				makeTable(opts, data);
			},
			'insert': function(item, index) {
				var $tr = $tableBox.find('tbody tr:eq(' + index + ')');
				var $target = makeTr(opts['columns'], item);
				if($tr.length === 0) {
					$tableBox.find('tbody').append($target);
				} else {
					$tr.before($target);
				}
			},
			'remove': function(index) {
				$tableBox.find('tbody tr:eq(' + index + ')').remove();
			},
			'setParams': function(ps) {
				opts.params = ps;
				getPage(opts, true)
			},
			'getSelected': function() {
				var $trs = $tableBox.find('tr.selected');
				var items = [];
				$trs.each(function(index, tr) {
					items.push($(tr).data('item'));
				});

				return {
					'rows': $trs,
					'items': items
				};
			},
			'isSelected': function(rowIndex) {
				return $tableBox.find('tr:eq(' + rowIndex + ')').hasClass('selected');
			}
		};
	};
})(jQuery);
