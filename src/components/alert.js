(function() {
    var _html = {
        'content': '<div class="free-alert-content" />',
        'buttons': '<div class="free-alert-btns"><button class="free-alert-ok">确定</button></div>'
    }
    var _defaults = {
        'title': '提示',
        'ok': null,
        'cancel': null
    };

    function alert(message) {
        var $footer = $(_html['buttons']);
        var $dialog = free.dialog({
            'title': '<div class="free-alert-title"><i class="icon"></i>提示</div>',
            'content': $(_html['content']).append(message || ''),
            'footer': $footer,
            'containerClass':'free-alert-box',
            'escClose': false,
            'blankClose': false
        });

        $footer.find('button.free-alert-ok').one('click', function() {
            $dialog.close();
        });
    }

    $.extend(true, window, {'free': {'alert': alert}});
})();
