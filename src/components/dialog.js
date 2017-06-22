(function() {
    var _defaults = {
        'title': '',
        'content': '',
        'footer': '',
        'blankClose': false,
        'escClose': true,
        'onClose': null,
        'onCloseBtnClick': null,
        'containerClass': ''
    };

    var _html = {
        'wrapper': '<div class="free-dialog-wrapper v-center free-modal" />',
        'container': '<div class="free-dialog-container" />',
        'close': '<button class="free-dialog-close"><span class="close-x"></span></button>',
        'header': '<div class="free-dialog-header" />',
        'content': '<div class="free-dialog-content" />',
        'footer': '<div class="free-dialog-footer" />'
    };

    var opts = {};
    var $wrapper, $container, $closeBtn, $header, $content, $footer;

    function _init() {
        $wrapper = $(_html['wrapper']);
        $container = $(_html['container']);
        $closeBtn = $(_html['close']);
        $header = $(_html['header']).html(opts['title']);
        $content = $(_html['content']).html(opts['content']);
        $footer = $(_html['footer']);

        $content.css('max-height', $(window).height() - 200);
        $container.append($closeBtn).append($header).append($content).appendTo($wrapper);
        if(opts.footer) $container.append($footer.append(opts.footer));
        $wrapper.appendTo('body');

        if(opts['containerClass']) $container.addClass(opts['containerClass']);

        _bind(opts);
    }


    function _onkeydown(e) {
        if(e.which === 27){
            close();
        }
    }

    function _bind() {
        $closeBtn.on('click', function() {
            if(typeof opts['onCloseBtnClick'] === 'function') {
                opts['onCloseBtnClick']();
            }
            close();
        });

        if(opts.escClose) $('body').on('keydown', _onkeydown);
        if(opts.blankClose) {
            $wrapper.on('click', function(e) {
                if($(e.target).is('.free-dialog-wrapper')) close();
            });
        }
    }

    function _unbind() {
        if(opts.escClose) $('body').off('keydown', _onkeydown);
    }

    function close() {
        if(typeof opts['onClose'] === 'function') {
            opts['onClose']();
        }
        _unbind();
        $wrapper.remove();
    }

    function dialog(config) {
        opts = $.extend({}, _defaults, config);
        _init();

        $wrapper.show();
        $wrapper.close = close;

        return $wrapper;
    }

    $.extend(true, window, {'free': {
        'dialog': dialog
    }});
})();
