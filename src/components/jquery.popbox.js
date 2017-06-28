(function() {
    var _anchorH = 8;

    function _top($self, $content) {
        var offset = $self.offset(), width = $self.outerWidth(), height = $self.outerHeight();
        return {
            'top': offset['top'] - ($content.outerHeight() + _anchorH),
            'left': offset['left'] - ($content.outerWidth() - width) / 2
        };
    }

    function _right($self, $content) {
        var offset = $self.offset(), width = $self.outerWidth(), height = $self.outerHeight();
        return {
            'top': offset['top'] - ($content.outerHeight() - height) / 2,
            'left': offset['left'] + width + _anchorH
        };
    }

    function _left($self, $content) {
        var offset = $self.offset(), width = $self.outerWidth(), height = $self.outerHeight();
        return {
            'top': offset['top'] - ($content.outerHeight() - height) / 2,
            'left': offset['left'] - $content.outerWidth() - _anchorH
        };
    }

    function _bottom($self, $content) {
        var offset = $self.offset(), width = $self.outerWidth(), height = $self.outerHeight();
        return {
            'top': offset['top'] + height + _anchorH,
            'left': offset['left'] - ($content.outerWidth() - width) / 2
        };
    }

    var _html = {
        'warpper': '<div class="free-popbox-wrapper"/>',
        'container': '<div class="free-popbox-box"/>',
        'content': '<div class="free-popbox-content"/>',
        'anchor': '<div class="free-popbox-anchor"/>'
    };
    var _defaults = {
        'position': 'top',
        'content': '',
        'onClose': null
    };


    var _css = {
        'top': _top,
        'right': _right,
        'left': _left,
        'bottom': _bottom
    };

    var _css = {
        'top': _top,
        'right': _right,
        'left': _left,
        'bottom': _bottom
    };

    $.fn.popbox = function(config) {
        var opts = $.extend({}, _defaults, config);
        var _self = $(this);

        var $wrapper = $(_html['warpper']), $container = $(_html['container']),
            $content = $(_html['content']), $anchor = $(_html['anchor']);

        $container.append($content.html(opts['content'])).append($anchor);
        $wrapper.append($container).appendTo('body');
        $container.css(_css[opts['position']](_self, $content));
        $content.addClass(opts['position']);
        $anchor.addClass(opts['position']);

        setTimeout(function() {
            $('body').one('click', function(e) {
                close();
            });
        }, 0);

        $container.on('click', function() {
            return false;
        });

        var target = {
            'close': close,
            'repin': repin
        };

        function close() {
            if(typeof opts['onClose'] === 'function') opts['onClose'](target);
            $wrapper.remove();
        }

        function repin() {
            $container.css(_css[opts['position']](_self, $content));
        }

        if(typeof opts['onShow'] === 'function') opts['onShow'](target);

        return target;
    };
})();
