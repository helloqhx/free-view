(function($) {
	var SELECT_BOX_WIDTH = 35, THROTTLE_THRESHOLD = 100;
	var _defaults = {
		'pagination': false,
		'columns': [],  // name, width, id, formatter, min_width, sort, editable, hide
		'url': '',
		'params': null,
		'data': [],
		'info': true,
		'minWidth': 80,
		'pageSize': 30,
		'sortType': 'client',  // client or server
		'selectable': false,
		'enableColumnResize': false,
		'enableColumnReorder': false,
		'enableColumnHide': false,
		'onLoad': function(){}
	};

	/* throttle en event handler */
	function _throttle(fn) {
		var prev = Date.now();
		return function (e) {
			if((Date.now() - prev) < THROTTLE_THRESHOLD) return;
			fn.call(this, e);
			prev = Date.now();
		};
	}

	function _defaultEditor($td, column, item, onDone) {
		$('<input class="free-default-editor free"/>')
			.val(item[column['id']] || '')
			.on('keydown', function(e) {
				if(e.keyCode == 13) {  // submit
					onDone($(this).val());
				} else if(e.keyCode == 27) {  // cancel
					onDone();
				}
			})
			.on('blur', function(e) {
				onDone();  // cancel
			})
			.appendTo($td.empty())
			.select()
			.focus();
	}

	function _defaultFormatter(item, column, index) {
		return null == item[column['id']] ? '' : item[column['id']];
	}

	function makeThead(opts, columns) {
		var column, width, html = [];
		if(opts['selectable']) {
			html.push('<th class="free-table-selector"><input type="checkbox"/></th>')
		}
		var cssClass;
		var colMap = {};
		for(var i = 0, len = columns.length; i < len; i ++) {
			column = columns[i];
			if(null == column['id']) throw 'Each column must have an unique id';
			colMap[column['id']] = column;
			column['min_width'] = column['min_width'] || opts['minWidth'];
			if(column['width'] && column['min_width'] > column['width']) column['min_width'] = column['width'];
			width = column['width'] || column['min_width'];

			cssClass = '';
			if(column['hide']) cssClass += ' hide';
			if(column['editable']) {
				cssClass += ' editable';
				if(typeof column['editor'] !== 'function') column['editor'] = _defaultEditor;
			}
			if(typeof column['formatter'] !== 'function') column['formatter'] = _defaultFormatter;
			if(opts['enableColumnReorder']) cssClass += ' movable';

			cssClass = cssClass.trim();
			if(cssClass) cssClass = 'class=' + cssClass;
			html.push('<th ' + cssClass + ' x-id=' + column['id']
				+ ' width="' + width + 'px">'
				+ '<span class="text">' + column['name'] + '</span>'
				+ (opts['enableColumnResize'] ? '<span class="resize-handler"/>' : '')
				+ (column['sort'] ? '<span class="sort-handler"/>' : '')
				+ '</th>');
		}

		opts['colMap'] = colMap;
		return html.join('');
	}

	function makeTr(columns, item, index, opts) {
		var html = [];

		if(opts['selectable']) {
			html.push('<td class="free-table-selector"><input type="checkbox"/></td>');
		}

		var td, col, colId, text, formatter, cssClass;
		for(var i = 0, len = columns.length; i < len; i ++) {
			col = columns[i];
			colId = col['id'];
			text = col['formatter'](item, col, index) + '';  // conver to string

			td = col['escape'] ? $('<i/>').text(text).html() : text;
			cssClass = [];
			col['hide'] && cssClass.push('hide');
			col['editable'] && cssClass.push('editable');
			col['cssClass'] && cssClass.push(col['cssClass']);

			if(cssClass.length > 0) {
				td = '<td class="' + cssClass.join(' ') + '">' + td + '</td>';
			} else {
				td = '<td>' + td + '</td>';
			}
			html.push(td);
		}

		return '<tr>' + html.join('') + '</tr>';
	}

	function makeTbody(opts, items) {
		var columns = opts['columns'];
		var html = [];

		for(var i = 0, len = items.length; i < len; i ++) {
			html.push(makeTr(columns, items[i], i, opts));
		}

		return html;
	}

	function showPagination(opts, total) {
		opts.$pageBox.twbsPagination('destroy');
		var totalPages = Math.ceil(total / opts['pageSize']);
		opts.$pageBox.twbsPagination({
			'totalPages': totalPages,
			'visiblePages': 7,
			'hideOnlyOnePage': true,
			'initiateStartPageClick': false,
			'onPageClick': function(e, p){
				getPage(opts, false, p - 1);
			}
		}).show();
		showGoPage(opts, totalPages);
	}

	function gotoPage(opts, totalPages) {
		var $input = opts.$pageBox.find('input');
		if($input.hasClass('error')) $input.removeClass('error');
		var pageText = $input.val();
		var page = parseInt(pageText);
		if(isNaN(page) || page < 1 || page > totalPages) {
			free.message('Invalid page number. Max page: ' + totalPages, 'error');
			opts.$pageBox.find('input').addClass('error');
			return;
		}
		if(opts.$pageBox.twbsPagination('getCurrentPage') == page) return;
		opts.$pageBox.twbsPagination('show', page);
	}

	function showGoPage(opts, totalPages) {
		if(totalPages > 7) {
			opts.$pageBox.append('<div class="goto"><input class="free-input" type="number"/><button class="free-btn default">Go</button></div>')
			opts.$pageBox.find('.goto > button').on('click', function (e) {
				gotoPage(opts, totalPages);
			});
			opts.$pageBox.find('.goto > input').on('keydown', function(e) {
				if(e.keyCode === 13) gotoPage(opts, totalPages);
			});
			opts.$pageBox.find('.goto > input').on('focus', function(e) {
				$(this).removeClass('error');
			});
		} else {
			opts.$pageBox.find('.goto').remove();
		}
	}

	function makeTable(opts, items) {
        var $tbody = opts.$tableBox.find('tbody');
        $tbody.empty();

		if(items.length > 0) {
            $tbody.append(makeTbody(opts, items));
			$tbody.find('tr').each(function(index) {
				$(this).data('item', items[index]);
			});
		} else {
			opts.$pageBox.hide();
		}

		_clearCheckbox(opts.$tableBox);
		opts['sortType'] == 'client' && _clearSort(opts.$tableBox);
	}

	function getPage(opts, reloadNav, page) {
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

			_preprocess(items);
			opts.data = items;
			makeTable(opts, items);

			opts['info'] && updateInfo(opts, (page + 1), Math.ceil(total / opts['pageSize']), total);
			if(!pagination || total <= opts['pageSize']) opts.$pageBox.hide();
			else if(reloadNav) showPagination(opts, total);

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

	function _toggleColumns(opts, cols, type) {
		var $table = opts.$tableBox;
		var ths = [], tds = [];
		var hide = type == 'hide';
		for(var i = 0; i < cols.length; i ++) {
			var colId = cols[i], $col = $table.find('thead th[x-id=' + colId + ']');
			var colIdx = $col.index() + 1;
			opts.colMap[colId]['hide'] = hide;

			if(hide) {
				$col.addClass('hide');
				$table.find('tbody > tr > td:nth-child(' + colIdx + ')').addClass('hide');
			} else {
				$col.removeClass('hide');
				$table.find('tbody > tr > td:nth-child(' + colIdx + ')').removeClass('hide');
			}
		}

		_setTableWidth($table, opts);
	}

	function _bind($self, opts) {
		var $table = opts.$tableBox;

		if(opts['pagination']) {
			$('body').on('keydown', function(e) {
				if(e.ctrlKey) {
					var pageData = opts.$pageBox.data('twbs-pagination'), totalPages = pageData.options['totalPages'], currentPage = pageData.currentPage;
					if(totalPages == 1) return;
					if(e.which == 78) { // ctrl + N: next page
						currentPage < totalPages && opts.$pageBox.twbsPagination('show', currentPage + 1);
						return false;
					} else if(e.which == 80) {  // ctrl + P: previous page
						currentPage > 1 && opts.$pageBox.twbsPagination('show', currentPage - 1);
						return false;
					}
				}
			});
		}
		// selectable
		if(opts['selectable']) {
			$('body').on('keydown', function(e) {
				if($(e.target).is('body') && e.ctrlKey && e.which == 65) {  // ctrl + A: select all
					$table.find('th.free-table-selector input').prop('checked', true).change();
				}
			});
			function _getRows(first, second) {
				var min = Math.min(first, second), max = Math.max(first, second);
				var rows = $table.find('tbody > tr').slice(min, max + 1);
				var allSelected = true;
				for(var i = 0, len = rows.length; i < len; i ++) {
					if(!$(rows[i]).hasClass('selected')) {
						allSelected = false;
						break;
					}
				}

				return {
					'select': !allSelected,
					'rows': rows
				}
			}

			$table.find('th.free-table-selector > input').on('change', function() {
				var checked = $(this).prop('checked');
				$table.find('tbody td.free-table-selector > input').prop('checked', checked);
				checked ? $table.find('tbody tr').addClass('selected') : $table.find('tbody tr').removeClass('selected');
			});

			$table.on('click', 'thead .free-table-selector', function(e) {
				if($(e.target).is('input')) return;
				$(this).find('input').trigger('click');
			});

			$table.on('click', 'tbody .free-table-selector', function(e) {
				var $self = $(this), $target = $(e.target);
				var last = $table.find('th.free-table-selector').data('last-click');
				var $tr = $self.parent(), current = $tr.index();
				if(null != last && last != current && e.shiftKey) {
					var result = _getRows(last, current);
					if(result['select']) {
						$(result['rows']).addClass('selected');
						$(result['rows']).find('input').prop('checked', true);
					} else {
						$(result['rows']).removeClass('selected');
						$(result['rows']).find('input').prop('checked', false);
					}
				} else {
					$tr.toggleClass('selected');
					if(!$target.is('input')) {
						var $input = $self.find('input');
						$input.prop('checked', !$input.prop('checked'));
					}
				}

				var unSelected = $table.find('tbody tr:not(.selected)');
				$table.find('th.free-table-selector input').prop('checked', unSelected.length === 0);

				if(typeof opts['onSelectChange'] === 'function') {
					opts['onSelectChange']();
				}

				$table.find('th.free-table-selector').data('last-click', current);
			});
		}

		// hide & show columns
		if(opts['enableColumnHide']) {
			$table.find('thead').on('contextmenu', function(e) {
				e.preventDefault();
				$('.free-table-header-menu').remove();
				var $contextmenu = $('<div class="free-table-header-menu"></div>');
				$contextmenu.appendTo('body');
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
				$table.one('click', function(e) {
					$contextmenu.remove();
				});
				$contextmenu.on('change', '.item > input', function(e) {
					var colId = $(this).parent().attr('x-id');
					var col = $self.find('thead th[x-id=' + colId + ']');
					opts.colMap[colId]['hide'] = !$(this).prop('checked');
					var colIdx = col.index() + 1;

					var $tds = $self.find('tbody > tr > td:nth-child(' + colIdx + ')');
					col.toggleClass('hide');
					$tds.toggleClass('hide');
					_setTableWidth($table, opts);
				});
			});
		}

		// sort
		$table.on('click', 'thead > th > .sort-handler', function() {
			var $handler = $(this), colId = $handler.parent().attr('x-id');
			// sort-asc -> sort-desc
			if($handler.hasClass('sort-desc')) {
				$handler.removeClass('sort-desc').addClass('sort-asc');
				opts['sortType'] == 'client' ? _sort(opts, colId) : _sortInServer(opts, colId, 'asc');
			} else if($handler.hasClass('sort-asc')) {
				$handler.removeClass('sort-desc sort-asc')
				opts['sortType'] == 'client' ? _sort(opts, 'free-index') : _sortInServer(opts);
			} else {
				$table.find('thead > th > .sort-handler').removeClass('sort-asc sort-desc');
				$handler.addClass('sort-desc');
				opts['sortType'] == 'client' ? _sort(opts, colId, -1) : _sortInServer(opts, colId, 'desc');
			}
		});

		// drag & drop
		if(opts['enableColumnReorder']) {
			function next($th) {
				var $next = $th.next();
				while($next.length > 0 && $next.hasClass('hide')) $next = $next.next();
				return $next;
			}

			function prev($th) {
				var $prev = $th.prev();
				while($prev.length > 0 && ($prev.hasClass('hide') || $prev.hasClass('free-table-selector'))) $prev = $prev.prev();
				return $prev;
			}

			function update(info, $th) {
				var $prev = prev($th), $next = next($th), offset = $table.offset();

				info['prev'] = $prev;
				info['next'] = $next;
				info['left'] = $prev.length > 0 ? ($prev.offset()['left'] + ($prev.outerWidth() / 2) - offset['left']) : 0;
				info['right'] = $next.length > 0 ? ($next.offset()['left'] - offset['left']) : $table.outerWidth();
			}

			function reorderHandler(e) {
				var info = $table.find('thead').data('reorder-info');
				var $th = info['$th'];
				if(!$th.hasClass('moving')) $th.addClass('moving');
				var offsetLeft = info['offset']['left'] +  e.clientX - info['eX'] - info['tableOffset']['left'];
				if(offsetLeft < info['leftMost']) offsetLeft = info['leftMost'];
				if(offsetLeft > info['rightMost']) offsetLeft = info['rightMost'];

				var $prev = info['prev'], $next = info['next'];
				if(offsetLeft < info['left'] && $prev.length > 0) {
					$prev.before($th.detach());
					update(info, $th);
				} else if(offsetLeft > info['right'] && $next.length > 0) {
					$next.after($th.detach());
					update(info, $th);
				}

				$th.css('left', offsetLeft);
			}

			$table.find('thead > th.movable').on('mousedown', function(e) {
				if($(e.target).hasClass('sort-handler') || $(e.target).hasClass('resize-handler')) return;
				e.preventDefault();
				var $th = $(this);
				var info = {
					'$th': $th,
					'index': $th.index(),
					'eX': e.clientX,
					'eY': e.clientY,
					'tableOffset': $table.offset(),
					'offset': $th.offset(),
					'leftMost': -$th.outerWidth(),
					'rightMost': $table.outerWidth() + 10
				};
				update(info, $th);

				$th.parent().data('reorder-info', info);
				var moveHandler = _throttle(reorderHandler);
				$(document).on('mousemove', moveHandler);
				$(document).one('mouseup', function(e) {
					var $head = $table.find('thead'), info = $head.data('reorder-info');
					var $th = info['$th'], delta = info['delta'];

					_reorderColumn(opts, info['index'] - 1, $th.index() - 1);

					$head.data('reorder-info', null);
					$th.removeClass('moving');
					$(document).off('mousemove', moveHandler);
				});
			});
		}

		// resize column width
		if(opts['enableColumnResize']) {
			function resizeHandler(e) {
				var info = $table.find('thead').data('resize-info'),
					$th = info['$th'], minW = opts['colMap'][$th.attr('x-id')]['min_width'],
					x = e.clientX,
					delta = x - info['eX'];

				var w = info['width'] + delta;
				if(w < minW) w = minW;
				$th.width(w);
				$table.width(info['tableWidth'] + (w - info['width']));
				opts['info'] && opts.$infoBox.width(info['infoWidth'] + (w - info['width']));
			}

			$table.on('mousedown', 'thead > th > .resize-handler', function(e) {
				e.preventDefault();
				var $th = $(this).parent();
				$table.find('thead').data('resize-info', {
					'$th': $th,
					'width': $th.width(),
					'tableWidth': $table.width(),
					'infoWidth': opts.$infoBox.width(),
					'eX': e.clientX
				});
				var handler = _throttle(resizeHandler);
				$(document).on('mousemove', handler);
				$(document).one('mouseup', function(e) {
					$table.find('thead').data('resize-info', null);
					$(document).off('mousemove', handler);
				});
			});
		}

		// edit column
		$table.on('dblclick', 'td.editable', function(e) {
			var $td = $(this), index = $td.index(), colId = $table.find('thead > th').eq(index).attr('x-id'), column = opts['colMap'][colId], item = $td.parent().data('item');
			$td.addClass('editing');
			column['editor']($td, column, item, function(newValue) {
				if(null != newValue) {
					item[column['id']] = newValue;
					(typeof column['onSubmit'] === 'function') && column['onSubmit'](newValue, column, item);
				}
				$td.empty().append(column['formatter'](item, column, index)).removeClass('editing');
			});
		});
	}

	function _reorderColumn(opts, srcIndex, destIndex) {
		if(srcIndex === destIndex) return;
		var columns = opts['columns'], column = columns[srcIndex];
		columns.splice(srcIndex, 1);
		columns.splice(destIndex, 0, column);

		if(opts['selectable']) {
			srcIndex += 1;
			destIndex += 1;
		}
		opts.$tableBox.find('tbody > tr').each(function(index, tr) {
			var $tr = $(tr), $tds = $tr.find('td').detach(), $td = $tds[srcIndex];
			$tds.splice(srcIndex, 1);
			$tds.splice(destIndex, 0, $td);
			$(tr).empty().append($tds);
		});
	}

	function _sort(opts, colId, order) {
		order = order || 1;
		var $trs = opts.$tableBox.find('tbody > tr').detach();
		$trs.sort(function(a, b) {
			var da = $(a).data('item')[colId], db = $(b).data('item')[colId];
			if(typeof da === 'number' && typeof db === 'number') return order * (da - db);

			da += '';
			db += '';

			var result = 0;
			if(da < db) result =  -1;
			else if(da > db) result = 1;

			return result * order;
		});

		opts.$tableBox.find('tbody').append($trs);
	}

	function _sortInServer(opts, sortKey, sortType) {
		opts['params'] = opts['params'] || {};
		if(null == sortKey) {
			delete opts['params']['order-key'];
			delete opts['params']['order-type'];
		} else {
			opts['params']['order-key'] = sortKey;
			opts['params']['order-type'] = sortType;
		}

		getPage(opts, true);
	}

	function _preprocess(data) {
		for(var i = 0, len = data.length; i < len; i ++) {
			data[i]['free-index'] = i;  // add initial index to restore order
		}

		return data;
	}

	function _clearSort($table) {
		$table.find('th > .sort-handler').removeClass('sort-asc sort-desc');
	}

	function _clearCheckbox($table) {
		$table.find('th.free-table-selector input').prop('checked', false);
	}

	function _setTableWidth($table, opts) {
		var w = 0, columns = opts['columns'];

		if(opts.selectable) w += SELECT_BOX_WIDTH;
		for(var i = 0, len = columns.length; i < len; i ++) {
			if(!columns[i]['hide']) w += columns[i]['width'] || opts['minWidth'];
		}

		$table.css('width', w);
		opts.info && opts.$infoBox.css('width', w);
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

		_setTableWidth($tableBox, opts);
		$tableBox.find('thead').append(makeThead(opts, opts['columns']));
		if(opts.url) {
			getPage(opts, true);
		} else if(opts['data']) {
			makeTable(opts, _preprocess(opts['data']));
			opts['info'] && updateInfo(opts, 1, 1, opts['data'].length);
		}

		_bind($self, opts);

		return {
			'$self': $self,
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
				var $target = makeTr(opts['columns'], item, index, opts);
				if($tr.length === 0) {
					$tableBox.find('tbody').append($target);
				} else {
					$tr.before($target);
				}
				_clearCheckbox($tableBox);
			},
			'remove': function(index) {
				$tableBox.find('tbody tr:eq(' + index + ')').remove();
			},
			'setParams': function(ps) {
				opts.params = ps;
				getPage(opts, true);
				_clearSort(opts.$tableBox);  // force clear sort info
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
			},
			'clearSelect': function() {
				$tableBox.find('tr.selected').removeClass('selected');
				$tableBox.find('.free-table-selector input').prop('checked', false);
			},
			'destroyHeaderMenu': function() {
				$('.free-table-header-menu').remove();
			},
			'showColumns': function(cols) {
				_toggleColumns(opts, cols, 'show');
			},
			'hideColumns': function(cols) {
				_toggleColumns(opts, cols, 'hide');
			}
		};
	};
})(jQuery);
