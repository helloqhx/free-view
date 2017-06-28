(function() {
    var _defaultTitle = {
        'success': '成功',
        'error': '错误',
        'info': '提示',
        'warn': '警告'
    };
    var _defaultDuration = 4000;
    var _html = {
        'container': '<div class="free-noty-container"/>',
        'icon': '<span class="free-noty-icon success"></span>',
        'box': '<div class="free-noty-box"/>',
        'title': '<div class="free-noty-title"/>',
        'content': '<div class="free-noty-content"/>',
        'close': '<span class="free-noty-close"></span>'
    };
    var $container;

    function _init() {
        $container = $(_html['container']).appendTo('body');
    }

    function _noty(obj) {
        if(!$container) _init();
        var $box = $(_html['box']).addClass(obj['type']);

        $(_html['icon']).addClass(obj['type']).appendTo($box);
        $(_html['title']).text(obj['title']).appendTo($box);
        $(_html['content']).text(obj['message']).appendTo($box);
        $(_html['close']).appendTo($box).on('click', function() {
            $box.remove();
        });

        $box.appendTo($container);
        setTimeout(function () {
            $box.remove();
        }, obj['duration']);
    }

    function _parse(type, args) {
        var obj = {
            'title': _defaultTitle[type] || _defaultTitle['info'],
            'message': args[0] || '',
            'duration': _defaultDuration,
            'type': type
        };

        if(args.length === 2) {
            if(typeof args[1] === 'number') {
                obj['duration'] = parseInt(args[1]);
            } else {
                obj['title'] = args[1] || obj['title'];
            }
        }

        if(args.length === 3) {
            obj['title'] = args[1] || obj['title'];
            obj['duration'] = parseInt(args[2]) || _defaultDuration;
        }

        return obj;
    }

    function success(message, title, duration) {
        _noty(_parse('success', arguments));
    }

    function error(message, title, duration) {
        _noty(_parse('error', arguments));
    }

    function warn(message, title, duration) {
        _noty(_parse('warn', arguments));
    }

    function info(message, title, duration) {
        _noty(_parse('info', arguments));
    }

    $.extend(true, window, {'free': {'noty': {
        'success': success,
        'info': info,
        'error': error,
        'warn': warn
    }}});
})();
