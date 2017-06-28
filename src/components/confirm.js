(function() {
    var _html = {
        'title': '<div class="free-confirm-title"><i class="icon"></i></div>',
        'content': '<div class="free-confirm-content" />',
        'buttons': '<div class="free-confirm-btns"><button class="free-confirm-cancel">取消</button><button class="free-confirm-ok">确定</button></div>'
    }
    var _defaults = {
        'title': '提示',
        'content': '您确定这样做吗？',
        'ok': null,
        'cancel': null
    };

    function confirm(config) {
        var opts = $.extend({}, _defaults, config);
        var $footer = $(_html['buttons']);
        var $dialog = free.dialog({
            'title': $(_html['title']).append(opts['title']),
            'content': $(_html['content']).append(opts['content']),
            'footer': $footer,
            'escClose': false,
            'blankClose': false,
            'containerClass':'free-confirm-box',
            'onCloseBtnClick': function() {
                if(typeof opts['cancel'] === 'function') {
                    opts['cancel']();
                }
            }
        });

        $footer.find('button.free-confirm-ok').one('click', function() {
            $dialog.close();
            (typeof opts['ok'] === 'function') && opts['ok']();
        });
        
        $footer.find('button.free-confirm-cancel').one('click', function() {
            $dialog.close();
            (typeof opts['cancel'] === 'function') && opts['cancel']();
        });
    }

    $.extend(true, window, {'free': {'confirm': confirm}});
})();
