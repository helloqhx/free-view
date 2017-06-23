(function($) {
	var PAGE_SIZE = 30;
	function makeThead(opts, columns) {
		var column, width, html = [];
		var w = 0;
		for(var i = 0, len = columns.length; i < len; i ++) {
			column = columns[i];
			width = column['width'];
			if(width) {
				html.push('<th width="' + width + 'px">' + column['name'] + '</th>');
			} else {
				html.push('<th>' + column['name'] + '</th>');
			}

			w += width || 100;
		}

		opts.$tableBox.css('width', w + 'px');
		opts.$infoBox.css('width', w + 'px');
		return html.join('');
	}

	function makeTr(columns, item) {
		var key, $td;
		var $tr = $('<tr></tr>');
		for(var i = 0, len = columns.length; i < len; i ++) {
			key = columns[i]['key'];
			$td = $('<td x-index="' + i + '"></td>');

			if($.isFunction(key)) {
				var text = key(item) + '';  // conver to string
				if(text.startsWith('<td') && text.endsWith('</td>')) {
                    $td = $(text);
                }else {
                    $td.text(text);
                }
			} else if(typeof key === 'string') {
				$td.text(item[key]);
			}

			$tr.append($td);
		}

		return $tr;
	}

	function makeTbody(columns, items) {
		var html = [];
		for(var i = 0, len = items.length; i < len; i ++) {
			html.push(makeTr(columns, items[i]));
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
            $tbody.append(makeTbody(opts['columns'], items));
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
			updateInfo(opts, (page + 1), Math.ceil(total / PAGE_SIZE), total);
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

	$.fn.table = function(options) {
		var $self = this;
		var $infoBox = $('<div class="info-box"><span class="page-info">第&nbsp;<span class="page-num">1</span>&nbsp;页，共&nbsp;<span class="page-sum"></span>&nbsp;页，</span>总共&nbsp;<span class="sum"></span>&nbsp;条数据</div>'),
			$tableBox = $('<div class="table-box"><table><thead></thead><tbody></tbody></table></div>'),
			$pageBox = $('<div class="page-box"></div>');

		var opts = {
			'pagination': false,
			'columns': [],  // name, width, key
			'url': '',
			'params': null,
			'data': [],
			'$infoBox': $infoBox,
			'$tableBox': $tableBox,
			'$pageBox': $pageBox,
            'onLoad': function(){}
		};

		$.extend(true, opts, options);

        // use original data not copied
        if(options.data) {
            opts.data = options.data;
        }

		$self.addClass('free-table-container').append($infoBox).append($tableBox);
		if(opts.pagination) $self.append($pageBox);
		else $infoBox.find('.page-info').hide();

		$tableBox.css('min-width', (opts['columns'].length * 100) + 'px');  // add min width
		$tableBox.find('thead').append(makeThead(opts, opts['columns']));
		if(opts.url) {
			getPage(opts, true);
		} else if(opts['data']) {
			makeTable(opts, opts['data']);
			updateInfo(opts, 1, 1, opts['data'].length);
		}

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
			}
		};
	};
})(jQuery);
