   jQuery(document).ready(function ($) {
            
            var jssor_1_options = {
              $ArrowNavigatorOptions: {
                $Class: $JssorArrowNavigator$
              },
              $ThumbnailNavigatorOptions: {
                $Class: $JssorThumbnailNavigator$,
                $Cols: 15,
                $SpacingX: 3,
                $SpacingY: 3,
                $Align: 455
              }
            };
            
            var jssor_1_slider = new $JssorSlider$("jssor_1", jssor_1_options);
            
            //responsive code begin
            //you can remove responsive code if you don't want the slider scales while window resizing
            function ScaleSlider() {
                var refSize = jssor_1_slider.$Elmt.parentNode.clientWidth;
                if (refSize) {
                    refSize = Math.min(refSize, 980);
                    jssor_1_slider.$ScaleWidth(refSize);
                }
                else {
                    window.setTimeout(ScaleSlider, 30);
                }
            }
            ScaleSlider();
            $(window).bind("load", ScaleSlider);
            $(window).bind("resize", ScaleSlider);
            $(window).bind("orientationchange", ScaleSlider);
            //responsive code end
        });

   /*
 * unfold.js â€“ usage : 
 * 
 * A click on the button element will show or hide every html element having "menu" as data-unfold-target value.
 * 
 * <button data-unfold-trigger="menu"> Display menu </button>
 * <div data-unfold-target="menu"> The menu is hereâ€¦ </div>
 * 
 * 
 * A click on the button element will show or hide every ul element inside the div#menu.
 * 
 * <button data-unfold-trigger="selector: #menu > ul"> Display menu </button>
 * <div id="menu"> <ul> â€¦ </ul> </div>
 * 
 * 
 * If targetted elements are shown, a class (.jq-unfold by default) will be added to the triggering element.
 * If targetted elements are hidedn, the class will be removed.
 * By default, every targetted elements will be hidden when the page is loaded.
 */

(function($) { 
    var jqUnfoldClass = 'jq-unfold'; // class added to triggering elements when targetted ones are shown
    var triggerDataAttr = 'data-unfold-trigger'; // data-tag for triggering elements
    var targetDataAttr = 'data-unfold-target'; // data-tag for targetted elements
    var selectorPrefix = 'selector:'; // selector prefix to target elements without using data-unfold-target

    jQuery.extend({
        unfold: {
            hideAll: function() {
                $('[' + triggerDataAttr + ']').each(function() {
                    $t = $(this);
                    var target = $t.attr(triggerDataAttr);
                    if (target.indexOf(selectorPrefix) == 0) {
                        var selector = target.substr(selectorPrefix.length).trim();
                        $(selector).hide();
                    } else {
                        var targets = target.trim().split(' ');
                        for (var i = 0; i < targets.length; ++i) {
                            $('[' + targetDataAttr + '="' + targets[i] + '"]').hide();
                        }
                    }
                });     
            }
        }
    });
    
$(window).load(function() {
    // Adding the click event to triggering elements
    $('[' + triggerDataAttr + ']').click(function() {
        // hideAll();
        $t = $(this);
        var target = $t.attr(triggerDataAttr);
        $('[' + triggerDataAttr + '="' + target + '"]').toggleClass(jqUnfoldClass, !$t.hasClass(jqUnfoldClass));

        // First behavior : by using a selector
        if (target.indexOf(selectorPrefix) == 0) {
            var selector = target.substr(selectorPrefix.length).trim();
            $(selector).toggle($t.hasClass(jqUnfoldClass));
        } 
        // Second behavior : by using a data-tag
        else {
            // it's possible to target multiple elements
            var targets = target.trim().split(' ');
            for (var i = 0; i < targets.length; ++i) {
                $('[' + targetDataAttr + '="' + targets[i] + '"]').toggle($t.hasClass(jqUnfoldClass));
            }
        }
    });
    
    // hideAll();

}); })(jQuery);