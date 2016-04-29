/**
 * @file
 * Attaches behavior for the Editor module.
 */

(function ($, Drupal, drupalSettings) {

  'use strict';

  /**
   * Finds the text area field associated with the given text format selector.
   *
   * @param {jQuery} $formatSelector
   *   A text format selector DOM element.
   *
   * @return {HTMLElement}
   *   The text area DOM element, if it was found.
   */
  function findFieldForFormatSelector($formatSelector) {
    var field_id = $formatSelector.attr('data-editor-for');
    // This selector will only find text areas in the top-level document. We do
    // not support attaching editors on text areas within iframes.
    return $('#' + field_id).get(0);
  }

  /**
   * Changes the text editor on a text area.
   *
   * @param {HTMLElement} field
   *   The text area DOM element.
   * @param {string} newFormatID
   *   The text format we're changing to; the text editor for the currently
   *   active text format will be detached, and the text editor for the new text
   *   format will be attached.
   */
  function changeTextEditor(field, newFormatID) {
    var previousFormatID = field.getAttribute('data-editor-active-text-format');

    // Detach the current editor (if any) and attach a new editor.
    if (drupalSettings.editor.formats[previousFormatID]) {
      Drupal.editorDetach(field, drupalSettings.editor.formats[previousFormatID]);
    }
    // When no text editor is currently active, stop tracking changes.
    else {
      $(field).off('.editor');
    }

    // Attach the new text editor (if any).
    if (drupalSettings.editor.formats[newFormatID]) {
      var format = drupalSettings.editor.formats[newFormatID];
      filterXssWhenSwitching(field, format, previousFormatID, Drupal.editorAttach);
    }

    // Store the new active format.
    field.setAttribute('data-editor-active-text-format', newFormatID);
  }

  /**
   * Handles changes in text format.
   *
   * @param {jQuery.Event} event
   *   The text format change event.
   */
  function onTextFormatChange(event) {
    var $select = $(event.target);
    var field = event.data.field;
    var activeFormatID = field.getAttribute('data-editor-active-text-format');
    var newFormatID = $select.val();

    // Prevent double-attaching if the change event is triggered manually.
    if (newFormatID === activeFormatID) {
      return;
    }

    // When changing to a text format that has a text editor associated
    // with it that supports content filtering, then first ask for
    // confirmation, because switching text formats might cause certain
    // markup to be stripped away.
    var supportContentFiltering = drupalSettings.editor.formats[newFormatID] && drupalSettings.editor.formats[newFormatID].editorSupportsContentFiltering;
    // If there is no content yet, it's always safe to change the text format.
    var hasContent = field.value !== '';
    if (hasContent && supportContentFiltering) {
      var message = Drupal.t('Changing the text format to %text_format will permanently remove content that is not allowed in that text format.<br><br>Save your changes before switching the text format to avoid losing data.', {
        '%text_format': $select.find('option:selected').text()
      });
      var confirmationDialog = Drupal.dialog('<div>' + message + '</div>', {
        title: Drupal.t('Change text format?'),
        dialogClass: 'editor-change-text-format-modal',
        resizable: false,
        buttons: [
          {
            text: Drupal.t('Continue'),
            class: 'button button--primary',
            click: function () {
              changeTextEditor(field, newFormatID);
              confirmationDialog.close();
            }
          },
          {
            text: Drupal.t('Cancel'),
            class: 'button',
            click: function () {
              // Restore the active format ID: cancel changing text format. We
              // cannot simply call event.preventDefault() because jQuery's
              // change event is only triggered after the change has already
              // been accepted.
              $select.val(activeFormatID);
              confirmationDialog.close();
            }
          }
        ],
        // Prevent this modal from being closed without the user making a choice
        // as per http://stackoverflow.com/a/5438771.
        closeOnEscape: false,
        create: function () {
          $(this).parent().find('.ui-dialog-titlebar-close').remove();
        },
        beforeClose: false,
        close: function (event) {
          // Automatically destroy the DOM element that was used for the dialog.
          $(event.target).remove();
        }
      });

      confirmationDialog.showModal();
    }
    else {
      changeTextEditor(field, newFormatID);
    }
  }

  /**
   * Initialize an empty object for editors to place their attachment code.
   *
   * @namespace
   */
  Drupal.editors = {};

  /**
   * Enables editors on text_format elements.
   *
   * @type {Drupal~behavior}
   *
   * @prop {Drupal~behaviorAttach} attach
   *   Attaches an editor to an input element.
   * @prop {Drupal~behaviorDetach} detach
   *   Detaches an editor from an input element.
   */
  Drupal.behaviors.editor = {
    attach: function (context, settings) {
      // If there are no editor settings, there are no editors to enable.
      if (!settings.editor) {
        return;
      }

      $(context).find('[data-editor-for]').once('editor').each(function () {
        var $this = $(this);
        var field = findFieldForFormatSelector($this);

        // Opt-out if no supported text area was found.
        if (!field) {
          return;
        }

        // Store the current active format.
        var activeFormatID = $this.val();
        field.setAttribute('data-editor-active-text-format', activeFormatID);

        // Directly attach this text editor, if the text format is enabled.
        if (settings.editor.formats[activeFormatID]) {
          // XSS protection for the current text format/editor is performed on
          // the server side, so we don't need to do anything special here.
          Drupal.editorAttach(field, settings.editor.formats[activeFormatID]);
        }
        // When there is no text editor for this text format, still track
        // changes, because the user has the ability to switch to some text
        // editor, otherwise this code would not be executed.
        $(field).on('change.editor keypress.editor', function () {
          field.setAttribute('data-editor-value-is-changed', 'true');
          // Just knowing that the value was changed is enough, stop tracking.
          $(field).off('.editor');
        });

        // Attach onChange handler to text format selector element.
        if ($this.is('select')) {
          $this.on('change.editorAttach', {field: field}, onTextFormatChange);
        }
        // Detach any editor when the containing form is submitted.
        $this.parents('form').on('submit', function (event) {
          // Do not detach if the event was canceled.
          if (event.isDefaultPrevented()) {
            return;
          }
          // Detach the current editor (if any).
          if (settings.editor.formats[activeFormatID]) {
            Drupal.editorDetach(field, settings.editor.formats[activeFormatID], 'serialize');
          }
        });
      });
    },

    detach: function (context, settings, trigger) {
      var editors;
      // The 'serialize' trigger indicates that we should simply update the
      // underlying element with the new text, without destroying the editor.
      if (trigger === 'serialize') {
        // Removing the editor-processed class guarantees that the editor will
        // be reattached. Only do this if we're planning to destroy the editor.
        editors = $(context).find('[data-editor-for]').findOnce('editor');
      }
      else {
        editors = $(context).find('[data-editor-for]').removeOnce('editor');
      }

      editors.each(function () {
        var $this = $(this);
        var activeFormatID = $this.val();
        var field = findFieldForFormatSelector($this);
        if (field && activeFormatID in settings.editor.formats) {
          Drupal.editorDetach(field, settings.editor.formats[activeFormatID], trigger);
        }
      });
    }
  };

  /**
   * Attaches editor behaviors to the field.
   *
   * @param {HTMLElement} field
   *   The textarea DOM element.
   * @param {object} format
   *   The text format that's being activated, from
   *   drupalSettings.editor.formats.
   *
   * @listens event:change
   *
   * @fires event:formUpdated
   */
  Drupal.editorAttach = function (field, format) {
    if (format.editor) {
      // Attach the text editor.
      Drupal.editors[format.editor].attach(field, format);

      // Ensures form.js' 'formUpdated' event is triggered even for changes that
      // happen within the text editor.
      Drupal.editors[format.editor].onChange(field, function () {
        $(field).trigger('formUpdated');

        // Keep track of changes, so we know what to do when switching text
        // formats and guaranteeing XSS protection.
        field.setAttribute('data-editor-value-is-changed', 'true');
      });
    }
  };

  /**
   * Detaches editor behaviors from the field.
   *
   * @param {HTMLElement} field
   *   The textarea DOM element.
   * @param {object} format
   *   The text format that's being activated, from
   *   drupalSettings.editor.formats.
   * @param {string} trigger
   *   Trigger value from the detach behavior.
   */
  Drupal.editorDetach = function (field, format, trigger) {
    if (format.editor) {
      Drupal.editors[format.editor].detach(field, format, trigger);

      // Restore the original value if the user didn't make any changes yet.
      if (field.getAttribute('data-editor-value-is-changed') === 'false') {
        field.value = field.getAttribute('data-editor-value-original');
      }
    }
  };

  /**
   * Filter away XSS attack vectors when switching text formats.
   *
   * @param {HTMLElement} field
   *   The textarea DOM element.
   * @param {object} format
   *   The text format that's being activated, from
   *   drupalSettings.editor.formats.
   * @param {string} originalFormatID
   *   The text format ID of the original text format.
   * @param {function} callback
   *   A callback to be called (with no parameters) after the field's value has
   *   been XSS filtered.
   */
  function filterXssWhenSwitching(field, format, originalFormatID, callback) {
    // A text editor that already is XSS-safe needs no additional measures.
    if (format.editor.isXssSafe) {
      callback(field, format);
    }
    // Otherwise, ensure XSS safety: let the server XSS filter this value.
    else {
      $.ajax({
        url: Drupal.url('editor/filter_xss/' + format.format),
        type: 'POST',
        data: {
          value: field.value,
          original_format_id: originalFormatID
        },
        dataType: 'json',
        success: function (xssFilteredValue) {
          // If the server returns false, then no XSS filtering is needed.
          if (xssFilteredValue !== false) {
            field.value = xssFilteredValue;
          }
          callback(field, format);
        }
      });
    }
  }

})(jQuery, Drupal, drupalSettings);
;
window.matchMedia||(window.matchMedia=function(){"use strict";var e=window.styleMedia||window.media;if(!e){var t=document.createElement("style"),i=document.getElementsByTagName("script")[0],n=null;t.type="text/css";t.id="matchmediajs-test";i.parentNode.insertBefore(t,i);n="getComputedStyle"in window&&window.getComputedStyle(t,null)||t.currentStyle;e={matchMedium:function(e){var i="@media "+e+"{ #matchmediajs-test { width: 1px; } }";if(t.styleSheet){t.styleSheet.cssText=i}else{t.textContent=i}return n.width==="1px"}}}return function(t){return{matches:e.matchMedium(t||"all"),media:t||"all"}}}());
;
/**
 * @file
 * CKEditor implementation of {@link Drupal.editors} API.
 */

(function (Drupal, debounce, CKEDITOR, $) {

  'use strict';

  /**
   * @namespace
   */
  Drupal.editors.ckeditor = {

    /**
     * Editor attach callback.
     *
     * @param {HTMLElement} element
     *   The element to attach the editor to.
     * @param {string} format
     *   The text format for the editor.
     *
     * @return {bool}
     *   Whether the call to `CKEDITOR.replace()` created an editor or not.
     */
    attach: function (element, format) {
      this._loadExternalPlugins(format);
      // Also pass settings that are Drupal-specific.
      format.editorSettings.drupal = {
        format: format.format
      };

      // Set a title on the CKEditor instance that includes the text field's
      // label so that screen readers say something that is understandable
      // for end users.
      var label = $('label[for=' + element.getAttribute('id') + ']').html();
      format.editorSettings.title = Drupal.t('Rich Text Editor, !label field', {'!label': label});

      return !!CKEDITOR.replace(element, format.editorSettings);
    },

    /**
     * Editor detach callback.
     *
     * @param {HTMLElement} element
     *   The element to detach the editor from.
     * @param {string} format
     *   The text format used for the editor.
     * @param {string} trigger
     *   The event trigger for the detach.
     *
     * @return {bool}
     *   Whether the call to `CKEDITOR.dom.element.get(element).getEditor()`
     *   found an editor or not.
     */
    detach: function (element, format, trigger) {
      var editor = CKEDITOR.dom.element.get(element).getEditor();
      if (editor) {
        if (trigger === 'serialize') {
          editor.updateElement();
        }
        else {
          editor.destroy();
          element.removeAttribute('contentEditable');
        }
      }
      return !!editor;
    },

    /**
     * Reacts on a change in the editor element.
     *
     * @param {HTMLElement} element
     *   The element where the change occured.
     * @param {function} callback
     *   Callback called with the value of the editor.
     *
     * @return {bool}
     *   Whether the call to `CKEDITOR.dom.element.get(element).getEditor()`
     *   found an editor or not.
     */
    onChange: function (element, callback) {
      var editor = CKEDITOR.dom.element.get(element).getEditor();
      if (editor) {
        editor.on('change', debounce(function () {
          callback(editor.getData());
        }, 400));
      }
      return !!editor;
    },

    /**
     * Attaches an inline editor to a DOM element.
     *
     * @param {HTMLElement} element
     *   The element to attach the editor to.
     * @param {object} format
     *   The text format used in the editor.
     * @param {string} [mainToolbarId]
     *   The id attribute for the main editor toolbar, if any.
     * @param {string} [floatedToolbarId]
     *   The id attribute for the floated editor toolbar, if any.
     *
     * @return {bool}
     *   Whether the call to `CKEDITOR.replace()` created an editor or not.
     */
    attachInlineEditor: function (element, format, mainToolbarId, floatedToolbarId) {
      this._loadExternalPlugins(format);
      // Also pass settings that are Drupal-specific.
      format.editorSettings.drupal = {
        format: format.format
      };

      var settings = $.extend(true, {}, format.editorSettings);

      // If a toolbar is already provided for "true WYSIWYG" (in-place editing),
      // then use that toolbar instead: override the default settings to render
      // CKEditor UI's top toolbar into mainToolbar, and don't render the bottom
      // toolbar at all. (CKEditor doesn't need a floated toolbar.)
      if (mainToolbarId) {
        var settingsOverride = {
          extraPlugins: 'sharedspace',
          removePlugins: 'floatingspace,elementspath',
          sharedSpaces: {
            top: mainToolbarId
          }
        };

        // Find the "Source" button, if any, and replace it with "Sourcedialog".
        // (The 'sourcearea' plugin only works in CKEditor's iframe mode.)
        var sourceButtonFound = false;
        for (var i = 0; !sourceButtonFound && i < settings.toolbar.length; i++) {
          if (settings.toolbar[i] !== '/') {
            for (var j = 0; !sourceButtonFound && j < settings.toolbar[i].items.length; j++) {
              if (settings.toolbar[i].items[j] === 'Source') {
                sourceButtonFound = true;
                // Swap sourcearea's "Source" button for sourcedialog's.
                settings.toolbar[i].items[j] = 'Sourcedialog';
                settingsOverride.extraPlugins += ',sourcedialog';
                settingsOverride.removePlugins += ',sourcearea';
              }
            }
          }
        }

        settings.extraPlugins += ',' + settingsOverride.extraPlugins;
        settings.removePlugins += ',' + settingsOverride.removePlugins;
        settings.sharedSpaces = settingsOverride.sharedSpaces;
      }

      // CKEditor requires an element to already have the contentEditable
      // attribute set to "true", otherwise it won't attach an inline editor.
      element.setAttribute('contentEditable', 'true');

      return !!CKEDITOR.inline(element, settings);
    },

    /**
     * Loads the required external plugins for the editor.
     *
     * @param {object} format
     *   The text format used in the editor.
     */
    _loadExternalPlugins: function (format) {
      var externalPlugins = format.editorSettings.drupalExternalPlugins;
      // Register and load additional CKEditor plugins as necessary.
      if (externalPlugins) {
        for (var pluginName in externalPlugins) {
          if (externalPlugins.hasOwnProperty(pluginName)) {
            CKEDITOR.plugins.addExternal(pluginName, externalPlugins[pluginName], '');
          }
        }
        delete format.editorSettings.drupalExternalPlugins;
      }
    }

  };

  Drupal.ckeditor = {

    /**
     * Variable storing the current dialog's save callback.
     *
     * @type {?function}
     */
    saveCallback: null,

    /**
     * Open a dialog for a Drupal-based plugin.
     *
     * This dynamically loads jQuery UI (if necessary) using the Drupal AJAX
     * framework, then opens a dialog at the specified Drupal path.
     *
     * @param {CKEditor} editor
     *   The CKEditor instance that is opening the dialog.
     * @param {string} url
     *   The URL that contains the contents of the dialog.
     * @param {object} existingValues
     *   Existing values that will be sent via POST to the url for the dialog
     *   contents.
     * @param {function} saveCallback
     *   A function to be called upon saving the dialog.
     * @param {object} dialogSettings
     *   An object containing settings to be passed to the jQuery UI.
     */
    openDialog: function (editor, url, existingValues, saveCallback, dialogSettings) {
      // Locate a suitable place to display our loading indicator.
      var $target = $(editor.container.$);
      if (editor.elementMode === CKEDITOR.ELEMENT_MODE_REPLACE) {
        $target = $target.find('.cke_contents');
      }

      // Remove any previous loading indicator.
      $target.css('position', 'relative').find('.ckeditor-dialog-loading').remove();

      // Add a consistent dialog class.
      var classes = dialogSettings.dialogClass ? dialogSettings.dialogClass.split(' ') : [];
      classes.push('ui-dialog--narrow');
      dialogSettings.dialogClass = classes.join(' ');
      dialogSettings.autoResize = window.matchMedia('(min-width: 600px)').matches;
      dialogSettings.width = 'auto';

      // Add a "Loading…" message, hide it underneath the CKEditor toolbar,
      // create a Drupal.Ajax instance to load the dialog and trigger it.
      var $content = $('<div class="ckeditor-dialog-loading"><span style="top: -40px;" class="ckeditor-dialog-loading-link">' + Drupal.t('Loading...') + '</span></div>');
      $content.appendTo($target);

      var ckeditorAjaxDialog = Drupal.ajax({
        dialog: dialogSettings,
        dialogType: 'modal',
        selector: '.ckeditor-dialog-loading-link',
        url: url,
        progress: {type: 'throbber'},
        submit: {
          editor_object: existingValues
        }
      });
      ckeditorAjaxDialog.execute();

      // After a short delay, show "Loading…" message.
      window.setTimeout(function () {
        $content.find('span').animate({top: '0px'});
      }, 1000);

      // Store the save callback to be executed when this dialog is closed.
      Drupal.ckeditor.saveCallback = saveCallback;
    }
  };

  // Moves the dialog to the top of the CKEDITOR stack.
  $(window).on('dialogcreate', function (e, dialog, $element, settings) {
    $('.ui-dialog--narrow').css('zIndex', CKEDITOR.config.baseFloatZIndex + 1);
  });

  // Respond to new dialogs that are opened by CKEditor, closing the AJAX loader.
  $(window).on('dialog:beforecreate', function (e, dialog, $element, settings) {
    $('.ckeditor-dialog-loading').animate({top: '-40px'}, function () {
      $(this).remove();
    });
  });

  // Respond to dialogs that are saved, sending data back to CKEditor.
  $(window).on('editor:dialogsave', function (e, values) {
    if (Drupal.ckeditor.saveCallback) {
      Drupal.ckeditor.saveCallback(values);
    }
  });

  // Respond to dialogs that are closed, removing the current save handler.
  $(window).on('dialog:afterclose', function (e, dialog, $element) {
    if (Drupal.ckeditor.saveCallback) {
      Drupal.ckeditor.saveCallback = null;
    }
  });

  // Set the CKEditor cache-busting string to the same value as Drupal.
  CKEDITOR.timestamp = drupalSettings.ckeditor.timestamp;

})(Drupal, Drupal.debounce, CKEDITOR, jQuery);
;
/*!
 * jQuery UI Sortable 1.11.4
 * http://jqueryui.com
 *
 * Copyright jQuery Foundation and other contributors
 * Released under the MIT license.
 * http://jquery.org/license
 *
 * http://api.jqueryui.com/sortable/
 */(function(e){typeof define=="function"&&define.amd?define(["jquery","./core","./mouse","./widget"],e):e(jQuery)})(function(e){return e.widget("ui.sortable",e.ui.mouse,{version:"1.11.4",widgetEventPrefix:"sort",ready:!1,options:{appendTo:"parent",axis:!1,connectWith:!1,containment:!1,cursor:"auto",cursorAt:!1,dropOnEmpty:!0,forcePlaceholderSize:!1,forceHelperSize:!1,grid:!1,handle:!1,helper:"original",items:"> *",opacity:!1,placeholder:!1,revert:!1,scroll:!0,scrollSensitivity:20,scrollSpeed:20,scope:"default",tolerance:"intersect",zIndex:1e3,activate:null,beforeStop:null,change:null,deactivate:null,out:null,over:null,receive:null,remove:null,sort:null,start:null,stop:null,update:null},_isOverAxis:function(e,t,n){return e>=t&&e<t+n},_isFloating:function(e){return/left|right/.test(e.css("float"))||/inline|table-cell/.test(e.css("display"))},_create:function(){this.containerCache={},this.element.addClass("ui-sortable"),this.refresh(),this.offset=this.element.offset(),this._mouseInit(),this._setHandleClassName(),this.ready=!0},_setOption:function(e,t){this._super(e,t),e==="handle"&&this._setHandleClassName()},_setHandleClassName:function(){this.element.find(".ui-sortable-handle").removeClass("ui-sortable-handle"),e.each(this.items,function(){(this.instance.options.handle?this.item.find(this.instance.options.handle):this.item).addClass("ui-sortable-handle")})},_destroy:function(){this.element.removeClass("ui-sortable ui-sortable-disabled").find(".ui-sortable-handle").removeClass("ui-sortable-handle"),this._mouseDestroy();for(var e=this.items.length-1;e>=0;e--)this.items[e].item.removeData(this.widgetName+"-item");return this},_mouseCapture:function(t,n){var r=null,i=!1,s=this;if(this.reverting)return!1;if(this.options.disabled||this.options.type==="static")return!1;this._refreshItems(t),e(t.target).parents().each(function(){if(e.data(this,s.widgetName+"-item")===s)return r=e(this),!1}),e.data(t.target,s.widgetName+"-item")===s&&(r=e(t.target));if(!r)return!1;if(this.options.handle&&!n){e(this.options.handle,r).find("*").addBack().each(function(){this===t.target&&(i=!0)});if(!i)return!1}return this.currentItem=r,this._removeCurrentsFromItems(),!0},_mouseStart:function(t,n,r){var i,s,o=this.options;this.currentContainer=this,this.refreshPositions(),this.helper=this._createHelper(t),this._cacheHelperProportions(),this._cacheMargins(),this.scrollParent=this.helper.scrollParent(),this.offset=this.currentItem.offset(),this.offset={top:this.offset.top-this.margins.top,left:this.offset.left-this.margins.left},e.extend(this.offset,{click:{left:t.pageX-this.offset.left,top:t.pageY-this.offset.top},parent:this._getParentOffset(),relative:this._getRelativeOffset()}),this.helper.css("position","absolute"),this.cssPosition=this.helper.css("position"),this.originalPosition=this._generatePosition(t),this.originalPageX=t.pageX,this.originalPageY=t.pageY,o.cursorAt&&this._adjustOffsetFromHelper(o.cursorAt),this.domPosition={prev:this.currentItem.prev()[0],parent:this.currentItem.parent()[0]},this.helper[0]!==this.currentItem[0]&&this.currentItem.hide(),this._createPlaceholder(),o.containment&&this._setContainment(),o.cursor&&o.cursor!=="auto"&&(s=this.document.find("body"),this.storedCursor=s.css("cursor"),s.css("cursor",o.cursor),this.storedStylesheet=e("<style>*{ cursor: "+o.cursor+" !important; }</style>").appendTo(s)),o.opacity&&(this.helper.css("opacity")&&(this._storedOpacity=this.helper.css("opacity")),this.helper.css("opacity",o.opacity)),o.zIndex&&(this.helper.css("zIndex")&&(this._storedZIndex=this.helper.css("zIndex")),this.helper.css("zIndex",o.zIndex)),this.scrollParent[0]!==this.document[0]&&this.scrollParent[0].tagName!=="HTML"&&(this.overflowOffset=this.scrollParent.offset()),this._trigger("start",t,this._uiHash()),this._preserveHelperProportions||this._cacheHelperProportions();if(!r)for(i=this.containers.length-1;i>=0;i--)this.containers[i]._trigger("activate",t,this._uiHash(this));return e.ui.ddmanager&&(e.ui.ddmanager.current=this),e.ui.ddmanager&&!o.dropBehaviour&&e.ui.ddmanager.prepareOffsets(this,t),this.dragging=!0,this.helper.addClass("ui-sortable-helper"),this._mouseDrag(t),!0},_mouseDrag:function(t){var n,r,i,s,o=this.options,u=!1;this.position=this._generatePosition(t),this.positionAbs=this._convertPositionTo("absolute"),this.lastPositionAbs||(this.lastPositionAbs=this.positionAbs),this.options.scroll&&(this.scrollParent[0]!==this.document[0]&&this.scrollParent[0].tagName!=="HTML"?(this.overflowOffset.top+this.scrollParent[0].offsetHeight-t.pageY<o.scrollSensitivity?this.scrollParent[0].scrollTop=u=this.scrollParent[0].scrollTop+o.scrollSpeed:t.pageY-this.overflowOffset.top<o.scrollSensitivity&&(this.scrollParent[0].scrollTop=u=this.scrollParent[0].scrollTop-o.scrollSpeed),this.overflowOffset.left+this.scrollParent[0].offsetWidth-t.pageX<o.scrollSensitivity?this.scrollParent[0].scrollLeft=u=this.scrollParent[0].scrollLeft+o.scrollSpeed:t.pageX-this.overflowOffset.left<o.scrollSensitivity&&(this.scrollParent[0].scrollLeft=u=this.scrollParent[0].scrollLeft-o.scrollSpeed)):(t.pageY-this.document.scrollTop()<o.scrollSensitivity?u=this.document.scrollTop(this.document.scrollTop()-o.scrollSpeed):this.window.height()-(t.pageY-this.document.scrollTop())<o.scrollSensitivity&&(u=this.document.scrollTop(this.document.scrollTop()+o.scrollSpeed)),t.pageX-this.document.scrollLeft()<o.scrollSensitivity?u=this.document.scrollLeft(this.document.scrollLeft()-o.scrollSpeed):this.window.width()-(t.pageX-this.document.scrollLeft())<o.scrollSensitivity&&(u=this.document.scrollLeft(this.document.scrollLeft()+o.scrollSpeed))),u!==!1&&e.ui.ddmanager&&!o.dropBehaviour&&e.ui.ddmanager.prepareOffsets(this,t)),this.positionAbs=this._convertPositionTo("absolute");if(!this.options.axis||this.options.axis!=="y")this.helper[0].style.left=this.position.left+"px";if(!this.options.axis||this.options.axis!=="x")this.helper[0].style.top=this.position.top+"px";for(n=this.items.length-1;n>=0;n--){r=this.items[n],i=r.item[0],s=this._intersectsWithPointer(r);if(!s)continue;if(r.instance!==this.currentContainer)continue;if(i!==this.currentItem[0]&&this.placeholder[s===1?"next":"prev"]()[0]!==i&&!e.contains(this.placeholder[0],i)&&(this.options.type==="semi-dynamic"?!e.contains(this.element[0],i):!0)){this.direction=s===1?"down":"up";if(this.options.tolerance!=="pointer"&&!this._intersectsWithSides(r))break;this._rearrange(t,r),this._trigger("change",t,this._uiHash());break}}return this._contactContainers(t),e.ui.ddmanager&&e.ui.ddmanager.drag(this,t),this._trigger("sort",t,this._uiHash()),this.lastPositionAbs=this.positionAbs,!1},_mouseStop:function(t,n){if(!t)return;e.ui.ddmanager&&!this.options.dropBehaviour&&e.ui.ddmanager.drop(this,t);if(this.options.revert){var r=this,i=this.placeholder.offset(),s=this.options.axis,o={};if(!s||s==="x")o.left=i.left-this.offset.parent.left-this.margins.left+(this.offsetParent[0]===this.document[0].body?0:this.offsetParent[0].scrollLeft);if(!s||s==="y")o.top=i.top-this.offset.parent.top-this.margins.top+(this.offsetParent[0]===this.document[0].body?0:this.offsetParent[0].scrollTop);this.reverting=!0,e(this.helper).animate(o,parseInt(this.options.revert,10)||500,function(){r._clear(t)})}else this._clear(t,n);return!1},cancel:function(){if(this.dragging){this._mouseUp({target:null}),this.options.helper==="original"?this.currentItem.css(this._storedCSS).removeClass("ui-sortable-helper"):this.currentItem.show();for(var t=this.containers.length-1;t>=0;t--)this.containers[t]._trigger("deactivate",null,this._uiHash(this)),this.containers[t].containerCache.over&&(this.containers[t]._trigger("out",null,this._uiHash(this)),this.containers[t].containerCache.over=0)}return this.placeholder&&(this.placeholder[0].parentNode&&this.placeholder[0].parentNode.removeChild(this.placeholder[0]),this.options.helper!=="original"&&this.helper&&this.helper[0].parentNode&&this.helper.remove(),e.extend(this,{helper:null,dragging:!1,reverting:!1,_noFinalSort:null}),this.domPosition.prev?e(this.domPosition.prev).after(this.currentItem):e(this.domPosition.parent).prepend(this.currentItem)),this},serialize:function(t){var n=this._getItemsAsjQuery(t&&t.connected),r=[];return t=t||{},e(n).each(function(){var n=(e(t.item||this).attr(t.attribute||"id")||"").match(t.expression||/(.+)[\-=_](.+)/);n&&r.push((t.key||n[1]+"[]")+"="+(t.key&&t.expression?n[1]:n[2]))}),!r.length&&t.key&&r.push(t.key+"="),r.join("&")},toArray:function(t){var n=this._getItemsAsjQuery(t&&t.connected),r=[];return t=t||{},n.each(function(){r.push(e(t.item||this).attr(t.attribute||"id")||"")}),r},_intersectsWith:function(e){var t=this.positionAbs.left,n=t+this.helperProportions.width,r=this.positionAbs.top,i=r+this.helperProportions.height,s=e.left,o=s+e.width,u=e.top,a=u+e.height,f=this.offset.click.top,l=this.offset.click.left,c=this.options.axis==="x"||r+f>u&&r+f<a,h=this.options.axis==="y"||t+l>s&&t+l<o,p=c&&h;return this.options.tolerance==="pointer"||this.options.forcePointerForContainers||this.options.tolerance!=="pointer"&&this.helperProportions[this.floating?"width":"height"]>e[this.floating?"width":"height"]?p:s<t+this.helperProportions.width/2&&n-this.helperProportions.width/2<o&&u<r+this.helperProportions.height/2&&i-this.helperProportions.height/2<a},_intersectsWithPointer:function(e){var t=this.options.axis==="x"||this._isOverAxis(this.positionAbs.top+this.offset.click.top,e.top,e.height),n=this.options.axis==="y"||this._isOverAxis(this.positionAbs.left+this.offset.click.left,e.left,e.width),r=t&&n,i=this._getDragVerticalDirection(),s=this._getDragHorizontalDirection();return r?this.floating?s&&s==="right"||i==="down"?2:1:i&&(i==="down"?2:1):!1},_intersectsWithSides:function(e){var t=this._isOverAxis(this.positionAbs.top+this.offset.click.top,e.top+e.height/2,e.height),n=this._isOverAxis(this.positionAbs.left+this.offset.click.left,e.left+e.width/2,e.width),r=this._getDragVerticalDirection(),i=this._getDragHorizontalDirection();return this.floating&&i?i==="right"&&n||i==="left"&&!n:r&&(r==="down"&&t||r==="up"&&!t)},_getDragVerticalDirection:function(){var e=this.positionAbs.top-this.lastPositionAbs.top;return e!==0&&(e>0?"down":"up")},_getDragHorizontalDirection:function(){var e=this.positionAbs.left-this.lastPositionAbs.left;return e!==0&&(e>0?"right":"left")},refresh:function(e){return this._refreshItems(e),this._setHandleClassName(),this.refreshPositions(),this},_connectWith:function(){var e=this.options;return e.connectWith.constructor===String?[e.connectWith]:e.connectWith},_getItemsAsjQuery:function(t){function f(){o.push(this)}var n,r,i,s,o=[],u=[],a=this._connectWith();if(a&&t)for(n=a.length-1;n>=0;n--){i=e(a[n],this.document[0]);for(r=i.length-1;r>=0;r--)s=e.data(i[r],this.widgetFullName),s&&s!==this&&!s.options.disabled&&u.push([e.isFunction(s.options.items)?s.options.items.call(s.element):e(s.options.items,s.element).not(".ui-sortable-helper").not(".ui-sortable-placeholder"),s])}u.push([e.isFunction(this.options.items)?this.options.items.call(this.element,null,{options:this.options,item:this.currentItem}):e(this.options.items,this.element).not(".ui-sortable-helper").not(".ui-sortable-placeholder"),this]);for(n=u.length-1;n>=0;n--)u[n][0].each(f);return e(o)},_removeCurrentsFromItems:function(){var t=this.currentItem.find(":data("+this.widgetName+"-item)");this.items=e.grep(this.items,function(e){for(var n=0;n<t.length;n++)if(t[n]===e.item[0])return!1;return!0})},_refreshItems:function(t){this.items=[],this.containers=[this];var n,r,i,s,o,u,a,f,l=this.items,c=[[e.isFunction(this.options.items)?this.options.items.call(this.element[0],t,{item:this.currentItem}):e(this.options.items,this.element),this]],h=this._connectWith();if(h&&this.ready)for(n=h.length-1;n>=0;n--){i=e(h[n],this.document[0]);for(r=i.length-1;r>=0;r--)s=e.data(i[r],this.widgetFullName),s&&s!==this&&!s.options.disabled&&(c.push([e.isFunction(s.options.items)?s.options.items.call(s.element[0],t,{item:this.currentItem}):e(s.options.items,s.element),s]),this.containers.push(s))}for(n=c.length-1;n>=0;n--){o=c[n][1],u=c[n][0];for(r=0,f=u.length;r<f;r++)a=e(u[r]),a.data(this.widgetName+"-item",o),l.push({item:a,instance:o,width:0,height:0,left:0,top:0})}},refreshPositions:function(t){this.floating=this.items.length?this.options.axis==="x"||this._isFloating(this.items[0].item):!1,this.offsetParent&&this.helper&&(this.offset.parent=this._getParentOffset());var n,r,i,s;for(n=this.items.length-1;n>=0;n--){r=this.items[n];if(r.instance!==this.currentContainer&&this.currentContainer&&r.item[0]!==this.currentItem[0])continue;i=this.options.toleranceElement?e(this.options.toleranceElement,r.item):r.item,t||(r.width=i.outerWidth(),r.height=i.outerHeight()),s=i.offset(),r.left=s.left,r.top=s.top}if(this.options.custom&&this.options.custom.refreshContainers)this.options.custom.refreshContainers.call(this);else for(n=this.containers.length-1;n>=0;n--)s=this.containers[n].element.offset(),this.containers[n].containerCache.left=s.left,this.containers[n].containerCache.top=s.top,this.containers[n].containerCache.width=this.containers[n].element.outerWidth(),this.containers[n].containerCache.height=this.containers[n].element.outerHeight();return this},_createPlaceholder:function(t){t=t||this;var n,r=t.options;if(!r.placeholder||r.placeholder.constructor===String)n=r.placeholder,r.placeholder={element:function(){var r=t.currentItem[0].nodeName.toLowerCase(),i=e("<"+r+">",t.document[0]).addClass(n||t.currentItem[0].className+" ui-sortable-placeholder").removeClass("ui-sortable-helper");return r==="tbody"?t._createTrPlaceholder(t.currentItem.find("tr").eq(0),e("<tr>",t.document[0]).appendTo(i)):r==="tr"?t._createTrPlaceholder(t.currentItem,i):r==="img"&&i.attr("src",t.currentItem.attr("src")),n||i.css("visibility","hidden"),i},update:function(e,i){if(n&&!r.forcePlaceholderSize)return;i.height()||i.height(t.currentItem.innerHeight()-parseInt(t.currentItem.css("paddingTop")||0,10)-parseInt(t.currentItem.css("paddingBottom")||0,10)),i.width()||i.width(t.currentItem.innerWidth()-parseInt(t.currentItem.css("paddingLeft")||0,10)-parseInt(t.currentItem.css("paddingRight")||0,10))}};t.placeholder=e(r.placeholder.element.call(t.element,t.currentItem)),t.currentItem.after(t.placeholder),r.placeholder.update(t,t.placeholder)},_createTrPlaceholder:function(t,n){var r=this;t.children().each(function(){e("<td>&#160;</td>",r.document[0]).attr("colspan",e(this).attr("colspan")||1).appendTo(n)})},_contactContainers:function(t){var n,r,i,s,o,u,a,f,l,c,h=null,p=null;for(n=this.containers.length-1;n>=0;n--){if(e.contains(this.currentItem[0],this.containers[n].element[0]))continue;if(this._intersectsWith(this.containers[n].containerCache)){if(h&&e.contains(this.containers[n].element[0],h.element[0]))continue;h=this.containers[n],p=n}else this.containers[n].containerCache.over&&(this.containers[n]._trigger("out",t,this._uiHash(this)),this.containers[n].containerCache.over=0)}if(!h)return;if(this.containers.length===1)this.containers[p].containerCache.over||(this.containers[p]._trigger("over",t,this._uiHash(this)),this.containers[p].containerCache.over=1);else{i=1e4,s=null,l=h.floating||this._isFloating(this.currentItem),o=l?"left":"top",u=l?"width":"height",c=l?"clientX":"clientY";for(r=this.items.length-1;r>=0;r--){if(!e.contains(this.containers[p].element[0],this.items[r].item[0]))continue;if(this.items[r].item[0]===this.currentItem[0])continue;a=this.items[r].item.offset()[o],f=!1,t[c]-a>this.items[r][u]/2&&(f=!0),Math.abs(t[c]-a)<i&&(i=Math.abs(t[c]-a),s=this.items[r],this.direction=f?"up":"down")}if(!s&&!this.options.dropOnEmpty)return;if(this.currentContainer===this.containers[p]){this.currentContainer.containerCache.over||(this.containers[p]._trigger("over",t,this._uiHash()),this.currentContainer.containerCache.over=1);return}s?this._rearrange(t,s,null,!0):this._rearrange(t,null,this.containers[p].element,!0),this._trigger("change",t,this._uiHash()),this.containers[p]._trigger("change",t,this._uiHash(this)),this.currentContainer=this.containers[p],this.options.placeholder.update(this.currentContainer,this.placeholder),this.containers[p]._trigger("over",t,this._uiHash(this)),this.containers[p].containerCache.over=1}},_createHelper:function(t){var n=this.options,r=e.isFunction(n.helper)?e(n.helper.apply(this.element[0],[t,this.currentItem])):n.helper==="clone"?this.currentItem.clone():this.currentItem;return r.parents("body").length||e(n.appendTo!=="parent"?n.appendTo:this.currentItem[0].parentNode)[0].appendChild(r[0]),r[0]===this.currentItem[0]&&(this._storedCSS={width:this.currentItem[0].style.width,height:this.currentItem[0].style.height,position:this.currentItem.css("position"),top:this.currentItem.css("top"),left:this.currentItem.css("left")}),(!r[0].style.width||n.forceHelperSize)&&r.width(this.currentItem.width()),(!r[0].style.height||n.forceHelperSize)&&r.height(this.currentItem.height()),r},_adjustOffsetFromHelper:function(t){typeof t=="string"&&(t=t.split(" ")),e.isArray(t)&&(t={left:+t[0],top:+t[1]||0}),"left"in t&&(this.offset.click.left=t.left+this.margins.left),"right"in t&&(this.offset.click.left=this.helperProportions.width-t.right+this.margins.left),"top"in t&&(this.offset.click.top=t.top+this.margins.top),"bottom"in t&&(this.offset.click.top=this.helperProportions.height-t.bottom+this.margins.top)},_getParentOffset:function(){this.offsetParent=this.helper.offsetParent();var t=this.offsetParent.offset();this.cssPosition==="absolute"&&this.scrollParent[0]!==this.document[0]&&e.contains(this.scrollParent[0],this.offsetParent[0])&&(t.left+=this.scrollParent.scrollLeft(),t.top+=this.scrollParent.scrollTop());if(this.offsetParent[0]===this.document[0].body||this.offsetParent[0].tagName&&this.offsetParent[0].tagName.toLowerCase()==="html"&&e.ui.ie)t={top:0,left:0};return{top:t.top+(parseInt(this.offsetParent.css("borderTopWidth"),10)||0),left:t.left+(parseInt(this.offsetParent.css("borderLeftWidth"),10)||0)}},_getRelativeOffset:function(){if(this.cssPosition==="relative"){var e=this.currentItem.position();return{top:e.top-(parseInt(this.helper.css("top"),10)||0)+this.scrollParent.scrollTop(),left:e.left-(parseInt(this.helper.css("left"),10)||0)+this.scrollParent.scrollLeft()}}return{top:0,left:0}},_cacheMargins:function(){this.margins={left:parseInt(this.currentItem.css("marginLeft"),10)||0,top:parseInt(this.currentItem.css("marginTop"),10)||0}},_cacheHelperProportions:function(){this.helperProportions={width:this.helper.outerWidth(),height:this.helper.outerHeight()}},_setContainment:function(){var t,n,r,i=this.options;i.containment==="parent"&&(i.containment=this.helper[0].parentNode);if(i.containment==="document"||i.containment==="window")this.containment=[0-this.offset.relative.left-this.offset.parent.left,0-this.offset.relative.top-this.offset.parent.top,i.containment==="document"?this.document.width():this.window.width()-this.helperProportions.width-this.margins.left,(i.containment==="document"?this.document.width():this.window.height()||this.document[0].body.parentNode.scrollHeight)-this.helperProportions.height-this.margins.top];/^(document|window|parent)$/.test(i.containment)||(t=e(i.containment)[0],n=e(i.containment).offset(),r=e(t).css("overflow")!=="hidden",this.containment=[n.left+(parseInt(e(t).css("borderLeftWidth"),10)||0)+(parseInt(e(t).css("paddingLeft"),10)||0)-this.margins.left,n.top+(parseInt(e(t).css("borderTopWidth"),10)||0)+(parseInt(e(t).css("paddingTop"),10)||0)-this.margins.top,n.left+(r?Math.max(t.scrollWidth,t.offsetWidth):t.offsetWidth)-(parseInt(e(t).css("borderLeftWidth"),10)||0)-(parseInt(e(t).css("paddingRight"),10)||0)-this.helperProportions.width-this.margins.left,n.top+(r?Math.max(t.scrollHeight,t.offsetHeight):t.offsetHeight)-(parseInt(e(t).css("borderTopWidth"),10)||0)-(parseInt(e(t).css("paddingBottom"),10)||0)-this.helperProportions.height-this.margins.top])},_convertPositionTo:function(t,n){n||(n=this.position);var r=t==="absolute"?1:-1,i=this.cssPosition!=="absolute"||this.scrollParent[0]!==this.document[0]&&!!e.contains(this.scrollParent[0],this.offsetParent[0])?this.scrollParent:this.offsetParent,s=/(html|body)/i.test(i[0].tagName);return{top:n.top+this.offset.relative.top*r+this.offset.parent.top*r-(this.cssPosition==="fixed"?-this.scrollParent.scrollTop():s?0:i.scrollTop())*r,left:n.left+this.offset.relative.left*r+this.offset.parent.left*r-(this.cssPosition==="fixed"?-this.scrollParent.scrollLeft():s?0:i.scrollLeft())*r}},_generatePosition:function(t){var n,r,i=this.options,s=t.pageX,o=t.pageY,u=this.cssPosition!=="absolute"||this.scrollParent[0]!==this.document[0]&&!!e.contains(this.scrollParent[0],this.offsetParent[0])?this.scrollParent:this.offsetParent,a=/(html|body)/i.test(u[0].tagName);return this.cssPosition==="relative"&&(this.scrollParent[0]===this.document[0]||this.scrollParent[0]===this.offsetParent[0])&&(this.offset.relative=this._getRelativeOffset()),this.originalPosition&&(this.containment&&(t.pageX-this.offset.click.left<this.containment[0]&&(s=this.containment[0]+this.offset.click.left),t.pageY-this.offset.click.top<this.containment[1]&&(o=this.containment[1]+this.offset.click.top),t.pageX-this.offset.click.left>this.containment[2]&&(s=this.containment[2]+this.offset.click.left),t.pageY-this.offset.click.top>this.containment[3]&&(o=this.containment[3]+this.offset.click.top)),i.grid&&(n=this.originalPageY+Math.round((o-this.originalPageY)/i.grid[1])*i.grid[1],o=this.containment?n-this.offset.click.top>=this.containment[1]&&n-this.offset.click.top<=this.containment[3]?n:n-this.offset.click.top>=this.containment[1]?n-i.grid[1]:n+i.grid[1]:n,r=this.originalPageX+Math.round((s-this.originalPageX)/i.grid[0])*i.grid[0],s=this.containment?r-this.offset.click.left>=this.containment[0]&&r-this.offset.click.left<=this.containment[2]?r:r-this.offset.click.left>=this.containment[0]?r-i.grid[0]:r+i.grid[0]:r)),{top:o-this.offset.click.top-this.offset.relative.top-this.offset.parent.top+(this.cssPosition==="fixed"?-this.scrollParent.scrollTop():a?0:u.scrollTop()),left:s-this.offset.click.left-this.offset.relative.left-this.offset.parent.left+(this.cssPosition==="fixed"?-this.scrollParent.scrollLeft():a?0:u.scrollLeft())}},_rearrange:function(e,t,n,r){n?n[0].appendChild(this.placeholder[0]):t.item[0].parentNode.insertBefore(this.placeholder[0],this.direction==="down"?t.item[0]:t.item[0].nextSibling),this.counter=this.counter?++this.counter:1;var i=this.counter;this._delay(function(){i===this.counter&&this.refreshPositions(!r)})},_clear:function(e,t){function i(e,t,n){return function(r){n._trigger(e,r,t._uiHash(t))}}this.reverting=!1;var n,r=[];!this._noFinalSort&&this.currentItem.parent().length&&this.placeholder.before(this.currentItem),this._noFinalSort=null;if(this.helper[0]===this.currentItem[0]){for(n in this._storedCSS)if(this._storedCSS[n]==="auto"||this._storedCSS[n]==="static")this._storedCSS[n]="";this.currentItem.css(this._storedCSS).removeClass("ui-sortable-helper")}else this.currentItem.show();this.fromOutside&&!t&&r.push(function(e){this._trigger("receive",e,this._uiHash(this.fromOutside))}),(this.fromOutside||this.domPosition.prev!==this.currentItem.prev().not(".ui-sortable-helper")[0]||this.domPosition.parent!==this.currentItem.parent()[0])&&!t&&r.push(function(e){this._trigger("update",e,this._uiHash())}),this!==this.currentContainer&&(t||(r.push(function(e){this._trigger("remove",e,this._uiHash())}),r.push(function(e){return function(t){e._trigger("receive",t,this._uiHash(this))}}.call(this,this.currentContainer)),r.push(function(e){return function(t){e._trigger("update",t,this._uiHash(this))}}.call(this,this.currentContainer))));for(n=this.containers.length-1;n>=0;n--)t||r.push(i("deactivate",this,this.containers[n])),this.containers[n].containerCache.over&&(r.push(i("out",this,this.containers[n])),this.containers[n].containerCache.over=0);this.storedCursor&&(this.document.find("body").css("cursor",this.storedCursor),this.storedStylesheet.remove()),this._storedOpacity&&this.helper.css("opacity",this._storedOpacity),this._storedZIndex&&this.helper.css("zIndex",this._storedZIndex==="auto"?"":this._storedZIndex),this.dragging=!1,t||this._trigger("beforeStop",e,this._uiHash()),this.placeholder[0].parentNode.removeChild(this.placeholder[0]),this.cancelHelperRemoval||(this.helper[0]!==this.currentItem[0]&&this.helper.remove(),this.helper=null);if(!t){for(n=0;n<r.length;n++)r[n].call(this,e);this._trigger("stop",e,this._uiHash())}return this.fromOutside=!1,!this.cancelHelperRemoval},_trigger:function(){e.Widget.prototype._trigger.apply(this,arguments)===!1&&this.cancel()},_uiHash:function(t){var n=t||this;return{helper:n.helper,placeholder:n.placeholder||e([]),position:n.position,originalPosition:n.originalPosition,offset:n.positionAbs,item:n.currentItem,sender:t?t.element:null}}})});;
/*!
 * jQuery UI Touch Punch 0.2.3
 *
 * Copyright 2011–2014, Dave Furfero
 * Dual licensed under the MIT or GPL Version 2 licenses.
 *
 * Depends:
 *  jquery.ui.widget.js
 *  jquery.ui.mouse.js
 */
!function(a){function f(a,b){if(!(a.originalEvent.touches.length>1)){a.preventDefault();var c=a.originalEvent.changedTouches[0],d=document.createEvent("MouseEvents");d.initMouseEvent(b,!0,!0,window,1,c.screenX,c.screenY,c.clientX,c.clientY,!1,!1,!1,!1,0,null),a.target.dispatchEvent(d)}}if(a.support.touch="ontouchend"in document,a.support.touch){var e,b=a.ui.mouse.prototype,c=b._mouseInit,d=b._mouseDestroy;b._touchStart=function(a){var b=this;!e&&b._mouseCapture(a.originalEvent.changedTouches[0])&&(e=!0,b._touchMoved=!1,f(a,"mouseover"),f(a,"mousemove"),f(a,"mousedown"))},b._touchMove=function(a){e&&(this._touchMoved=!0,f(a,"mousemove"))},b._touchEnd=function(a){e&&(f(a,"mouseup"),f(a,"mouseout"),this._touchMoved||f(a,"click"),e=!1)},b._mouseInit=function(){var b=this;b.element.bind({touchstart:a.proxy(b,"_touchStart"),touchmove:a.proxy(b,"_touchMove"),touchend:a.proxy(b,"_touchEnd")}),c.call(b)},b._mouseDestroy=function(){var b=this;b.element.unbind({touchstart:a.proxy(b,"_touchStart"),touchmove:a.proxy(b,"_touchMove"),touchend:a.proxy(b,"_touchEnd")}),d.call(b)}}}(jQuery);;
/**
 * @file
 * Adds an HTML element and method to trigger audio UAs to read system messages.
 *
 * Use {@link Drupal.announce} to indicate to screen reader users that an
 * element on the page has changed state. For instance, if clicking a link
 * loads 10 more items into a list, one might announce the change like this.
 *
 * @example
 * $('#search-list')
 *   .on('itemInsert', function (event, data) {
 *     // Insert the new items.
 *     $(data.container.el).append(data.items.el);
 *     // Announce the change to the page contents.
 *     Drupal.announce(Drupal.t('@count items added to @container',
 *       {'@count': data.items.length, '@container': data.container.title}
 *     ));
 *   });
 */

(function (Drupal, debounce) {

  'use strict';

  var liveElement;
  var announcements = [];

  /**
   * Builds a div element with the aria-live attribute and add it to the DOM.
   *
   * @type {Drupal~behavior}
   *
   * @prop {Drupal~behaviorAttach} attach
   *   Attaches the behavior for drupalAnnouce.
   */
  Drupal.behaviors.drupalAnnounce = {
    attach: function (context) {
      // Create only one aria-live element.
      if (!liveElement) {
        liveElement = document.createElement('div');
        liveElement.id = 'drupal-live-announce';
        liveElement.className = 'visually-hidden';
        liveElement.setAttribute('aria-live', 'polite');
        liveElement.setAttribute('aria-busy', 'false');
        document.body.appendChild(liveElement);
      }
    }
  };

  /**
   * Concatenates announcements to a single string; appends to the live region.
   */
  function announce() {
    var text = [];
    var priority = 'polite';
    var announcement;

    // Create an array of announcement strings to be joined and appended to the
    // aria live region.
    var il = announcements.length;
    for (var i = 0; i < il; i++) {
      announcement = announcements.pop();
      text.unshift(announcement.text);
      // If any of the announcements has a priority of assertive then the group
      // of joined announcements will have this priority.
      if (announcement.priority === 'assertive') {
        priority = 'assertive';
      }
    }

    if (text.length) {
      // Clear the liveElement so that repeated strings will be read.
      liveElement.innerHTML = '';
      // Set the busy state to true until the node changes are complete.
      liveElement.setAttribute('aria-busy', 'true');
      // Set the priority to assertive, or default to polite.
      liveElement.setAttribute('aria-live', priority);
      // Print the text to the live region. Text should be run through
      // Drupal.t() before being passed to Drupal.announce().
      liveElement.innerHTML = text.join('\n');
      // The live text area is updated. Allow the AT to announce the text.
      liveElement.setAttribute('aria-busy', 'false');
    }
  }

  /**
   * Triggers audio UAs to read the supplied text.
   *
   * The aria-live region will only read the text that currently populates its
   * text node. Replacing text quickly in rapid calls to announce results in
   * only the text from the most recent call to {@link Drupal.announce} being
   * read. By wrapping the call to announce in a debounce function, we allow for
   * time for multiple calls to {@link Drupal.announce} to queue up their
   * messages. These messages are then joined and append to the aria-live region
   * as one text node.
   *
   * @param {string} text
   *   A string to be read by the UA.
   * @param {string} [priority='polite']
   *   A string to indicate the priority of the message. Can be either
   *   'polite' or 'assertive'.
   *
   * @return {function}
   *   The return of the call to debounce.
   *
   * @see http://www.w3.org/WAI/PF/aria-practices/#liveprops
   */
  Drupal.announce = function (text, priority) {
    // Save the text and priority into a closure variable. Multiple simultaneous
    // announcements will be concatenated and read in sequence.
    announcements.push({
      text: text,
      priority: priority
    });
    // Immediately invoke the function that debounce returns. 200 ms is right at
    // the cusp where humans notice a pause, so we will wait
    // at most this much time before the set of queued announcements is read.
    return (debounce(announce, 200)());
  };
}(Drupal, Drupal.debounce));
;
/**
 * @file
 * Provides a JavaScript API to broadcast text editor configuration changes.
 *
 * Filter implementations may listen to the drupalEditorFeatureAdded,
 * drupalEditorFeatureRemoved, and drupalEditorFeatureRemoved events on document
 * to automatically adjust their settings based on the editor configuration.
 */

(function ($, _, Drupal, document) {

  'use strict';

  /**
   * Editor configuration namespace.
   *
   * @namespace
   */
  Drupal.editorConfiguration = {

    /**
     * Must be called by a specific text editor's configuration whenever a
     * feature is added by the user.
     *
     * Triggers the drupalEditorFeatureAdded event on the document, which
     * receives a {@link Drupal.EditorFeature} object.
     *
     * @param {Drupal.EditorFeature} feature
     *   A text editor feature object.
     *
     * @fires event:drupalEditorFeatureAdded
     */
    addedFeature: function (feature) {
      $(document).trigger('drupalEditorFeatureAdded', feature);
    },

    /**
     * Must be called by a specific text editor's configuration whenever a
     * feature is removed by the user.
     *
     * Triggers the drupalEditorFeatureRemoved event on the document, which
     * receives a {@link Drupal.EditorFeature} object.
     *
     * @param {Drupal.EditorFeature} feature
     *   A text editor feature object.
     *
     * @fires event:drupalEditorFeatureRemoved
     */
    removedFeature: function (feature) {
      $(document).trigger('drupalEditorFeatureRemoved', feature);
    },

    /**
     * Must be called by a specific text editor's configuration whenever a
     * feature is modified, i.e. has different rules.
     *
     * For example when the "Bold" button is configured to use the `<b>` tag
     * instead of the `<strong>` tag.
     *
     * Triggers the drupalEditorFeatureModified event on the document, which
     * receives a {@link Drupal.EditorFeature} object.
     *
     * @param {Drupal.EditorFeature} feature
     *   A text editor feature object.
     *
     * @fires event:drupalEditorFeatureModified
     */
    modifiedFeature: function (feature) {
      $(document).trigger('drupalEditorFeatureModified', feature);
    },

    /**
     * May be called by a specific text editor's configuration whenever a
     * feature is being added, to check whether it would require the filter
     * settings to be updated.
     *
     * The canonical use case is when a text editor is being enabled:
     * preferably
     * this would not cause the filter settings to be changed; rather, the
     * default set of buttons (features) for the text editor should adjust
     * itself to not cause filter setting changes.
     *
     * Note: for filters to integrate with this functionality, it is necessary
     * that they implement
     * `Drupal.filterSettingsForEditors[filterID].getRules()`.
     *
     * @param {Drupal.EditorFeature} feature
     *   A text editor feature object.
     *
     * @return {bool}
     *   Whether the given feature is allowed by the current filters.
     */
    featureIsAllowedByFilters: function (feature) {

      /**
       * Generate the universe U of possible values that can result from the
       * feature's rules' requirements.
       *
       * This generates an object of this form:
       *   var universe = {
       *     a: {
       *       'touchedByAllowedPropertyRule': false,
       *       'tag': false,
       *       'attributes:href': false,
       *       'classes:external': false,
       *     },
       *     strong: {
       *       'touchedByAllowedPropertyRule': false,
       *       'tag': false,
       *     },
       *     img: {
       *       'touchedByAllowedPropertyRule': false,
       *       'tag': false,
       *       'attributes:src': false
       *     }
       *   };
       *
       * In this example, the given text editor feature resulted in the above
       * universe, which shows that it must be allowed to generate the a,
       * strong and img tags. For the a tag, it must be able to set the "href"
       * attribute and the "external" class. For the strong tag, no further
       * properties are required. For the img tag, the "src" attribute is
       * required. The "tag" key is used to track whether that tag was
       * explicitly allowed by one of the filter's rules. The
       * "touchedByAllowedPropertyRule" key is used for state tracking that is
       * essential for filterStatusAllowsFeature() to be able to reason: when
       * all of a filter's rules have been applied, and none of the forbidden
       * rules matched (which would have resulted in early termination) yet the
       * universe has not been made empty (which would be the end result if
       * everything in the universe were explicitly allowed), then this piece
       * of state data enables us to determine whether a tag whose properties
       * were not all explicitly allowed are in fact still allowed, because its
       * tag was explicitly allowed and there were no filter rules applying
       * "allowed tag property value" restrictions for this particular tag.
       *
       * @param {object} feature
       *   The feature in question.
       *
       * @return {object}
       *   The universe generated.
       *
       * @see findPropertyValueOnTag()
       * @see filterStatusAllowsFeature()
       */
      function generateUniverseFromFeatureRequirements(feature) {
        var properties = ['attributes', 'styles', 'classes'];
        var universe = {};

        for (var r = 0; r < feature.rules.length; r++) {
          var featureRule = feature.rules[r];

          // For each tag required by this feature rule, create a basic entry in
          // the universe.
          var requiredTags = featureRule.required.tags;
          for (var t = 0; t < requiredTags.length; t++) {
            universe[requiredTags[t]] = {
              // Whether this tag was allowed or not.
              tag: false,
              // Whether any filter rule that applies to this tag had an allowed
              // property rule. i.e. will become true if >=1 filter rule has >=1
              // allowed property rule.
              touchedByAllowedPropertyRule: false,
              // Analogous, but for forbidden property rule.
              touchedBytouchedByForbiddenPropertyRule: false
            };
          }

          // If no required properties are defined for this rule, we can move on
          // to the next feature.
          if (emptyProperties(featureRule.required)) {
            continue;
          }

          // Expand the existing universe, assume that each tags' property
          // value is disallowed. If the filter rules allow everything in the
          // feature's universe, then the feature is allowed.
          for (var p = 0; p < properties.length; p++) {
            var property = properties[p];
            for (var pv = 0; pv < featureRule.required[property].length; pv++) {
              var propertyValue = featureRule.required[property];
              universe[requiredTags][property + ':' + propertyValue] = false;
            }
          }
        }

        return universe;
      }

      /**
       * Provided a section of a feature or filter rule, checks if no property
       * values are defined for all properties: attributes, classes and styles.
       *
       * @param {object} section
       *   The section to check.
       *
       * @return {bool}
       *   Returns true if the section has empty properties, false otherwise.
       */
      function emptyProperties(section) {
        return section.attributes.length === 0 && section.classes.length === 0 && section.styles.length === 0;
      }

      /**
       * Calls findPropertyValueOnTag on the given tag for every property value
       * that is listed in the "propertyValues" parameter. Supports the wildcard
       * tag.
       *
       * @param {object} universe
       *   The universe to check.
       * @param {string} tag
       *   The tag to look for.
       * @param {string} property
       *   The property to check.
       * @param {Array} propertyValues
       *   Values of the property to check.
       * @param {bool} allowing
       *   Whether to update the universe or not.
       *
       * @return {bool}
       *   Returns true if found, false otherwise.
       */
      function findPropertyValuesOnTag(universe, tag, property, propertyValues, allowing) {
        // Detect the wildcard case.
        if (tag === '*') {
          return findPropertyValuesOnAllTags(universe, property, propertyValues, allowing);
        }

        var atLeastOneFound = false;
        _.each(propertyValues, function (propertyValue) {
          if (findPropertyValueOnTag(universe, tag, property, propertyValue, allowing)) {
            atLeastOneFound = true;
          }
        });
        return atLeastOneFound;
      }

      /**
       * Calls findPropertyValuesOnAllTags for all tags in the universe.
       *
       * @param {object} universe
       *   The universe to check.
       * @param {string} property
       *   The property to check.
       * @param {Array} propertyValues
       *   Values of the property to check.
       * @param {bool} allowing
       *   Whether to update the universe or not.
       *
       * @return {bool}
       *   Returns true if found, false otherwise.
       */
      function findPropertyValuesOnAllTags(universe, property, propertyValues, allowing) {
        var atLeastOneFound = false;
        _.each(_.keys(universe), function (tag) {
          if (findPropertyValuesOnTag(universe, tag, property, propertyValues, allowing)) {
            atLeastOneFound = true;
          }
        });
        return atLeastOneFound;
      }

      /**
       * Finds out if a specific property value (potentially containing
       * wildcards) exists on the given tag. When the "allowing" parameter
       * equals true, the universe will be updated if that specific property
       * value exists. Returns true if found, false otherwise.
       *
       * @param {object} universe
       *   The universe to check.
       * @param {string} tag
       *   The tag to look for.
       * @param {string} property
       *   The property to check.
       * @param {string} propertyValue
       *   The property value to check.
       * @param {bool} allowing
       *   Whether to update the universe or not.
       *
       * @return {bool}
       *   Returns true if found, false otherwise.
       */
      function findPropertyValueOnTag(universe, tag, property, propertyValue, allowing) {
        // If the tag does not exist in the universe, then it definitely can't
        // have this specific property value.
        if (!_.has(universe, tag)) {
          return false;
        }

        var key = property + ':' + propertyValue;

        // Track whether a tag was touched by a filter rule that allows specific
        // property values on this particular tag.
        // @see generateUniverseFromFeatureRequirements
        if (allowing) {
          universe[tag].touchedByAllowedPropertyRule = true;
        }

        // The simple case: no wildcard in property value.
        if (_.indexOf(propertyValue, '*') === -1) {
          if (_.has(universe, tag) && _.has(universe[tag], key)) {
            if (allowing) {
              universe[tag][key] = true;
            }
            return true;
          }
          return false;
        }
        // The complex case: wildcard in property value.
        else {
          var atLeastOneFound = false;
          var regex = key.replace(/\*/g, '[^ ]*');
          _.each(_.keys(universe[tag]), function (key) {
            if (key.match(regex)) {
              atLeastOneFound = true;
              if (allowing) {
                universe[tag][key] = true;
              }
            }
          });
          return atLeastOneFound;
        }
      }

      /**
       * Deletes a tag from the universe if the tag itself and each of its
       * properties are marked as allowed.
       *
       * @param {object} universe
       *   The universe to delete from.
       * @param {string} tag
       *   The tag to check.
       *
       * @return {bool}
       *   Whether something was deleted from the universe.
       */
      function deleteFromUniverseIfAllowed(universe, tag) {
        // Detect the wildcard case.
        if (tag === '*') {
          return deleteAllTagsFromUniverseIfAllowed(universe);
        }
        if (_.has(universe, tag) && _.every(_.omit(universe[tag], 'touchedByAllowedPropertyRule'))) {
          delete universe[tag];
          return true;
        }
        return false;
      }

      /**
       * Calls deleteFromUniverseIfAllowed for all tags in the universe.
       *
       * @param {object} universe
       *   The universe to delete from.
       *
       * @return {bool}
       *   Whether something was deleted from the universe.
       */
      function deleteAllTagsFromUniverseIfAllowed(universe) {
        var atLeastOneDeleted = false;
        _.each(_.keys(universe), function (tag) {
          if (deleteFromUniverseIfAllowed(universe, tag)) {
            atLeastOneDeleted = true;
          }
        });
        return atLeastOneDeleted;
      }

      /**
       * Checks if any filter rule forbids either a tag or a tag property value
       * that exists in the universe.
       *
       * @param {object} universe
       *   Universe to check.
       * @param {object} filterStatus
       *   Filter status to use for check.
       *
       * @return {bool}
       *   Whether any filter rule forbids something in the universe.
       */
      function anyForbiddenFilterRuleMatches(universe, filterStatus) {
        var properties = ['attributes', 'styles', 'classes'];

        // Check if a tag in the universe is forbidden.
        var allRequiredTags = _.keys(universe);
        var filterRule;
        for (var i = 0; i < filterStatus.rules.length; i++) {
          filterRule = filterStatus.rules[i];
          if (filterRule.allow === false) {
            if (_.intersection(allRequiredTags, filterRule.tags).length > 0) {
              return true;
            }
          }
        }

        // Check if a property value of a tag in the universe is forbidden.
        // For all filter rules…
        for (var n = 0; n < filterStatus.rules.length; n++) {
          filterRule = filterStatus.rules[n];
          // … if there are tags with restricted property values …
          if (filterRule.restrictedTags.tags.length && !emptyProperties(filterRule.restrictedTags.forbidden)) {
            // … for all those tags …
            for (var j = 0; j < filterRule.restrictedTags.tags.length; j++) {
              var tag = filterRule.restrictedTags.tags[j];
              // … then iterate over all properties …
              for (var k = 0; k < properties.length; k++) {
                var property = properties[k];
                // … and return true if just one of the forbidden property
                // values for this tag and property is listed in the universe.
                if (findPropertyValuesOnTag(universe, tag, property, filterRule.restrictedTags.forbidden[property], false)) {
                  return true;
                }
              }
            }
          }
        }

        return false;
      }

      /**
       * Applies every filter rule's explicit allowing of a tag or a tag
       * property value to the universe. Whenever both the tag and all of its
       * required property values are marked as explicitly allowed, they are
       * deleted from the universe.
       *
       * @param {object} universe
       *   Universe to delete from.
       * @param {object} filterStatus
       *   The filter status in question.
       */
      function markAllowedTagsAndPropertyValues(universe, filterStatus) {
        var properties = ['attributes', 'styles', 'classes'];

        // Check if a tag in the universe is allowed.
        var filterRule;
        var tag;
        for (var l = 0; !_.isEmpty(universe) && l < filterStatus.rules.length; l++) {
          filterRule = filterStatus.rules[l];
          if (filterRule.allow === true) {
            for (var m = 0; !_.isEmpty(universe) && m < filterRule.tags.length; m++) {
              tag = filterRule.tags[m];
              if (_.has(universe, tag)) {
                universe[tag].tag = true;
                deleteFromUniverseIfAllowed(universe, tag);
              }
            }
          }
        }

        // Check if a property value of a tag in the universe is allowed.
        // For all filter rules…
        for (var i = 0; !_.isEmpty(universe) && i < filterStatus.rules.length; i++) {
          filterRule = filterStatus.rules[i];
          // … if there are tags with restricted property values …
          if (filterRule.restrictedTags.tags.length && !emptyProperties(filterRule.restrictedTags.allowed)) {
            // … for all those tags …
            for (var j = 0; !_.isEmpty(universe) && j < filterRule.restrictedTags.tags.length; j++) {
              tag = filterRule.restrictedTags.tags[j];
              // … then iterate over all properties …
              for (var k = 0; k < properties.length; k++) {
                var property = properties[k];
                // … and try to delete this tag from the universe if just one
                // of the allowed property values for this tag and property is
                // listed in the universe. (Because everything might be allowed
                // now.)
                if (findPropertyValuesOnTag(universe, tag, property, filterRule.restrictedTags.allowed[property], true)) {
                  deleteFromUniverseIfAllowed(universe, tag);
                }
              }
            }
          }
        }
      }

      /**
       * Checks whether the current status of a filter allows a specific feature
       * by building the universe of potential values from the feature's
       * requirements and then checking whether anything in the filter prevents
       * that.
       *
       * @param {object} filterStatus
       *   The filter status in question.
       * @param {object} feature
       *   The feature requested.
       *
       * @return {bool}
       *   Whether the current status of the filter allows specified feature.
       *
       * @see generateUniverseFromFeatureRequirements()
       */
      function filterStatusAllowsFeature(filterStatus, feature) {
        // An inactive filter by definition allows the feature.
        if (!filterStatus.active) {
          return true;
        }

        // A feature that specifies no rules has no HTML requirements and is
        // hence allowed by definition.
        if (feature.rules.length === 0) {
          return true;
        }

        // Analogously for a filter that specifies no rules.
        if (filterStatus.rules.length === 0) {
          return true;
        }

        // Generate the universe U of possible values that can result from the
        // feature's rules' requirements.
        var universe = generateUniverseFromFeatureRequirements(feature);

        // If anything that is in the universe (and is thus required by the
        // feature) is forbidden by any of the filter's rules, then this filter
        // does not allow this feature.
        if (anyForbiddenFilterRuleMatches(universe, filterStatus)) {
          return false;
        }

        // Mark anything in the universe that is allowed by any of the filter's
        // rules as allowed. If everything is explicitly allowed, then the
        // universe will become empty.
        markAllowedTagsAndPropertyValues(universe, filterStatus);

        // If there was at least one filter rule allowing tags, then everything
        // in the universe must be allowed for this feature to be allowed, and
        // thus by now it must be empty. However, it is still possible that the
        // filter allows the feature, due to no rules for allowing tag property
        // values and/or rules for forbidding tag property values. For details:
        // see the comments below.
        // @see generateUniverseFromFeatureRequirements()
        if (_.some(_.pluck(filterStatus.rules, 'allow'))) {
          // If the universe is empty, then everything was explicitly allowed
          // and our job is done: this filter allows this feature!
          if (_.isEmpty(universe)) {
            return true;
          }
          // Otherwise, it is still possible that this feature is allowed.
          else {
            // Every tag must be explicitly allowed if there are filter rules
            // doing tag whitelisting.
            if (!_.every(_.pluck(universe, 'tag'))) {
              return false;
            }
            // Every tag was explicitly allowed, but since the universe is not
            // empty, one or more tag properties are disallowed. However, if
            // only blacklisting of tag properties was applied to these tags,
            // and no whitelisting was ever applied, then it's still fine:
            // since none of the tag properties were blacklisted, we got to
            // this point, and since no whitelisting was applied, it doesn't
            // matter that the properties: this could never have happened
            // anyway. It's only this late that we can know this for certain.
            else {
              var tags = _.keys(universe);
              // Figure out if there was any rule applying whitelisting tag
              // restrictions to each of the remaining tags.
              for (var i = 0; i < tags.length; i++) {
                var tag = tags[i];
                if (_.has(universe, tag)) {
                  if (universe[tag].touchedByAllowedPropertyRule === false) {
                    delete universe[tag];
                  }
                }
              }
              return _.isEmpty(universe);
            }
          }
        }
        // Otherwise, if all filter rules were doing blacklisting, then the sole
        // fact that we got to this point indicates that this filter allows for
        // everything that is required for this feature.
        else {
          return true;
        }
      }

      // If any filter's current status forbids the editor feature, return
      // false.
      Drupal.filterConfiguration.update();
      for (var filterID in Drupal.filterConfiguration.statuses) {
        if (Drupal.filterConfiguration.statuses.hasOwnProperty(filterID)) {
          var filterStatus = Drupal.filterConfiguration.statuses[filterID];
          if (!(filterStatusAllowsFeature(filterStatus, feature))) {
            return false;
          }
        }
      }

      return true;
    }
  };

  /**
   * Constructor for an editor feature HTML rule.
   *
   * Intended to be used in combination with {@link Drupal.EditorFeature}.
   *
   * A text editor feature rule object describes both:
   *  - required HTML tags, attributes, styles and classes: without these, the
   *    text editor feature is unable to function. It's possible that a
   *  - allowed HTML tags, attributes, styles and classes: these are optional
   *    in the strictest sense, but it is possible that the feature generates
   *    them.
   *
   * The structure can be very clearly seen below: there's a "required" and an
   * "allowed" key. For each of those, there are objects with the "tags",
   * "attributes", "styles" and "classes" keys. For all these keys the values
   * are initialized to the empty array. List each possible value as an array
   * value. Besides the "required" and "allowed" keys, there's an optional
   * "raw" key: it allows text editor implementations to optionally pass in
   * their raw representation instead of the Drupal-defined representation for
   * HTML rules.
   *
   * @example
   * tags: ['<a>']
   * attributes: ['href', 'alt']
   * styles: ['color', 'text-decoration']
   * classes: ['external', 'internal']
   *
   * @constructor
   *
   * @see Drupal.EditorFeature
   */
  Drupal.EditorFeatureHTMLRule = function () {

    /**
     *
     * @type {object}
     *
     * @prop {Array} tags
     * @prop {Array} attributes
     * @prop {Array} styles
     * @prop {Array} classes
     */
    this.required = {tags: [], attributes: [], styles: [], classes: []};

    /**
     *
     * @type {object}
     *
     * @prop {Array} tags
     * @prop {Array} attributes
     * @prop {Array} styles
     * @prop {Array} classes
     */
    this.allowed = {tags: [], attributes: [], styles: [], classes: []};

    /**
     *
     * @type {null}
     */
    this.raw = null;
  };

  /**
   * A text editor feature object. Initialized with the feature name.
   *
   * Contains a set of HTML rules ({@link Drupal.EditorFeatureHTMLRule} objects)
   * that describe which HTML tags, attributes, styles and classes are required
   * (i.e. essential for the feature to function at all) and which are allowed
   * (i.e. the feature may generate this, but they're not essential).
   *
   * It is necessary to allow for multiple HTML rules per feature: with just
   * one HTML rule per feature, there is not enough expressiveness to describe
   * certain cases. For example: a "table" feature would probably require the
   * `<table>` tag, and might allow e.g. the "summary" attribute on that tag.
   * However, the table feature would also require the `<tr>` and `<td>` tags,
   * but it doesn't make sense to allow for a "summary" attribute on these tags.
   * Hence these would need to be split in two separate rules.
   *
   * HTML rules must be added with the `addHTMLRule()` method. A feature that
   * has zero HTML rules does not create or modify HTML.
   *
   * @constructor
   *
   * @param {string} name
   *   The name of the feature.
   *
   * @see Drupal.EditorFeatureHTMLRule
   */
  Drupal.EditorFeature = function (name) {
    this.name = name;
    this.rules = [];
  };

  /**
   * Adds a HTML rule to the list of HTML rules for this feature.
   *
   * @param {Drupal.EditorFeatureHTMLRule} rule
   *   A text editor feature HTML rule.
   */
  Drupal.EditorFeature.prototype.addHTMLRule = function (rule) {
    this.rules.push(rule);
  };

  /**
   * Text filter status object. Initialized with the filter ID.
   *
   * Indicates whether the text filter is currently active (enabled) or not.
   *
   * Contains a set of HTML rules ({@link Drupal.FilterHTMLRule} objects) that
   * describe which HTML tags are allowed or forbidden. They can also describe
   * for a set of tags (or all tags) which attributes, styles and classes are
   * allowed and which are forbidden.
   *
   * It is necessary to allow for multiple HTML rules per feature, for
   * analogous reasons as {@link Drupal.EditorFeature}.
   *
   * HTML rules must be added with the `addHTMLRule()` method. A filter that has
   * zero HTML rules does not disallow any HTML.
   *
   * @constructor
   *
   * @param {string} name
   *   The name of the feature.
   *
   * @see Drupal.FilterHTMLRule
   */
  Drupal.FilterStatus = function (name) {

    /**
     *
     * @type {string}
     */
    this.name = name;

    /**
     *
     * @type {bool}
     */
    this.active = false;

    /**
     *
     * @type {Array.<Drupal.FilterHTMLRule>}
     */
    this.rules = [];
  };

  /**
   * Adds a HTML rule to the list of HTML rules for this filter.
   *
   * @param {Drupal.FilterHTMLRule} rule
   *   A text filter HTML rule.
   */
  Drupal.FilterStatus.prototype.addHTMLRule = function (rule) {
    this.rules.push(rule);
  };

  /**
   * A text filter HTML rule object.
   *
   * Intended to be used in combination with {@link Drupal.FilterStatus}.
   *
   * A text filter rule object describes:
   *  1. allowed or forbidden tags: (optional) whitelist or blacklist HTML tags
   *  2. restricted tag properties: (optional) whitelist or blacklist
   *     attributes, styles and classes on a set of HTML tags.
   *
   * Typically, each text filter rule object does either 1 or 2, not both.
   *
   * The structure can be very clearly seen below:
   *  1. use the "tags" key to list HTML tags, and set the "allow" key to
   *     either true (to allow these HTML tags) or false (to forbid these HTML
   *     tags). If you leave the "tags" key's default value (the empty array),
   *     no restrictions are applied.
   *  2. all nested within the "restrictedTags" key: use the "tags" subkey to
   *     list HTML tags to which you want to apply property restrictions, then
   *     use the "allowed" subkey to whitelist specific property values, and
   *     similarly use the "forbidden" subkey to blacklist specific property
   *     values.
   *
   * @example
   * <caption>Whitelist the "p", "strong" and "a" HTML tags.</caption>
   * {
   *   tags: ['p', 'strong', 'a'],
   *   allow: true,
   *   restrictedTags: {
   *     tags: [],
   *     allowed: { attributes: [], styles: [], classes: [] },
   *     forbidden: { attributes: [], styles: [], classes: [] }
   *   }
   * }
   * @example
   * <caption>For the "a" HTML tag, only allow the "href" attribute
   * and the "external" class and disallow the "target" attribute.</caption>
   * {
   *   tags: [],
   *   allow: null,
   *   restrictedTags: {
   *     tags: ['a'],
   *     allowed: { attributes: ['href'], styles: [], classes: ['external'] },
   *     forbidden: { attributes: ['target'], styles: [], classes: [] }
   *   }
   * }
   * @example
   * <caption>For all tags, allow the "data-*" attribute (that is, any
   * attribute that begins with "data-").</caption>
   * {
   *   tags: [],
   *   allow: null,
   *   restrictedTags: {
   *     tags: ['*'],
   *     allowed: { attributes: ['data-*'], styles: [], classes: [] },
   *     forbidden: { attributes: [], styles: [], classes: [] }
   *   }
   * }
   *
   * @return {object}
   *   An object with the following structure:
   * ```
   * {
   *   tags: Array,
   *   allow: null,
   *   restrictedTags: {
   *     tags: Array,
   *     allowed: {attributes: Array, styles: Array, classes: Array},
   *     forbidden: {attributes: Array, styles: Array, classes: Array}
   *   }
   * }
   * ```
   *
   * @see Drupal.FilterStatus
   */
  Drupal.FilterHTMLRule = function () {
    // Allow or forbid tags.
    this.tags = [];
    this.allow = null;

    // Apply restrictions to properties set on tags.
    this.restrictedTags = {
      tags: [],
      allowed: {attributes: [], styles: [], classes: []},
      forbidden: {attributes: [], styles: [], classes: []}
    };

    return this;
  };

  Drupal.FilterHTMLRule.prototype.clone = function () {
    var clone = new Drupal.FilterHTMLRule();
    clone.tags = this.tags.slice(0);
    clone.allow = this.allow;
    clone.restrictedTags.tags = this.restrictedTags.tags.slice(0);
    clone.restrictedTags.allowed.attributes = this.restrictedTags.allowed.attributes.slice(0);
    clone.restrictedTags.allowed.styles = this.restrictedTags.allowed.styles.slice(0);
    clone.restrictedTags.allowed.classes = this.restrictedTags.allowed.classes.slice(0);
    clone.restrictedTags.forbidden.attributes = this.restrictedTags.forbidden.attributes.slice(0);
    clone.restrictedTags.forbidden.styles = this.restrictedTags.forbidden.styles.slice(0);
    clone.restrictedTags.forbidden.classes = this.restrictedTags.forbidden.classes.slice(0);
    return clone;
  };

  /**
   * Tracks the configuration of all text filters in {@link Drupal.FilterStatus}
   * objects for {@link Drupal.editorConfiguration.featureIsAllowedByFilters}.
   *
   * @namespace
   */
  Drupal.filterConfiguration = {

    /**
     * Drupal.FilterStatus objects, keyed by filter ID.
     *
     * @type {Object.<string, Drupal.FilterStatus>}
     */
    statuses: {},

    /**
     * Live filter setting parsers.
     *
     * Object keyed by filter ID, for those filters that implement it.
     *
     * Filters should load the implementing JavaScript on the filter
     * configuration form and implement
     * `Drupal.filterSettings[filterID].getRules()`, which should return an
     * array of {@link Drupal.FilterHTMLRule} objects.
     *
     * @namespace
     */
    liveSettingParsers: {},

    /**
     * Updates all {@link Drupal.FilterStatus} objects to reflect current state.
     *
     * Automatically checks whether a filter is currently enabled or not. To
     * support more finegrained.
     *
     * If a filter implements a live setting parser, then that will be used to
     * keep the HTML rules for the {@link Drupal.FilterStatus} object
     * up-to-date.
     */
    update: function () {
      for (var filterID in Drupal.filterConfiguration.statuses) {
        if (Drupal.filterConfiguration.statuses.hasOwnProperty(filterID)) {
          // Update status.
          Drupal.filterConfiguration.statuses[filterID].active = $('[name="filters[' + filterID + '][status]"]').is(':checked');

          // Update current rules.
          if (Drupal.filterConfiguration.liveSettingParsers[filterID]) {
            Drupal.filterConfiguration.statuses[filterID].rules = Drupal.filterConfiguration.liveSettingParsers[filterID].getRules();
          }
        }
      }
    }

  };

  /**
   * Initializes {@link Drupal.filterConfiguration}.
   *
   * @type {Drupal~behavior}
   *
   * @prop {Drupal~behaviorAttach} attach
   *   Gets filter configuration from filter form input.
   */
  Drupal.behaviors.initializeFilterConfiguration = {
    attach: function (context, settings) {
      var $context = $(context);

      $context.find('#filters-status-wrapper input.form-checkbox').once('filter-editor-status').each(function () {
        var $checkbox = $(this);
        var nameAttribute = $checkbox.attr('name');

        // The filter's checkbox has a name attribute of the form
        // "filters[<name of filter>][status]", parse "<name of filter>"
        // from it.
        var filterID = nameAttribute.substring(8, nameAttribute.indexOf(']'));

        // Create a Drupal.FilterStatus object to track the state (whether it's
        // active or not and its current settings, if any) of each filter.
        Drupal.filterConfiguration.statuses[filterID] = new Drupal.FilterStatus(filterID);
      });
    }
  };

})(jQuery, _, Drupal, document);
;
/**
 * @file
 * CKEditor button and group configuration user interface.
 */

(function ($, Drupal, drupalSettings, _) {

  'use strict';

  Drupal.ckeditor = Drupal.ckeditor || {};

  /**
   * Sets config behaviour and creates config views for the CKEditor toolbar.
   *
   * @type {Drupal~behavior}
   *
   * @prop {Drupal~behaviorAttach} attach
   *   Attaches admin behaviour to the CKEditor buttons.
   * @prop {Drupal~behaviorDetach} detach
   *   Detaches admin behaviour from the CKEditor buttons on 'unload'.
   */
  Drupal.behaviors.ckeditorAdmin = {
    attach: function (context) {
      // Process the CKEditor configuration fragment once.
      var $configurationForm = $(context).find('.ckeditor-toolbar-configuration').once('ckeditor-configuration');
      if ($configurationForm.length) {
        var $textarea = $configurationForm
          // Hide the textarea that contains the serialized representation of the
          // CKEditor configuration.
          .find('.js-form-item-editor-settings-toolbar-button-groups')
          .hide()
          // Return the textarea child node from this expression.
          .find('textarea');

        // The HTML for the CKEditor configuration is assembled on the server
        // and sent to the client as a serialized DOM fragment.
        $configurationForm.append(drupalSettings.ckeditor.toolbarAdmin);

        // Create a configuration model.
        var model = Drupal.ckeditor.models.Model = new Drupal.ckeditor.Model({
          $textarea: $textarea,
          activeEditorConfig: JSON.parse($textarea.val()),
          hiddenEditorConfig: drupalSettings.ckeditor.hiddenCKEditorConfig
        });

        // Create the configuration Views.
        var viewDefaults = {
          model: model,
          el: $('.ckeditor-toolbar-configuration')
        };
        Drupal.ckeditor.views = {
          controller: new Drupal.ckeditor.ControllerView(viewDefaults),
          visualView: new Drupal.ckeditor.VisualView(viewDefaults),
          keyboardView: new Drupal.ckeditor.KeyboardView(viewDefaults),
          auralView: new Drupal.ckeditor.AuralView(viewDefaults)
        };
      }
    },
    detach: function (context, settings, trigger) {
      // Early-return if the trigger for detachment is something else than
      // unload.
      if (trigger !== 'unload') {
        return;
      }

      // We're detaching because CKEditor as text editor has been disabled; this
      // really means that all CKEditor toolbar buttons have been removed.
      // Hence,all editor features will be removed, so any reactions from
      // filters will be undone.
      var $configurationForm = $(context).find('.ckeditor-toolbar-configuration').findOnce('ckeditor-configuration');
      if ($configurationForm.length && Drupal.ckeditor.models && Drupal.ckeditor.models.Model) {
        var config = Drupal.ckeditor.models.Model.toJSON().activeEditorConfig;
        var buttons = Drupal.ckeditor.views.controller.getButtonList(config);
        var $activeToolbar = $('.ckeditor-toolbar-configuration').find('.ckeditor-toolbar-active');
        for (var i = 0; i < buttons.length; i++) {
          $activeToolbar.trigger('CKEditorToolbarChanged', ['removed', buttons[i]]);
        }
      }
    }
  };

  /**
   * CKEditor configuration UI methods of Backbone objects.
   *
   * @namespace
   */
  Drupal.ckeditor = {

    /**
     * A hash of View instances.
     *
     * @type {object}
     */
    views: {},

    /**
     * A hash of Model instances.
     *
     * @type {object}
     */
    models: {},

    /**
     * Translates changes in CKEditor config DOM structure to the config model.
     *
     * If the button is moved within an existing group, the DOM structure is
     * simply translated to a configuration model. If the button is moved into a
     * new group placeholder, then a process is launched to name that group
     * before the button move is translated into configuration.
     *
     * @param {Backbone.View} view
     *   The Backbone View that invoked this function.
     * @param {jQuery} $button
     *   A jQuery set that contains an li element that wraps a button element.
     * @param {function} callback
     *   A callback to invoke after the button group naming modal dialog has
     *   been closed.
     *
     */
    registerButtonMove: function (view, $button, callback) {
      var $group = $button.closest('.ckeditor-toolbar-group');

      // If dropped in a placeholder button group, the user must name it.
      if ($group.hasClass('placeholder')) {
        if (view.isProcessing) {
          return;
        }
        view.isProcessing = true;

        Drupal.ckeditor.openGroupNameDialog(view, $group, callback);
      }
      else {
        view.model.set('isDirty', true);
        callback(true);
      }
    },

    /**
     * Translates changes in CKEditor config DOM structure to the config model.
     *
     * Each row has a placeholder group at the end of the row. A user may not
     * move an existing button group past the placeholder group at the end of a
     * row.
     *
     * @param {Backbone.View} view
     *   The Backbone View that invoked this function.
     * @param {jQuery} $group
     *   A jQuery set that contains an li element that wraps a group of buttons.
     */
    registerGroupMove: function (view, $group) {
      // Remove placeholder classes if necessary.
      var $row = $group.closest('.ckeditor-row');
      if ($row.hasClass('placeholder')) {
        $row.removeClass('placeholder');
      }
      // If there are any rows with just a placeholder group, mark the row as a
      // placeholder.
      $row.parent().children().each(function () {
        $row = $(this);
        if ($row.find('.ckeditor-toolbar-group').not('.placeholder').length === 0) {
          $row.addClass('placeholder');
        }
      });
      view.model.set('isDirty', true);
    },

    /**
     * Opens a dialog with a form for changing the title of a button group.
     *
     * @param {Backbone.View} view
     *   The Backbone View that invoked this function.
     * @param {jQuery} $group
     *   A jQuery set that contains an li element that wraps a group of buttons.
     * @param {function} callback
     *   A callback to invoke after the button group naming modal dialog has
     *   been closed.
     */
    openGroupNameDialog: function (view, $group, callback) {
      callback = callback || function () {};

      /**
       * Validates the string provided as a button group title.
       *
       * @param {HTMLElement} form
       *   The form DOM element that contains the input with the new button
       *   group title string.
       *
       * @return {bool}
       *   Returns true when an error exists, otherwise returns false.
       */
      function validateForm(form) {
        if (form.elements[0].value.length === 0) {
          var $form = $(form);
          if (!$form.hasClass('errors')) {
            $form
              .addClass('errors')
              .find('input')
              .addClass('error')
              .attr('aria-invalid', 'true');
            $('<div class=\"description\" >' + Drupal.t('Please provide a name for the button group.') + '</div>').insertAfter(form.elements[0]);
          }
          return true;
        }
        return false;
      }

      /**
       * Attempts to close the dialog; Validates user input.
       *
       * @param {string} action
       *   The dialog action chosen by the user: 'apply' or 'cancel'.
       * @param {HTMLElement} form
       *   The form DOM element that contains the input with the new button
       *   group title string.
       */
      function closeDialog(action, form) {

        /**
         * Closes the dialog when the user cancels or supplies valid data.
         */
        function shutdown() {
          dialog.close(action);

          // The processing marker can be deleted since the dialog has been
          // closed.
          delete view.isProcessing;
        }

        /**
         * Applies a string as the name of a CKEditor button group.
         *
         * @param {jQuery} $group
         *   A jQuery set that contains an li element that wraps a group of
         *   buttons.
         * @param {string} name
         *   The new name of the CKEditor button group.
         */
        function namePlaceholderGroup($group, name) {
          // If it's currently still a placeholder, then that means we're
          // creating a new group, and we must do some extra work.
          if ($group.hasClass('placeholder')) {
            // Remove all whitespace from the name, lowercase it and ensure
            // HTML-safe encoding, then use this as the group ID for CKEditor
            // configuration UI accessibility purposes only.
            var groupID = 'ckeditor-toolbar-group-aria-label-for-' + Drupal.checkPlain(name.toLowerCase().replace(/\s/g, '-'));
            $group
              // Update the group container.
              .removeAttr('aria-label')
              .attr('data-drupal-ckeditor-type', 'group')
              .attr('tabindex', 0)
              // Update the group heading.
              .children('.ckeditor-toolbar-group-name')
              .attr('id', groupID)
              .end()
              // Update the group items.
              .children('.ckeditor-toolbar-group-buttons')
              .attr('aria-labelledby', groupID);
          }

          $group
            .attr('data-drupal-ckeditor-toolbar-group-name', name)
            .children('.ckeditor-toolbar-group-name')
            .text(name);
        }

        // Invoke a user-provided callback and indicate failure.
        if (action === 'cancel') {
          shutdown();
          callback(false, $group);
          return;
        }

        // Validate that a group name was provided.
        if (form && validateForm(form)) {
          return;
        }

        // React to application of a valid group name.
        if (action === 'apply') {
          shutdown();
          // Apply the provided name to the button group label.
          namePlaceholderGroup($group, Drupal.checkPlain(form.elements[0].value));
          // Remove placeholder classes so that new placeholders will be
          // inserted.
          $group.closest('.ckeditor-row.placeholder').addBack().removeClass('placeholder');

          // Invoke a user-provided callback and indicate success.
          callback(true, $group);

          // Signal that the active toolbar DOM structure has changed.
          view.model.set('isDirty', true);
        }
      }

      // Create a Drupal dialog that will get a button group name from the user.
      var $ckeditorButtonGroupNameForm = $(Drupal.theme('ckeditorButtonGroupNameForm'));
      var dialog = Drupal.dialog($ckeditorButtonGroupNameForm.get(0), {
        title: Drupal.t('Button group name'),
        dialogClass: 'ckeditor-name-toolbar-group',
        resizable: false,
        buttons: [
          {
            text: Drupal.t('Apply'),
            click: function () {
              closeDialog('apply', this);
            },
            primary: true
          },
          {
            text: Drupal.t('Cancel'),
            click: function () {
              closeDialog('cancel');
            }
          }
        ],
        open: function () {
          var form = this;
          var $form = $(this);
          var $widget = $form.parent();
          $widget.find('.ui-dialog-titlebar-close').remove();
          // Set a click handler on the input and button in the form.
          $widget.on('keypress.ckeditor', 'input, button', function (event) {
            // React to enter key press.
            if (event.keyCode === 13) {
              var $target = $(event.currentTarget);
              var data = $target.data('ui-button');
              var action = 'apply';
              // Assume 'apply', but take into account that the user might have
              // pressed the enter key on the dialog buttons.
              if (data && data.options && data.options.label) {
                action = data.options.label.toLowerCase();
              }
              closeDialog(action, form);
              event.stopPropagation();
              event.stopImmediatePropagation();
              event.preventDefault();
            }
          });
          // Announce to the user that a modal dialog is open.
          var text = Drupal.t('Editing the name of the new button group in a dialog.');
          if (typeof $group.attr('data-drupal-ckeditor-toolbar-group-name') !== 'undefined') {
            text = Drupal.t('Editing the name of the "@groupName" button group in a dialog.', {
              '@groupName': $group.attr('data-drupal-ckeditor-toolbar-group-name')
            });
          }
          Drupal.announce(text);
        },
        close: function (event) {
          // Automatically destroy the DOM element that was used for the dialog.
          $(event.target).remove();
        }
      });
      // A modal dialog is used because the user must provide a button group
      // name or cancel the button placement before taking any other action.
      dialog.showModal();

      $(document.querySelector('.ckeditor-name-toolbar-group').querySelector('input'))
        // When editing, set the "group name" input in the form to the current
        // value.
        .attr('value', $group.attr('data-drupal-ckeditor-toolbar-group-name'))
        // Focus on the "group name" input in the form.
        .trigger('focus');
    }

  };

  /**
   * Automatically shows/hides settings of buttons-only CKEditor plugins.
   *
   * @type {Drupal~behavior}
   *
   * @prop {Drupal~behaviorAttach} attach
   *   Attaches show/hide behaviour to Plugin Settings buttons.
   */
  Drupal.behaviors.ckeditorAdminButtonPluginSettings = {
    attach: function (context) {
      var $context = $(context);
      var $ckeditorPluginSettings = $context.find('#ckeditor-plugin-settings').once('ckeditor-plugin-settings');
      if ($ckeditorPluginSettings.length) {
        // Hide all button-dependent plugin settings initially.
        $ckeditorPluginSettings.find('[data-ckeditor-buttons]').each(function () {
          var $this = $(this);
          if ($this.data('verticalTab')) {
            $this.data('verticalTab').tabHide();
          }
          else {
            // On very narrow viewports, Vertical Tabs are disabled.
            $this.hide();
          }
          $this.data('ckeditorButtonPluginSettingsActiveButtons', []);
        });

        // Whenever a button is added or removed, check if we should show or
        // hide the corresponding plugin settings. (Note that upon
        // initialization, each button that already is part of the toolbar still
        // is considered "added", hence it also works correctly for buttons that
        // were added previously.)
        $context
          .find('.ckeditor-toolbar-active')
          .off('CKEditorToolbarChanged.ckeditorAdminPluginSettings')
          .on('CKEditorToolbarChanged.ckeditorAdminPluginSettings', function (event, action, button) {
            var $pluginSettings = $ckeditorPluginSettings
              .find('[data-ckeditor-buttons~=' + button + ']');

            // No settings for this button.
            if ($pluginSettings.length === 0) {
              return;
            }

            var verticalTab = $pluginSettings.data('verticalTab');
            var activeButtons = $pluginSettings.data('ckeditorButtonPluginSettingsActiveButtons');
            if (action === 'added') {
              activeButtons.push(button);
              // Show this plugin's settings if >=1 of its buttons are active.
              if (verticalTab) {
                verticalTab.tabShow();
              }
              else {
                // On very narrow viewports, Vertical Tabs remain fieldsets.
                $pluginSettings.show();
              }

            }
            else {
              // Remove this button from the list of active buttons.
              activeButtons.splice(activeButtons.indexOf(button), 1);
              // Show this plugin's settings 0 of its buttons are active.
              if (activeButtons.length === 0) {
                if (verticalTab) {
                  verticalTab.tabHide();
                }
                else {
                  // On very narrow viewports, Vertical Tabs are disabled.
                  $pluginSettings.hide();
                }
              }
            }
            $pluginSettings.data('ckeditorButtonPluginSettingsActiveButtons', activeButtons);
          });
      }
    }
  };

  /**
   * Themes a blank CKEditor row.
   *
   * @return {string}
   *   A HTML string for a CKEditor row.
   */
  Drupal.theme.ckeditorRow = function () {
    return '<li class="ckeditor-row placeholder" role="group"><ul class="ckeditor-toolbar-groups clearfix"></ul></li>';
  };

  /**
   * Themes a blank CKEditor button group.
   *
   * @return {string}
   *   A HTML string for a CKEditor button group.
   */
  Drupal.theme.ckeditorToolbarGroup = function () {
    var group = '';
    group += '<li class="ckeditor-toolbar-group placeholder" role="presentation" aria-label="' + Drupal.t('Place a button to create a new button group.') + '">';
    group += '<h3 class="ckeditor-toolbar-group-name">' + Drupal.t('New group') + '</h3>';
    group += '<ul class="ckeditor-buttons ckeditor-toolbar-group-buttons" role="toolbar" data-drupal-ckeditor-button-sorting="target"></ul>';
    group += '</li>';
    return group;
  };

  /**
   * Themes a form for changing the title of a CKEditor button group.
   *
   * @return {string}
   *   A HTML string for the form for the title of a CKEditor button group.
   */
  Drupal.theme.ckeditorButtonGroupNameForm = function () {
    return '<form><input name="group-name" required="required"></form>';
  };

  /**
   * Themes a button that will toggle the button group names in active config.
   *
   * @return {string}
   *   A HTML string for the button to toggle group names.
   */
  Drupal.theme.ckeditorButtonGroupNamesToggle = function () {
    return '<a class="ckeditor-groupnames-toggle" role="button" aria-pressed="false"></a>';
  };

  /**
   * Themes a button that will prompt the user to name a new button group.
   *
   * @return {string}
   *   A HTML string for the button to create a name for a new button group.
   */
  Drupal.theme.ckeditorNewButtonGroup = function () {
    return '<li class="ckeditor-add-new-group"><button role="button" aria-label="' + Drupal.t('Add a CKEditor button group to the end of this row.') + '">' + Drupal.t('Add group') + '</button></li>';
  };

})(jQuery, Drupal, drupalSettings, _);
;
/**
 * @file
 * A Backbone Model for the state of a CKEditor toolbar configuration .
 */

(function (Drupal, Backbone) {

  'use strict';

  /**
   * Backbone model for the CKEditor toolbar configuration state.
   *
   * @constructor
   *
   * @augments Backbone.Model
   */
  Drupal.ckeditor.Model = Backbone.Model.extend(/** @lends Drupal.ckeditor.Model# */{

    /**
     * Default values.
     *
     * @type {object}
     */
    defaults: /** @lends Drupal.ckeditor.Model# */{

      /**
       * The CKEditor configuration that is being manipulated through the UI.
       */
      activeEditorConfig: null,

      /**
       * The textarea that contains the serialized representation of the active
       * CKEditor configuration.
       */
      $textarea: null,

      /**
       * Tracks whether the active toolbar DOM structure has been changed. When
       * true, activeEditorConfig needs to be updated, and when that is updated,
       * $textarea will also be updated.
       */
      isDirty: false,

      /**
       * The configuration for the hidden CKEditor instance that is used to
       * build the features metadata.
       */
      hiddenEditorConfig: null,

      /**
       * A hash that maps buttons to features.
       */
      buttonsToFeatures: null,

      /**
       * A hash, keyed by a feature name, that details CKEditor plugin features.
       */
      featuresMetadata: null,

      /**
       * Whether the button group names are currently visible.
       */
      groupNamesVisible: false
    },

    /**
     * @method
     */
    sync: function () {
      // Push the settings into the textarea.
      this.get('$textarea').val(JSON.stringify(this.get('activeEditorConfig')));
    }
  });

})(Drupal, Backbone);
;
/**
 * @file
 * A Backbone View that provides the aural view of CKEditor toolbar
 * configuration.
 */

(function (Drupal, Backbone, $) {

  'use strict';

  Drupal.ckeditor.AuralView = Backbone.View.extend(/** @lends Drupal.ckeditor.AuralView# */{

    /**
     * @type {object}
     */
    events: {
      'click .ckeditor-buttons a': 'announceButtonHelp',
      'click .ckeditor-multiple-buttons a': 'announceSeparatorHelp',
      'focus .ckeditor-button a': 'onFocus',
      'focus .ckeditor-button-separator a': 'onFocus',
      'focus .ckeditor-toolbar-group': 'onFocus'
    },

    /**
     * Backbone View for CKEditor toolbar configuration; aural UX (output only).
     *
     * @constructs
     *
     * @augments Backbone.View
     */
    initialize: function () {
      // Announce the button and group positions when the model is no longer
      // dirty.
      this.listenTo(this.model, 'change:isDirty', this.announceMove);
    },

    /**
     * Calls announce on buttons and groups when their position is changed.
     *
     * @param {Drupal.ckeditor.ConfigurationModel} model
     *   The ckeditor configuration model.
     * @param {bool} isDirty
     *   A model attribute that indicates if the changed toolbar configuration
     *   has been stored or not.
     */
    announceMove: function (model, isDirty) {
      // Announce the position of a button or group after the model has been
      // updated.
      if (!isDirty) {
        var item = document.activeElement || null;
        if (item) {
          var $item = $(item);
          if ($item.hasClass('ckeditor-toolbar-group')) {
            this.announceButtonGroupPosition($item);
          }
          else if ($item.parent().hasClass('ckeditor-button')) {
            this.announceButtonPosition($item.parent());
          }
        }
      }
    },

    /**
     * Handles the focus event of elements in the active and available toolbars.
     *
     * @param {jQuery.Event} event
     *   The focus event that was triggered.
     */
    onFocus: function (event) {
      event.stopPropagation();

      var $originalTarget = $(event.target);
      var $currentTarget = $(event.currentTarget);
      var $parent = $currentTarget.parent();
      if ($parent.hasClass('ckeditor-button') || $parent.hasClass('ckeditor-button-separator')) {
        this.announceButtonPosition($currentTarget.parent());
      }
      else if ($originalTarget.attr('role') !== 'button' && $currentTarget.hasClass('ckeditor-toolbar-group')) {
        this.announceButtonGroupPosition($currentTarget);
      }
    },

    /**
     * Announces the current position of a button group.
     *
     * @param {jQuery} $group
     *   A jQuery set that contains an li element that wraps a group of buttons.
     */
    announceButtonGroupPosition: function ($group) {
      var $groups = $group.parent().children();
      var $row = $group.closest('.ckeditor-row');
      var $rows = $row.parent().children();
      var position = $groups.index($group) + 1;
      var positionCount = $groups.not('.placeholder').length;
      var row = $rows.index($row) + 1;
      var rowCount = $rows.not('.placeholder').length;
      var text = Drupal.t('@groupName button group in position @position of @positionCount in row @row of @rowCount.', {
        '@groupName': $group.attr('data-drupal-ckeditor-toolbar-group-name'),
        '@position': position,
        '@positionCount': positionCount,
        '@row': row,
        '@rowCount': rowCount
      });
      // If this position is the first in the last row then tell the user that
      // pressing the down arrow key will create a new row.
      if (position === 1 && row === rowCount) {
        text += '\n';
        text += Drupal.t('Press the down arrow key to create a new row.');
      }
      Drupal.announce(text, 'assertive');
    },

    /**
     * Announces current button position.
     *
     * @param {jQuery} $button
     *   A jQuery set that contains an li element that wraps a button.
     */
    announceButtonPosition: function ($button) {
      var $row = $button.closest('.ckeditor-row');
      var $rows = $row.parent().children();
      var $buttons = $button.closest('.ckeditor-buttons').children();
      var $group = $button.closest('.ckeditor-toolbar-group');
      var $groups = $group.parent().children();
      var groupPosition = $groups.index($group) + 1;
      var groupPositionCount = $groups.not('.placeholder').length;
      var position = $buttons.index($button) + 1;
      var positionCount = $buttons.length;
      var row = $rows.index($row) + 1;
      var rowCount = $rows.not('.placeholder').length;
      // The name of the button separator is 'button separator' and its type
      // is 'separator', so we do not want to print the type of this item,
      // otherwise the UA will speak 'button separator separator'.
      var type = ($button.attr('data-drupal-ckeditor-type') === 'separator') ? '' : Drupal.t('button');
      var text;
      // The button is located in the available button set.
      if ($button.closest('.ckeditor-toolbar-disabled').length > 0) {
        text = Drupal.t('@name @type.', {
          '@name': $button.children().attr('aria-label'),
          '@type': type
        });
        text += '\n' + Drupal.t('Press the down arrow key to activate.');

        Drupal.announce(text, 'assertive');
      }
      // The button is in the active toolbar.
      else if ($group.not('.placeholder').length === 1) {
        text = Drupal.t('@name @type in position @position of @positionCount in @groupName button group in row @row of @rowCount.', {
          '@name': $button.children().attr('aria-label'),
          '@type': type,
          '@position': position,
          '@positionCount': positionCount,
          '@groupName': $group.attr('data-drupal-ckeditor-toolbar-group-name'),
          '@row': row,
          '@rowCount': rowCount
        });
        // If this position is the first in the last row then tell the user that
        // pressing the down arrow key will create a new row.
        if (groupPosition === 1 && position === 1 && row === rowCount) {
          text += '\n';
          text += Drupal.t('Press the down arrow key to create a new button group in a new row.');
        }
        // If this position is the last one in this row then tell the user that
        // moving the button to the next group will create a new group.
        if (groupPosition === groupPositionCount && position === positionCount) {
          text += '\n';
          text += Drupal.t('This is the last group. Move the button forward to create a new group.');
        }
        Drupal.announce(text, 'assertive');
      }
    },

    /**
     * Provides help information when a button is clicked.
     *
     * @param {jQuery.Event} event
     *   The click event for the button click.
     */
    announceButtonHelp: function (event) {
      var $link = $(event.currentTarget);
      var $button = $link.parent();
      var enabled = $button.closest('.ckeditor-toolbar-active').length > 0;
      var message;

      if (enabled) {
        message = Drupal.t('The "@name" button is currently enabled.', {
          '@name': $link.attr('aria-label')
        });
        message += '\n' + Drupal.t('Use the keyboard arrow keys to change the position of this button.');
        message += '\n' + Drupal.t('Press the up arrow key on the top row to disable the button.');
      }
      else {
        message = Drupal.t('The "@name" button is currently disabled.', {
          '@name': $link.attr('aria-label')
        });
        message += '\n' + Drupal.t('Use the down arrow key to move this button into the active toolbar.');
      }
      Drupal.announce(message);
      event.preventDefault();
    },

    /**
     * Provides help information when a separator is clicked.
     *
     * @param {jQuery.Event} event
     *   The click event for the separator click.
     */
    announceSeparatorHelp: function (event) {
      var $link = $(event.currentTarget);
      var $button = $link.parent();
      var enabled = $button.closest('.ckeditor-toolbar-active').length > 0;
      var message;

      if (enabled) {
        message = Drupal.t('This @name is currently enabled.', {
          '@name': $link.attr('aria-label')
        });
        message += '\n' + Drupal.t('Use the keyboard arrow keys to change the position of this separator.');
      }
      else {
        message = Drupal.t('Separators are used to visually split individual buttons.');
        message += '\n' + Drupal.t('This @name is currently disabled.', {
          '@name': $link.attr('aria-label')
        });
        message += '\n' + Drupal.t('Use the down arrow key to move this separator into the active toolbar.');
        message += '\n' + Drupal.t('You may add multiple separators to each button group.');
      }
      Drupal.announce(message);
      event.preventDefault();
    }
  });

})(Drupal, Backbone, jQuery);
;
/**
 * @file
 * Backbone View providing the aural view of CKEditor keyboard UX configuration.
 */

(function ($, Drupal, Backbone, _) {

  'use strict';

  Drupal.ckeditor.KeyboardView = Backbone.View.extend(/** @lends Drupal.ckeditor.KeyboardView# */{

    /**
     * Backbone View for CKEditor toolbar configuration; keyboard UX.
     *
     * @constructs
     *
     * @augments Backbone.View
     */
    initialize: function () {
      // Add keyboard arrow support.
      this.$el.on('keydown.ckeditor', '.ckeditor-buttons a, .ckeditor-multiple-buttons a', this.onPressButton.bind(this));
      this.$el.on('keydown.ckeditor', '[data-drupal-ckeditor-type="group"]', this.onPressGroup.bind(this));
    },

    /**
     * @inheritdoc
     */
    render: function () {
    },

    /**
     * Handles keypresses on a CKEditor configuration button.
     *
     * @param {jQuery.Event} event
     *   The keypress event triggered.
     */
    onPressButton: function (event) {
      var upDownKeys = [
        38, // Up arrow.
        63232, // Safari up arrow.
        40, // Down arrow.
        63233 // Safari down arrow.
      ];
      var leftRightKeys = [
        37, // Left arrow.
        63234, // Safari left arrow.
        39, // Right arrow.
        63235 // Safari right arrow.
      ];

      // Respond to an enter key press. Prevent the bubbling of the enter key
      // press to the button group parent element.
      if (event.keyCode === 13) {
        event.stopPropagation();
      }

      // Only take action when a direction key is pressed.
      if (_.indexOf(_.union(upDownKeys, leftRightKeys), event.keyCode) > -1) {
        var view = this;
        var $target = $(event.currentTarget);
        var $button = $target.parent();
        var $container = $button.parent();
        var $group = $button.closest('.ckeditor-toolbar-group');
        var $row = $button.closest('.ckeditor-row');
        var containerType = $container.data('drupal-ckeditor-button-sorting');
        var $availableButtons = this.$el.find('[data-drupal-ckeditor-button-sorting="source"]');
        var $activeButtons = this.$el.find('.ckeditor-toolbar-active');
        // The current location of the button, just in case it needs to be put
        // back.
        var $originalGroup = $group;
        var dir;

        // Move available buttons between their container and the active
        // toolbar.
        if (containerType === 'source') {
          // Move the button to the active toolbar configuration when the down
          // or up keys are pressed.
          if (_.indexOf([40, 63233], event.keyCode) > -1) {
            // Move the button to the first row, first button group index
            // position.
            $activeButtons.find('.ckeditor-toolbar-group-buttons').eq(0).prepend($button);
          }
        }
        else if (containerType === 'target') {
          // Move buttons between sibling buttons in a group and between groups.
          if (_.indexOf(leftRightKeys, event.keyCode) > -1) {
            // Move left.
            var $siblings = $container.children();
            var index = $siblings.index($button);
            if (_.indexOf([37, 63234], event.keyCode) > -1) {
              // Move between sibling buttons.
              if (index > 0) {
                $button.insertBefore($container.children().eq(index - 1));
              }
              // Move between button groups and rows.
              else {
                // Move between button groups.
                $group = $container.parent().prev();
                if ($group.length > 0) {
                  $group.find('.ckeditor-toolbar-group-buttons').append($button);
                }
                // Wrap between rows.
                else {
                  $container.closest('.ckeditor-row').prev().find('.ckeditor-toolbar-group').not('.placeholder').find('.ckeditor-toolbar-group-buttons').eq(-1).append($button);
                }
              }
            }
            // Move right.
            else if (_.indexOf([39, 63235], event.keyCode) > -1) {
              // Move between sibling buttons.
              if (index < ($siblings.length - 1)) {
                $button.insertAfter($container.children().eq(index + 1));
              }
              // Move between button groups. Moving right at the end of a row
              // will create a new group.
              else {
                $container.parent().next().find('.ckeditor-toolbar-group-buttons').prepend($button);
              }
            }
          }
          // Move buttons between rows and the available button set.
          else if (_.indexOf(upDownKeys, event.keyCode) > -1) {
            dir = (_.indexOf([38, 63232], event.keyCode) > -1) ? 'prev' : 'next';
            $row = $container.closest('.ckeditor-row')[dir]();
            // Move the button back into the available button set.
            if (dir === 'prev' && $row.length === 0) {
              // If this is a divider, just destroy it.
              if ($button.data('drupal-ckeditor-type') === 'separator') {
                $button
                  .off()
                  .remove();
                // Focus on the first button in the active toolbar.
                $activeButtons.find('.ckeditor-toolbar-group-buttons').eq(0).children().eq(0).children().trigger('focus');
              }
              // Otherwise, move it.
              else {
                $availableButtons.prepend($button);
              }
            }
            else {
              $row.find('.ckeditor-toolbar-group-buttons').eq(0).prepend($button);
            }
          }
        }
        // Move dividers between their container and the active toolbar.
        else if (containerType === 'dividers') {
          // Move the button to the active toolbar configuration when the down
          // or up keys are pressed.
          if (_.indexOf([40, 63233], event.keyCode) > -1) {
            // Move the button to the first row, first button group index
            // position.
            $button = $button.clone(true);
            $activeButtons.find('.ckeditor-toolbar-group-buttons').eq(0).prepend($button);
            $target = $button.children();
          }
        }

        view = this;
        // Attempt to move the button to the new toolbar position.
        Drupal.ckeditor.registerButtonMove(this, $button, function (result) {

          // Put the button back if the registration failed.
          // If the button was in a row, then it was in the active toolbar
          // configuration. The button was probably placed in a new group, but
          // that action was canceled.
          if (!result && $originalGroup) {
            $originalGroup.find('.ckeditor-buttons').append($button);
          }
          // Otherwise refresh the sortables to acknowledge the new button
          // positions.
          else {
            view.$el.find('.ui-sortable').sortable('refresh');
          }
          // Refocus the target button so that the user can continue from a
          // known place.
          $target.trigger('focus');
        });

        event.preventDefault();
        event.stopPropagation();
      }
    },

    /**
     * Handles keypresses on a CKEditor configuration group.
     *
     * @param {jQuery.Event} event
     *   The keypress event triggered.
     */
    onPressGroup: function (event) {
      var upDownKeys = [
        38, // Up arrow.
        63232, // Safari up arrow.
        40, // Down arrow.
        63233 // Safari down arrow.
      ];
      var leftRightKeys = [
        37, // Left arrow.
        63234, // Safari left arrow.
        39, // Right arrow.
        63235 // Safari right arrow.
      ];

      // Respond to an enter key press.
      if (event.keyCode === 13) {
        var view = this;
        // Open the group renaming dialog in the next evaluation cycle so that
        // this event can be cancelled and the bubbling wiped out. Otherwise,
        // Firefox has issues because the page focus is shifted to the dialog
        // along with the keydown event.
        window.setTimeout(function () {
          Drupal.ckeditor.openGroupNameDialog(view, $(event.currentTarget));
        }, 0);
        event.preventDefault();
        event.stopPropagation();
      }

      // Respond to direction key presses.
      if (_.indexOf(_.union(upDownKeys, leftRightKeys), event.keyCode) > -1) {
        var $group = $(event.currentTarget);
        var $container = $group.parent();
        var $siblings = $container.children();
        var index;
        var dir;
        // Move groups between sibling groups.
        if (_.indexOf(leftRightKeys, event.keyCode) > -1) {
          index = $siblings.index($group);
          // Move left between sibling groups.
          if ((_.indexOf([37, 63234], event.keyCode) > -1)) {
            if (index > 0) {
              $group.insertBefore($siblings.eq(index - 1));
            }
            // Wrap between rows. Insert the group before the placeholder group
            // at the end of the previous row.
            else {
              $group.insertBefore($container.closest('.ckeditor-row').prev().find('.ckeditor-toolbar-groups').children().eq(-1));
            }
          }
          // Move right between sibling groups.
          else if (_.indexOf([39, 63235], event.keyCode) > -1) {
            // Move to the right if the next group is not a placeholder.
            if (!$siblings.eq(index + 1).hasClass('placeholder')) {
              $group.insertAfter($container.children().eq(index + 1));
            }
            // Wrap group between rows.
            else {
              $container.closest('.ckeditor-row').next().find('.ckeditor-toolbar-groups').prepend($group);
            }
          }

        }
        // Move groups between rows.
        else if (_.indexOf(upDownKeys, event.keyCode) > -1) {
          dir = (_.indexOf([38, 63232], event.keyCode) > -1) ? 'prev' : 'next';
          $group.closest('.ckeditor-row')[dir]().find('.ckeditor-toolbar-groups').eq(0).prepend($group);
        }

        Drupal.ckeditor.registerGroupMove(this, $group);
        $group.trigger('focus');
        event.preventDefault();
        event.stopPropagation();
      }
    }
  });

})(jQuery, Drupal, Backbone, _);
;
/**
 * @file
 * A Backbone View acting as a controller for CKEditor toolbar configuration.
 */

(function ($, Drupal, Backbone, CKEDITOR, _) {

  'use strict';

  Drupal.ckeditor.ControllerView = Backbone.View.extend(/** @lends Drupal.ckeditor.ControllerView# */{

    /**
     * @type {object}
     */
    events: {},

    /**
     * Backbone View acting as a controller for CKEditor toolbar configuration.
     *
     * @constructs
     *
     * @augments Backbone.View
     */
    initialize: function () {
      this.getCKEditorFeatures(this.model.get('hiddenEditorConfig'), this.disableFeaturesDisallowedByFilters.bind(this));

      // Push the active editor configuration to the textarea.
      this.model.listenTo(this.model, 'change:activeEditorConfig', this.model.sync);
      this.listenTo(this.model, 'change:isDirty', this.parseEditorDOM);
    },

    /**
     * Converts the active toolbar DOM structure to an object representation.
     *
     * @param {Drupal.ckeditor.ConfigurationModel} model
     *   The state model for the CKEditor configuration.
     * @param {bool} isDirty
     *   Tracks whether the active toolbar DOM structure has been changed.
     *   isDirty is toggled back to false in this method.
     * @param {object} options
     *   An object that includes:
     * @param {bool} [options.broadcast]
     *   A flag that controls whether a CKEditorToolbarChanged event should be
     *   fired for configuration changes.
     *
     * @fires event:CKEditorToolbarChanged
     */
    parseEditorDOM: function (model, isDirty, options) {
      if (isDirty) {
        var currentConfig = this.model.get('activeEditorConfig');

        // Process the rows.
        var rows = [];
        this.$el
          .find('.ckeditor-active-toolbar-configuration')
          .children('.ckeditor-row').each(function () {
            var groups = [];
            // Process the button groups.
            $(this).find('.ckeditor-toolbar-group').each(function () {
              var $group = $(this);
              var $buttons = $group.find('.ckeditor-button');
              if ($buttons.length) {
                var group = {
                  name: $group.attr('data-drupal-ckeditor-toolbar-group-name'),
                  items: []
                };
                $group.find('.ckeditor-button, .ckeditor-multiple-button').each(function () {
                  group.items.push($(this).attr('data-drupal-ckeditor-button-name'));
                });
                groups.push(group);
              }
            });
            if (groups.length) {
              rows.push(groups);
            }
          });
        this.model.set('activeEditorConfig', rows);
        // Mark the model as clean. Whether or not the sync to the textfield
        // occurs depends on the activeEditorConfig attribute firing a change
        // event. The DOM has at least been processed and posted, so as far as
        // the model is concerned, it is clean.
        this.model.set('isDirty', false);

        // Determine whether we should trigger an event.
        if (options.broadcast !== false) {
          var prev = this.getButtonList(currentConfig);
          var next = this.getButtonList(rows);
          if (prev.length !== next.length) {
            this.$el
              .find('.ckeditor-toolbar-active')
              .trigger('CKEditorToolbarChanged', [
                (prev.length < next.length) ? 'added' : 'removed',
                _.difference(_.union(prev, next), _.intersection(prev, next))[0]
              ]);
          }
        }
      }
    },

    /**
     * Asynchronously retrieve the metadata for all available CKEditor features.
     *
     * In order to get a list of all features needed by CKEditor, we create a
     * hidden CKEditor instance, then check the CKEditor's "allowedContent"
     * filter settings. Because creating an instance is expensive, a callback
     * must be provided that will receive a hash of {@link Drupal.EditorFeature}
     * features keyed by feature (button) name.
     *
     * @param {object} CKEditorConfig
     *   An object that represents the configuration settings for a CKEditor
     *   editor component.
     * @param {function} callback
     *   A function to invoke when the instanceReady event is fired by the
     *   CKEditor object.
     */
    getCKEditorFeatures: function (CKEditorConfig, callback) {
      var getProperties = function (CKEPropertiesList) {
        return (_.isObject(CKEPropertiesList)) ? _.keys(CKEPropertiesList) : [];
      };

      var convertCKERulesToEditorFeature = function (feature, CKEFeatureRules) {
        for (var i = 0; i < CKEFeatureRules.length; i++) {
          var CKERule = CKEFeatureRules[i];
          var rule = new Drupal.EditorFeatureHTMLRule();

          // Tags.
          var tags = getProperties(CKERule.elements);
          rule.required.tags = (CKERule.propertiesOnly) ? [] : tags;
          rule.allowed.tags = tags;
          // Attributes.
          rule.required.attributes = getProperties(CKERule.requiredAttributes);
          rule.allowed.attributes = getProperties(CKERule.attributes);
          // Styles.
          rule.required.styles = getProperties(CKERule.requiredStyles);
          rule.allowed.styles = getProperties(CKERule.styles);
          // Classes.
          rule.required.classes = getProperties(CKERule.requiredClasses);
          rule.allowed.classes = getProperties(CKERule.classes);
          // Raw.
          rule.raw = CKERule;

          feature.addHTMLRule(rule);
        }
      };

      // Create hidden CKEditor with all features enabled, retrieve metadata.
      // @see \Drupal\ckeditor\Plugin\Editor\CKEditor::settingsForm.
      var hiddenCKEditorID = 'ckeditor-hidden';
      if (CKEDITOR.instances[hiddenCKEditorID]) {
        CKEDITOR.instances[hiddenCKEditorID].destroy(true);
      }
      // Load external plugins, if any.
      var hiddenEditorConfig = this.model.get('hiddenEditorConfig');
      if (hiddenEditorConfig.drupalExternalPlugins) {
        var externalPlugins = hiddenEditorConfig.drupalExternalPlugins;
        for (var pluginName in externalPlugins) {
          if (externalPlugins.hasOwnProperty(pluginName)) {
            CKEDITOR.plugins.addExternal(pluginName, externalPlugins[pluginName], '');
          }
        }
      }
      CKEDITOR.inline($('#' + hiddenCKEditorID).get(0), CKEditorConfig);

      // Once the instance is ready, retrieve the allowedContent filter rules
      // and convert them to Drupal.EditorFeature objects.
      CKEDITOR.once('instanceReady', function (e) {
        if (e.editor.name === hiddenCKEditorID) {
          // First collect all CKEditor allowedContent rules.
          var CKEFeatureRulesMap = {};
          var rules = e.editor.filter.allowedContent;
          var rule;
          var name;
          for (var i = 0; i < rules.length; i++) {
            rule = rules[i];
            name = rule.featureName || ':(';
            if (!CKEFeatureRulesMap[name]) {
              CKEFeatureRulesMap[name] = [];
            }
            CKEFeatureRulesMap[name].push(rule);
          }

          // Now convert these to Drupal.EditorFeature objects. And track which
          // buttons are mapped to which features.
          // @see getFeatureForButton()
          var features = {};
          var buttonsToFeatures = {};
          for (var featureName in CKEFeatureRulesMap) {
            if (CKEFeatureRulesMap.hasOwnProperty(featureName)) {
              var feature = new Drupal.EditorFeature(featureName);
              convertCKERulesToEditorFeature(feature, CKEFeatureRulesMap[featureName]);
              features[featureName] = feature;
              var command = e.editor.getCommand(featureName);
              if (command) {
                buttonsToFeatures[command.uiItems[0].name] = featureName;
              }
            }
          }

          callback(features, buttonsToFeatures);
        }
      });
    },

    /**
     * Retrieves the feature for a given button from featuresMetadata. Returns
     * false if the given button is in fact a divider.
     *
     * @param {string} button
     *   The name of a CKEditor button.
     *
     * @return {object}
     *   The feature metadata object for a button.
     */
    getFeatureForButton: function (button) {
      // Return false if the button being added is a divider.
      if (button === '-') {
        return false;
      }

      // Get a Drupal.editorFeature object that contains all metadata for
      // the feature that was just added or removed. Not every feature has
      // such metadata.
      var featureName = this.model.get('buttonsToFeatures')[button.toLowerCase()];
      // Features without an associated command do not have a 'feature name' by
      // default, so we use the lowercased button name instead.
      if (!featureName) {
        featureName = button.toLowerCase();
      }
      var featuresMetadata = this.model.get('featuresMetadata');
      if (!featuresMetadata[featureName]) {
        featuresMetadata[featureName] = new Drupal.EditorFeature(featureName);
        this.model.set('featuresMetadata', featuresMetadata);
      }
      return featuresMetadata[featureName];
    },

    /**
     * Checks buttons against filter settings; disables disallowed buttons.
     *
     * @param {object} features
     *   A map of {@link Drupal.EditorFeature} objects.
     * @param {object} buttonsToFeatures
     *   Object containing the button-to-feature mapping.
     *
     * @see Drupal.ckeditor.ControllerView#getFeatureForButton
     */
    disableFeaturesDisallowedByFilters: function (features, buttonsToFeatures) {
      this.model.set('featuresMetadata', features);
      // Store the button-to-feature mapping. Needs to happen only once, because
      // the same buttons continue to have the same features; only the rules for
      // specific features may change.
      // @see getFeatureForButton()
      this.model.set('buttonsToFeatures', buttonsToFeatures);

      // Ensure that toolbar configuration changes are broadcast.
      this.broadcastConfigurationChanges(this.$el);

      // Initialization: not all of the default toolbar buttons may be allowed
      // by the current filter settings. Remove any of the default toolbar
      // buttons that require more permissive filter settings. The remaining
      // default toolbar buttons are marked as "added".
      var existingButtons = [];
      // Loop through each button group after flattening the groups from the
      // toolbar row arrays.
      var buttonGroups = _.flatten(this.model.get('activeEditorConfig'));
      for (var i = 0; i < buttonGroups.length; i++) {
        // Pull the button names from each toolbar button group.
        var buttons = buttonGroups[i].items;
        for (var k = 0; k < buttons.length; k++) {
          existingButtons.push(buttons[k]);
        }
      }
      // Remove duplicate buttons.
      existingButtons = _.unique(existingButtons);
      // Prepare the active toolbar and available-button toolbars.
      for (var n = 0; n < existingButtons.length; n++) {
        var button = existingButtons[n];
        var feature = this.getFeatureForButton(button);
        // Skip dividers.
        if (feature === false) {
          continue;
        }

        if (Drupal.editorConfiguration.featureIsAllowedByFilters(feature)) {
          // Existing toolbar buttons are in fact "added features".
          this.$el.find('.ckeditor-toolbar-active').trigger('CKEditorToolbarChanged', ['added', existingButtons[n]]);
        }
        else {
          // Move the button element from the active the active toolbar to the
          // list of available buttons.
          $('.ckeditor-toolbar-active li[data-drupal-ckeditor-button-name="' + button + '"]')
            .detach()
            .appendTo('.ckeditor-toolbar-disabled > .ckeditor-toolbar-available > ul');
          // Update the toolbar value field.
          this.model.set({isDirty: true}, {broadcast: false});
        }
      }
    },

    /**
     * Sets up broadcasting of CKEditor toolbar configuration changes.
     *
     * @param {jQuery} $ckeditorToolbar
     *   The active toolbar DOM element wrapped in jQuery.
     */
    broadcastConfigurationChanges: function ($ckeditorToolbar) {
      var view = this;
      var hiddenEditorConfig = this.model.get('hiddenEditorConfig');
      var getFeatureForButton = this.getFeatureForButton.bind(this);
      var getCKEditorFeatures = this.getCKEditorFeatures.bind(this);
      $ckeditorToolbar
        .find('.ckeditor-toolbar-active')
        // Listen for CKEditor toolbar configuration changes. When a button is
        // added/removed, call an appropriate Drupal.editorConfiguration method.
        .on('CKEditorToolbarChanged.ckeditorAdmin', function (event, action, button) {
          var feature = getFeatureForButton(button);

          // Early-return if the button being added is a divider.
          if (feature === false) {
            return;
          }

          // Trigger a standardized text editor configuration event to indicate
          // whether a feature was added or removed, so that filters can react.
          var configEvent = (action === 'added') ? 'addedFeature' : 'removedFeature';
          Drupal.editorConfiguration[configEvent](feature);
        })
        // Listen for CKEditor plugin settings changes. When a plugin setting is
        // changed, rebuild the CKEditor features metadata.
        .on('CKEditorPluginSettingsChanged.ckeditorAdmin', function (event, settingsChanges) {
          // Update hidden CKEditor configuration.
          for (var key in settingsChanges) {
            if (settingsChanges.hasOwnProperty(key)) {
              hiddenEditorConfig[key] = settingsChanges[key];
            }
          }

          // Retrieve features for the updated hidden CKEditor configuration.
          getCKEditorFeatures(hiddenEditorConfig, function (features) {
            // Trigger a standardized text editor configuration event for each
            // feature that was modified by the configuration changes.
            var featuresMetadata = view.model.get('featuresMetadata');
            for (var name in features) {
              if (features.hasOwnProperty(name)) {
                var feature = features[name];
                if (featuresMetadata.hasOwnProperty(name) && !_.isEqual(featuresMetadata[name], feature)) {
                  Drupal.editorConfiguration.modifiedFeature(feature);
                }
              }
            }
            // Update the CKEditor features metadata.
            view.model.set('featuresMetadata', features);
          });
        });
    },

    /**
     * Returns the list of buttons from an editor configuration.
     *
     * @param {object} config
     *   A CKEditor configuration object.
     *
     * @return {Array}
     *   A list of buttons in the CKEditor configuration.
     */
    getButtonList: function (config) {
      var buttons = [];
      // Remove the rows.
      config = _.flatten(config);

      // Loop through the button groups and pull out the buttons.
      config.forEach(function (group) {
        group.items.forEach(function (button) {
          buttons.push(button);
        });
      });

      // Remove the dividing elements if any.
      return _.without(buttons, '-');
    }
  });

})(jQuery, Drupal, Backbone, CKEDITOR, _);
;
/**
 * @file
 * A Backbone View that provides the visual UX view of CKEditor toolbar
 *   configuration.
 */

(function (Drupal, Backbone, $) {

  'use strict';

  Drupal.ckeditor.VisualView = Backbone.View.extend(/** @lends Drupal.ckeditor.VisualView# */{

    events: {
      'click .ckeditor-toolbar-group-name': 'onGroupNameClick',
      'click .ckeditor-groupnames-toggle': 'onGroupNamesToggleClick',
      'click .ckeditor-add-new-group button': 'onAddGroupButtonClick'
    },

    /**
     * Backbone View for CKEditor toolbar configuration; visual UX.
     *
     * @constructs
     *
     * @augments Backbone.View
     */
    initialize: function () {
      this.listenTo(this.model, 'change:isDirty change:groupNamesVisible', this.render);

      // Add a toggle for the button group names.
      $(Drupal.theme('ckeditorButtonGroupNamesToggle'))
        .prependTo(this.$el.find('#ckeditor-active-toolbar').parent());

      this.render();
    },

    /**
     * Render function for rendering the toolbar configuration.
     *
     * @param {*} model
     *   Model used for the view.
     * @param {string} [value]
     *   The value that was changed.
     * @param {object} changedAttributes
     *   The attributes that was changed.
     *
     * @return {Drupal.ckeditor.VisualView}
     *   The {@link Drupal.ckeditor.VisualView} object.
     */
    render: function (model, value, changedAttributes) {
      this.insertPlaceholders();
      this.applySorting();

      // Toggle button group names.
      var groupNamesVisible = this.model.get('groupNamesVisible');
      // If a button was just placed in the active toolbar, ensure that the
      // button group names are visible.
      if (changedAttributes && changedAttributes.changes && changedAttributes.changes.isDirty) {
        this.model.set({groupNamesVisible: true}, {silent: true});
        groupNamesVisible = true;
      }
      this.$el.find('[data-toolbar="active"]').toggleClass('ckeditor-group-names-are-visible', groupNamesVisible);
      this.$el.find('.ckeditor-groupnames-toggle')
        .text((groupNamesVisible) ? Drupal.t('Hide group names') : Drupal.t('Show group names'))
        .attr('aria-pressed', groupNamesVisible);

      return this;
    },

    /**
     * Handles clicks to a button group name.
     *
     * @param {jQuery.Event} event
     *   The click event on the button group.
     */
    onGroupNameClick: function (event) {
      var $group = $(event.currentTarget).closest('.ckeditor-toolbar-group');
      Drupal.ckeditor.openGroupNameDialog(this, $group);

      event.stopPropagation();
      event.preventDefault();
    },

    /**
     * Handles clicks on the button group names toggle button.
     *
     * @param {jQuery.Event} event
     *   The click event on the toggle button.
     */
    onGroupNamesToggleClick: function (event) {
      this.model.set('groupNamesVisible', !this.model.get('groupNamesVisible'));
      event.preventDefault();
    },

    /**
     * Prompts the user to provide a name for a new button group; inserts it.
     *
     * @param {jQuery.Event} event
     *   The event of the button click.
     */
    onAddGroupButtonClick: function (event) {

      /**
       * Inserts a new button if the openGroupNameDialog function returns true.
       *
       * @param {bool} success
       *   A flag that indicates if the user created a new group (true) or
       *   canceled out of the dialog (false).
       * @param {jQuery} $group
       *   A jQuery DOM fragment that represents the new button group. It has
       *   not been added to the DOM yet.
       */
      function insertNewGroup(success, $group) {
        if (success) {
          $group.appendTo($(event.currentTarget).closest('.ckeditor-row').children('.ckeditor-toolbar-groups'));
          // Focus on the new group.
          $group.trigger('focus');
        }
      }

      // Pass in a DOM fragment of a placeholder group so that the new group
      // name can be applied to it.
      Drupal.ckeditor.openGroupNameDialog(this, $(Drupal.theme('ckeditorToolbarGroup')), insertNewGroup);

      event.preventDefault();
    },

    /**
     * Handles jQuery Sortable stop sort of a button group.
     *
     * @param {jQuery.Event} event
     *   The event triggered on the group drag.
     * @param {object} ui
     *   A jQuery.ui.sortable argument that contains information about the
     *   elements involved in the sort action.
     */
    endGroupDrag: function (event, ui) {
      var view = this;
      Drupal.ckeditor.registerGroupMove(this, ui.item, function (success) {
        if (!success) {
          // Cancel any sorting in the configuration area.
          view.$el.find('.ckeditor-toolbar-configuration').find('.ui-sortable').sortable('cancel');
        }
      });
    },

    /**
     * Handles jQuery Sortable start sort of a button.
     *
     * @param {jQuery.Event} event
     *   The event triggered on the group drag.
     * @param {object} ui
     *   A jQuery.ui.sortable argument that contains information about the
     *   elements involved in the sort action.
     */
    startButtonDrag: function (event, ui) {
      this.$el.find('a:focus').trigger('blur');

      // Show the button group names as soon as the user starts dragging.
      this.model.set('groupNamesVisible', true);
    },

    /**
     * Handles jQuery Sortable stop sort of a button.
     *
     * @param {jQuery.Event} event
     *   The event triggered on the button drag.
     * @param {object} ui
     *   A jQuery.ui.sortable argument that contains information about the
     *   elements involved in the sort action.
     */
    endButtonDrag: function (event, ui) {
      var view = this;
      Drupal.ckeditor.registerButtonMove(this, ui.item, function (success) {
        if (!success) {
          // Cancel any sorting in the configuration area.
          view.$el.find('.ui-sortable').sortable('cancel');
        }
        // Refocus the target button so that the user can continue from a known
        // place.
        ui.item.find('a').trigger('focus');
      });
    },

    /**
     * Invokes jQuery.sortable() on new buttons and groups in a CKEditor config.
     */
    applySorting: function () {
      // Make the buttons sortable.
      this.$el.find('.ckeditor-buttons').not('.ui-sortable').sortable({
        // Change this to .ckeditor-toolbar-group-buttons.
        connectWith: '.ckeditor-buttons',
        placeholder: 'ckeditor-button-placeholder',
        forcePlaceholderSize: true,
        tolerance: 'pointer',
        cursor: 'move',
        start: this.startButtonDrag.bind(this),
        // Sorting within a sortable.
        stop: this.endButtonDrag.bind(this)
      }).disableSelection();

      // Add the drag and drop functionality to button groups.
      this.$el.find('.ckeditor-toolbar-groups').not('.ui-sortable').sortable({
        connectWith: '.ckeditor-toolbar-groups',
        cancel: '.ckeditor-add-new-group',
        placeholder: 'ckeditor-toolbar-group-placeholder',
        forcePlaceholderSize: true,
        cursor: 'move',
        stop: this.endGroupDrag.bind(this)
      });

      // Add the drag and drop functionality to buttons.
      this.$el.find('.ckeditor-multiple-buttons li').draggable({
        connectToSortable: '.ckeditor-toolbar-active .ckeditor-buttons',
        helper: 'clone'
      });
    },

    /**
     * Wraps the invocation of methods to insert blank groups and rows.
     */
    insertPlaceholders: function () {
      this.insertPlaceholderRow();
      this.insertNewGroupButtons();
    },

    /**
     * Inserts a blank row at the bottom of the CKEditor configuration.
     */
    insertPlaceholderRow: function () {
      var $rows = this.$el.find('.ckeditor-row');
      // Add a placeholder row. to the end of the list if one does not exist.
      if (!$rows.eq(-1).hasClass('placeholder')) {
        this.$el
          .find('.ckeditor-toolbar-active')
          .children('.ckeditor-active-toolbar-configuration')
          .append(Drupal.theme('ckeditorRow'));
      }
      // Update the $rows variable to include the new row.
      $rows = this.$el.find('.ckeditor-row');
      // Remove blank rows except the last one.
      var len = $rows.length;
      $rows.filter(function (index, row) {
        // Do not remove the last row.
        if (index + 1 === len) {
          return false;
        }
        return $(row).find('.ckeditor-toolbar-group').not('.placeholder').length === 0;
      })
        // Then get all rows that are placeholders and remove them.
        .remove();
    },

    /**
     * Inserts a button in each row that will add a new CKEditor button group.
     */
    insertNewGroupButtons: function () {
      // Insert an add group button to each row.
      this.$el.find('.ckeditor-row').each(function () {
        var $row = $(this);
        var $groups = $row.find('.ckeditor-toolbar-group');
        var $button = $row.find('.ckeditor-add-new-group');
        if ($button.length === 0) {
          $row.children('.ckeditor-toolbar-groups').append(Drupal.theme('ckeditorNewButtonGroup'));
        }
        // If a placeholder group exists, make sure it's at the end of the row.
        else if (!$groups.eq(-1).hasClass('ckeditor-add-new-group')) {
          $button.appendTo($row.children('.ckeditor-toolbar-groups'));
        }
      });
    }
  });

})(Drupal, Backbone, jQuery);
;
YoastSEO="undefined"==typeof YoastSEO?{}:YoastSEO,YoastSEO.Analyzer=function(a){this.config=a,this.checkConfig(),this.init(a)},YoastSEO.Analyzer.prototype.checkConfig=function(){"undefined"==typeof this.config.text&&(this.config.text="")},YoastSEO.Analyzer.prototype.init=function(a){this.config=a,this.initDependencies(),this.formatKeyword(),this.initQueue(),this.loadWordlists(),this.__output=[],this.__store={}},YoastSEO.Analyzer.prototype.formatKeyword=function(){"undefined"!=typeof this.config.keyword&&""!==this.config.keyword&&(this.keywordRegex=new RegExp(this.preProcessor.replaceDiacritics(this.config.keyword.replace(/[-_]/," ")),"ig"),this.keywordRegexInverse=new RegExp(this.preProcessor.replaceDiacritics(this.config.keyword.replace(" ","-")),"ig"))},YoastSEO.Analyzer.prototype.initDependencies=function(){this.preProcessor=new YoastSEO.getPreProcessor(this.config.text),this.stringHelper=YoastSEO.getStringHelper(),this.analyzeScorer=new YoastSEO.AnalyzeScorer(this)},YoastSEO.Analyzer.prototype.initQueue=function(){"undefined"!=typeof this.config.queue&&0!==this.config.queue.length?this.queue=this.config.queue.slice():this.queue=YoastSEO.analyzerConfig.queue.slice()},YoastSEO.Analyzer.prototype.loadWordlists=function(){"undefined"==typeof this.config.wordsToRemove&&(this.config.wordsToRemove=YoastSEO.analyzerConfig.wordsToRemove),"undefined"==typeof this.config.stopWords&&(this.config.stopWords=YoastSEO.analyzerConfig.stopWords)},YoastSEO.Analyzer.prototype.runQueue=function(){this.queue.length>0?(this.__output=this.__output.concat(this[this.queue.shift()]()),this.runQueue()):this.score()},YoastSEO.Analyzer.prototype.wordCount=function(){return[{test:"wordCount",result:this.preProcessor.__store.wordcountNoTags}]},YoastSEO.Analyzer.prototype.keyWordCheck=function(){return""===this.config.keyword?[{test:"keywordCheck",result:0}]:void 0},YoastSEO.Analyzer.prototype.keywordDensity=function(){var a=[{test:"keywordDensity",result:0}];if(this.preProcessor.__store.wordcount>100){var b=this.keywordDensityCheck();return a[0].result=b.toFixed(1),a}},YoastSEO.Analyzer.prototype.keywordDensityCheck=function(){var a=this.keywordCount(),b=0;return 0!==a&&(b=100*(a/this.preProcessor.__store.wordcount-(a-1*a))),b},YoastSEO.Analyzer.prototype.keywordCount=function(){var a=this.preProcessor.__store.cleanText.match(this.keywordRegex),b=0;return null!==a&&(b=a.length),this.__store.keywordCount=b,b},YoastSEO.Analyzer.prototype.subHeadings=function(){var a=[{test:"subHeadings",result:{count:0,matches:0}}],b=this.preProcessor.__store.cleanTextSomeTags.match(/<h([1-6])(?:[^>]+)?>(.*?)<\/h\1>/gi);return null!==b&&(a[0].result.count=b.length,a[0].result.matches=this.subHeadingsCheck(b)),a},YoastSEO.Analyzer.prototype.subHeadingsCheck=function(a){var b;if(null===a)b=-1;else{b=0;for(var c=0;c<a.length;c++){var d=this.stringHelper.replaceString(a[c],this.config.wordsToRemove);(d.match(this.keywordRegex)||a[c].match(this.keywordRegex))&&b++}}return b},YoastSEO.Analyzer.prototype.stopwords=function(){var a=this.config.keyword,b=this.stringHelper.matchString(a,this.config.stopWords),c=null!==b?b.length:0,d="";if(null!==b)for(var e=0;e<b.length;e++)d=d+b[e]+", ";return[{test:"stopwordKeywordCount",result:{count:c,matches:d.substring(0,d.length-2)}}]},YoastSEO.Analyzer.prototype.fleschReading=function(){var a=(206.835-1.015*(this.preProcessor.__store.wordcountNoTags/this.preProcessor.__store.sentenceCountNoTags)-84.6*(this.preProcessor.__store.syllablecount/this.preProcessor.__store.wordcountNoTags)).toFixed(1);return 0>a?a=0:a>100&&(a=100),[{test:"fleschReading",result:a}]},YoastSEO.Analyzer.prototype.linkCount=function(){var a=this.preProcessor.__store.originalText.match(/<a(?:[^>]+)?>(.*?)<\/a>/gi),b={total:0,totalKeyword:0,internalTotal:0,internalDofollow:0,internalNofollow:0,externalTotal:0,externalDofollow:0,externalNofollow:0,otherTotal:0,otherDofollow:0,otherNofollow:0};if(null!==a){b.total=a.length;for(var c=0;c<a.length;c++){var d=this.linkKeyword(a[c]);d&&b.totalKeyword++;var e=this.linkType(a[c]);b[e+"Total"]++;var f=this.linkFollow(a[c]);b[e+f]++}}return b=this.linkResult(b),[{test:"linkCount",result:b}]},YoastSEO.Analyzer.prototype.linkType=function(a){var b="other";if(null!==a.match(/https?:\/\//gi)){b="external";var c=a.match(this.config.url);null!==c&&0!==c[0].length&&(b="internal")}return b},YoastSEO.Analyzer.prototype.linkFollow=function(a){var b="Dofollow";return null!==a.match(/rel=([\'\"])nofollow\1/gi)&&(b="Nofollow"),b},YoastSEO.Analyzer.prototype.linkKeyword=function(a){var b=!1,c=a.split(">");return null!==c[1].match(this.keywordRegex)&&(b=!0),b},YoastSEO.Analyzer.prototype.linkResult=function(a){var b=a;return b.externalHasNofollow=!1,b.externalAllNofollow=!1,b.externalAllDofollow=!1,b.externalTotal!==b.externalDofollow&&b.externalTotal>0&&(b.externalHasNofollow=!0),b.externalTotal===b.externalNofollow&&b.externalTotal>0&&(b.externalAllNofollow=!0),b.externalTotal===b.externalDofollow&&b.externalTotal>0&&(b.externalAllDofollow=!0),b},YoastSEO.Analyzer.prototype.imageCount=function(){var a={total:0,alt:0,noAlt:0,altKeyword:0},b=this.preProcessor.__store.originalText.match(/<img(?:[^>]+)?>/gi);if(null!==b){a.total=b.length;for(var c=0;c<b.length;c++){var d=b[c].match(/alt=([\'\"])(.*?)\1/gi);this.imageAlttag(d)?this.imageAlttagKeyword(d)?a.altKeyword++:a.alt++:a.noAlt++}}return[{test:"imageCount",result:a}]},YoastSEO.Analyzer.prototype.imageAlttag=function(a){var b=!1;return null!==a&&null!==a[0].split("=")[1].match(/[a-z0-9](.*?)[a-z0-9]/gi)&&(b=!0),b},YoastSEO.Analyzer.prototype.imageAlttagKeyword=function(a){var b=!1;return null!==a&&null!==a[0].match(this.keywordRegex)&&(b=!0),b},YoastSEO.Analyzer.prototype.pageTitleLength=function(){var a=0;return"undefined"!=typeof this.config.pageTitle&&(a=this.config.pageTitle.length),[{test:"pageTitleLength",result:a}]},YoastSEO.Analyzer.prototype.pageTitleKeyword=function(){var a=[{test:"pageTitleKeyword",result:{matches:0,position:0}}];return"undefined"!=typeof this.config.pageTitle&&(a[0].result.matches=this.stringHelper.countMatches(this.config.pageTitle.toLocaleLowerCase(),this.keywordRegex),a[0].result.position=this.config.pageTitle.indexOf(this.config.keyword)),a},YoastSEO.Analyzer.prototype.firstParagraph=function(){var a=[{test:"firstParagraph",result:0}],b=this.paragraphChecker(this.preProcessor.__store.cleanTextSomeTags,new RegExp("<p(?:[^>]+)?>(.*?)</p>","ig"));return 0===b&&(b=this.paragraphChecker(this.preProcessor.__store.originalText,new RegExp("[^]*?\n\n","ig"))),a[0].result=b,a},YoastSEO.Analyzer.prototype.paragraphChecker=function(a,b){var c=a.match(b),d=0;return null!==c&&(d=this.stringHelper.countMatches(c[0],this.keywordRegex)),d},YoastSEO.Analyzer.prototype.metaDescription=function(){var a=[{test:"metaDescriptionLength",result:0},{test:"metaDescriptionKeyword",result:0}];return"undefined"!=typeof this.config.meta&&(a[0].result=this.config.meta.length,a[1].result=-1,this.config.meta.length>0&&(a[1].result=this.stringHelper.countMatches(this.config.meta,this.keywordRegex))),a},YoastSEO.Analyzer.prototype.urlKeyword=function(){var a=[{test:"urlKeyword",result:0}];return"undefined"!=typeof this.config.url&&(a[0].result=this.stringHelper.countMatches(this.config.url,this.keywordRegexInverse)),a},YoastSEO.Analyzer.prototype.urlLength=function(){var a=[{test:"urlLength",result:{urlTooLong:!1}}];if("undefined"!=typeof this.config.url){var b=this.config.url.length;b>this.config.maxUrlLength&&b>this.config.maxSlugLength+this.config.keyword.length&&(a[0].result.urlTooLong=!0)}return a},YoastSEO.Analyzer.prototype.urlStopwords=function(){var a=[{test:"urlStopwords",result:0}];if("undefined"!=typeof this.config.url){var b=this.stringHelper.matchString(this.config.url,this.config.stopWords);null!==b&&(a[0].result=b.length)}return a},YoastSEO.Analyzer.prototype.keywordDoubles=function(){var a=[{test:"keywordDoubles",result:{count:0,id:0}}];return"undefined"!=typeof this.config.keyword&&"undefined"!=typeof this.config.usedKeywords[this.config.keyword]&&(a[0].result.count=this.config.usedKeywords[this.config.keyword].length,1===a[0].result.count&&(a[0].result.id=this.config.usedKeywords[this.config.keyword][0])),a},YoastSEO.Analyzer.prototype.score=function(){this.analyzeScorer.score(this.__output)},YoastSEO="undefined"==typeof YoastSEO?{}:YoastSEO,YoastSEO.AnalyzeScorer=function(a){this.__score=[],this.refObj=a,this.i18n=a.config.i18n,this.init()},YoastSEO.AnalyzeScorer.prototype.init=function(){var a=new YoastSEO.AnalyzerScoring(this.i18n);this.scoring=a.analyzerScoring},YoastSEO.AnalyzeScorer.prototype.score=function(a){this.resultObj=a,this.runQueue()},YoastSEO.AnalyzeScorer.prototype.runQueue=function(){for(var a=0;a<this.resultObj.length;a++){var b=this.genericScore(this.resultObj[a]);"undefined"!=typeof b&&(this.__score=this.__score.concat(b))}this.__totalScore=this.totalScore()},YoastSEO.AnalyzeScorer.prototype.genericScore=function(a){if("undefined"!=typeof a){for(var b=this.scoreLookup(a.test),c={name:b.scoreName,score:0,text:""},d=0;d<b.scoreArray.length;d++)switch(this.setMatcher(a,b,d),!0){case"string"==typeof b.scoreArray[d].type&&this.result[b.scoreArray[d].type]:return this.returnScore(c,b,d);case"undefined"==typeof b.scoreArray[d].min&&this.matcher<=b.scoreArray[d].max:return this.returnScore(c,b,d);case"undefined"==typeof b.scoreArray[d].max&&this.matcher>=b.scoreArray[d].min:return this.returnScore(c,b,d);case this.matcher>=b.scoreArray[d].min&&this.matcher<=b.scoreArray[d].max:return this.returnScore(c,b,d)}return c}},YoastSEO.AnalyzeScorer.prototype.setMatcher=function(a,b,c){this.matcher=parseFloat(a.result),this.result=a.result,"undefined"!=typeof b.scoreArray[c].matcher&&(this.matcher=parseFloat(this.result[b.scoreArray[c].matcher]))},YoastSEO.AnalyzeScorer.prototype.scoreLookup=function(a){for(var b=0;b<this.scoring.length;b++)if(a===this.scoring[b].scoreName)return this.scoring[b]},YoastSEO.AnalyzeScorer.prototype.returnScore=function(a,b,c){return a.score=b.scoreArray[c].score,a.text=this.scoreTextFormat(b.scoreArray[c],b.replaceArray),a},YoastSEO.AnalyzeScorer.prototype.scoreTextFormat=function(a,b){var c=a.text;if("undefined"!=typeof b)for(var d=0;d<b.length;d++)switch(!0){case"undefined"!=typeof b[d].value:c=c.replace(b[d].position,b[d].value);break;case"undefined"!=typeof b[d].source:c=c.replace(b[d].position,this[b[d].source]);break;case"undefined"!=typeof b[d].sourceObj:var e=this.parseReplaceWord(b[d].sourceObj);c=c.replace(b[d].position,e);break;case"undefined"!=typeof b[d].scoreObj:c=c.replace(b[d].position,a[b[d].scoreObj])}return c},YoastSEO.AnalyzeScorer.prototype.parseReplaceWord=function(a){for(var b=a.split("."),c=this,d=1;d<b.length;d++)c=c[b[d]];return c},YoastSEO.AnalyzeScorer.prototype.totalScore=function(){for(var a=this.__score.length,b=0,c=0;c<this.__score.length;c++)"undefined"!=typeof this.__score[c]?b+=this.__score[c].score:a--;var d=a*YoastSEO.analyzerScoreRating;return Math.round(b/d*10)},YoastSEO="undefined"==typeof YoastSEO?{}:YoastSEO,YoastSEO.App=function(a){window.YoastSEO.app=this,this.config=a,this.inputs={},this.rawData=a.callbacks.getData(),this.constructI18n(a.translations),this.loadQueue(),this.stringHelper=new YoastSEO.StringHelper,this.pluggable=new YoastSEO.Pluggable,this.showLoadingDialog(),this.callbacks=this.config.callbacks,this.config.ajax||this.defineElements(),this.init()},YoastSEO.App.prototype.constructI18n=function(a){var b={domain:"js-text-analysis",locale_data:{"js-text-analysis":{"":{}}}};a=a||b,this.i18n=new YoastSEO.Jed(a)},YoastSEO.App.prototype.init=function(){this.defineElements(),this.createSnippetPreview()},YoastSEO.App.prototype.refresh=function(){this.rawData=this.callbacks.getData(),this.inputs=this.callbacks.getAnalyzerInput()},YoastSEO.App.prototype.loadQueue=function(){"undefined"==typeof this.queue&&(this.queue=YoastSEO.analyzerConfig.queue)},YoastSEO.App.prototype.addToQueue=function(a){"function"==typeof YoastSEO.Analyzer.prototype[a]&&this.queue.push(a)},YoastSEO.App.prototype.removeFromQueue=function(a){var b=this.queue.indexOf(a);b>-1&&this.queue.splice(b,1)},YoastSEO.App.prototype.createSnippetPreview=function(){var a=document.getElementById(this.config.targets.snippet),b=document.createElement("div");b.id="snippet_preview",a.appendChild(b),this.createSnippetPreviewTitle(b),this.createSnippetPreviewUrl(b),this.createSnippetPreviewMeta(b),this.snippetPreview=new YoastSEO.SnippetPreview(this),this.bindEvent(),this.bindSnippetEvents()},YoastSEO.App.prototype.createSnippetPreviewTitle=function(a){var b=document.createElement("div");b.className="snippet_container",b.id="title_container",b.__refObj=this,a.appendChild(b);var c;c=document.createElement("span"),c.contentEditable=!0,c.textContent=this.config.sampleText.title,c.className="title",c.id="snippet_title",b.appendChild(c)},YoastSEO.App.prototype.createSnippetPreviewUrl=function(a){var b=document.createElement("div");b.className="snippet_container",b.id="url_container",b.__refObj=this,a.appendChild(b);var c=document.createElement("cite");c.className="url urlBase",c.id="snippet_citeBase",b.appendChild(c);var d=document.createElement("cite");d.className="url",d.id="snippet_cite",d.textContent=this.config.sampleText.url,d.contentEditable=!0,b.appendChild(d)},YoastSEO.App.prototype.createSnippetPreviewMeta=function(a){var b=document.createElement("div");b.className="snippet_container",b.id="meta_container",b.__refObj=this,a.appendChild(b);var c=document.createElement("span");c.className="desc",c.id="snippet_meta",c.contentEditable=!0,c.textContent=this.config.sampleText.meta,b.appendChild(c)},YoastSEO.App.prototype.defineElements=function(){this.target=document.getElementById(this.config.targets.output);for(var a=0;a<this.config.elementTarget.length;a++){var b=document.getElementById(this.config.elementTarget[a]);null!==b&&(b.__refObj=this)}},YoastSEO.App.prototype.createEditIcon=function(a,b){var c=document.createElement("div");c.className="editIcon",c.id="editIcon_"+b,a.appendChild(c)},YoastSEO.App.prototype.getAnalyzerInput=function(){this.inputs=this.callbacks.getAnalyzerInput()},YoastSEO.App.prototype.bindEvent=function(){this.callbacks.bindElementEvents()},YoastSEO.App.prototype.bindInputEvent=function(){for(var a=0;a<this.config.elementTarget.length;a++){var b=document.getElementById(this.config.elementTarget[a]);b.addEventListener("input",this.analyzeTimer)}},YoastSEO.App.prototype.bindSnippetEvents=function(){var a=document.getElementById(this.config.targets.snippet);a.refObj=this;for(var b=["meta","cite","title"],c=0;c<b.length;c++){var d=document.getElementById("snippet_"+b[c]);d.refObj=this,d.addEventListener("blur",this.callbacks.updateSnippetValues)}},YoastSEO.App.prototype.reloadSnippetText=function(){"undefined"!=typeof this.snippetPreview&&this.snippetPreview.reRender()},YoastSEO.App.prototype.analyzeTimer=function(){var a=this.__refObj;"undefined"==typeof a&&(a=this.refObj),"undefined"==typeof a&&(a=this),clearTimeout(window.timer),window.timer=setTimeout(a.checkInputs,a.config.typeDelay)},YoastSEO.App.prototype.checkInputs=function(){var a=window.YoastSEO.app;a.getAnalyzerInput()},YoastSEO.App.prototype.runAnalyzerCallback=function(){var a=window.YoastSEO.app;""===a.rawData.keyword?a.noKeywordQueue():a.runAnalyzer()},YoastSEO.App.prototype.showMessage=function(){this.target.innerHTML="";var a=document.createElement("div");a.className="wpseo_msg",a.innerHTML="<p><strong>No focus keyword was set for this page. If you do not set a focus keyword, no score can be calculated.</strong></p>",this.target.appendChild(a)},YoastSEO.App.prototype.startTime=function(){this.startTimestamp=(new Date).getTime()},YoastSEO.App.prototype.endTime=function(){this.endTimestamp=(new Date).getTime(),this.endTimestamp-this.startTimestamp>this.config.typeDelay&&this.config.typeDelay<this.config.maxTypeDelay-this.config.typeDelayStep&&(this.config.typeDelay+=this.config.typeDelayStep)},YoastSEO.App.prototype.runAnalyzer=function(){this.pluggable.loaded!==!1&&(this.config.dynamicDelay&&this.startTime(),this.analyzerData=this.modifyData(this.rawData),this.analyzerData.i18n=this.i18n,"undefined"==typeof this.pageAnalyzer?this.pageAnalyzer=new YoastSEO.Analyzer(this.analyzerData):this.pageAnalyzer.init(this.analyzerData),this.pageAnalyzer.runQueue(),this.scoreFormatter=new YoastSEO.ScoreFormatter(this),this.config.dynamicDelay&&this.endTime())},YoastSEO.App.prototype.modifyData=function(a){return a.text=this.pluggable._applyModifications("content",a.text),a.title=this.pluggable._applyModifications("title",a.title),a},YoastSEO.App.prototype.pluginsLoaded=function(){this.removeLoadingDialog(),"undefined"!=typeof this.rawData.keyword&&""!==this.rawData.keyword?this.runAnalyzer(this.rawData):this.noKeywordQueue()},YoastSEO.App.prototype.noKeywordQueue=function(){var a=this.rawData;a.queue=["keyWordCheck","wordCount","fleschReading","pageTitleLength","urlStopwords"],this.runAnalyzer(a)},YoastSEO.App.prototype.showLoadingDialog=function(){var a=document.createElement("div");a.className="wpseo_msg",a.id="wpseo-plugin-loading",document.getElementById("wpseo_meta").appendChild(a)},YoastSEO.App.prototype.updateLoadingDialog=function(a){var b=document.getElementById("wpseo-plugin-loading");b.textContent="";for(var c in this.pluggable.plugins)b.innerHTML+=c+a[c].status+"<br />"},YoastSEO.App.prototype.removeLoadingDialog=function(){document.getElementById("wpseo_meta").removeChild(document.getElementById("wpseo-plugin-loading"))},YoastSEO.initialize=function(){"complete"===document.readyState?YoastSEO.app=new YoastSEO.App(YoastSEO.analyzerArgs):setTimeout(YoastSEO.initialize,50)},YoastSEO="undefined"==typeof YoastSEO?{}:YoastSEO,YoastSEO.InputGenerator=function(a,b){this.config=a,this.refObj=b,this.analyzerData={},this.formattedData={}},YoastSEO.InputGenerator.prototype.createElements=function(){var a=document.getElementById(this.config.elementTarget);this.createText("text",a,"text"),this.createInput("keyword",a,"Focus keyword")},YoastSEO.InputGenerator.prototype.getData=function(){return this.analyzerData.keyword=this.refObj.config.sampleText.keyword,this.analyzerData.meta=this.refObj.config.sampleText.meta,this.analyzerData.snippetMeta=this.refObj.config.sampleText.meta,this.analyzerData.text=this.refObj.config.sampleText.text,this.analyzerData.title=this.refObj.config.sampleText.title,this.analyzerData.snippetTitle=this.refObj.config.sampleText.title,this.analyzerData.pageTitle=this.refObj.config.sampleText.title,this.analyzerData.url=this.refObj.config.sampleText.url,this.analyzerData.snippetCite=this.refObj.config.sampleText.url,this.formattedData=this.analyzerData,this.refObj.analyzerData=this.analyzerData,this.refObj.formattedData=this.formattedData,this.analyzerData},YoastSEO.InputGenerator.prototype.createInput=function(a,b,c){this.createLabel(a,b,c);var d=document.createElement("input");d.type="text",d.id=a+"Input",d.refObj=this.refObj,d.placeholder=this.config.sampleText[a],b.appendChild(d)},YoastSEO.InputGenerator.prototype.createText=function(a,b,c){this.createLabel(a,b,c);var d=document.createElement("textarea");d.placeholder=this.config.sampleText[a],d.id=a+"Input",b.appendChild(d)},YoastSEO.InputGenerator.prototype.createLabel=function(a,b,c){var d=document.createElement("label");d.textContent=c,d.htmlFor=a+"Input",b.appendChild(d)},YoastSEO.InputGenerator.prototype.getAnalyzerInput=function(){"undefined"==typeof this.refObj.snippetPreview?this.refObj.init():(this.rawData.text=this.getDataFromInput("text"),this.rawData.keyword=this.getDataFromInput("keyword"),this.rawData.pageTitle=this.getDataFromInput("title"),this.rawData.snippetMeta=this.getDataFromInput("meta"),this.rawData.snippetCite=this.getDataFromInput("url"),this.refObj.rawData=this.formattedData,this.refObj.reloadSnippetText()),this.refObj.runAnalyzerCallback()},YoastSEO.InputGenerator.prototype.getDataFromInput=function(a){var b;switch(a){case"text":b=document.getElementById("textInput").value;break;case"url":b=document.getElementById("snippet_cite").innerText;break;case"meta":b=document.getElementById("snippet_meta").innerText;break;case"keyword":b=document.getElementById("keywordInput").value;break;case"title":b=document.getElementById("snippet_title").innerText}return b},YoastSEO.InputGenerator.prototype.bindElementEvents=function(){this.inputElementEventBinder(),this.snippetPreviewEventBinder()},YoastSEO.InputGenerator.prototype.snippetPreviewEventBinder=function(){for(var a=["cite","meta","title"],b=0;b<a.length;b++)document.getElementById("snippet_"+a[b]).addEventListener("blur",this.snippetCallback)},YoastSEO.InputGenerator.prototype.inputElementEventBinder=function(){for(var a=["textInput","keywordInput","snippet_cite","snippet_meta","snippet_title"],b=0;b<a.length;b++)document.getElementById(a[b]).__refObj=this,document.getElementById(a[b]).addEventListener("change",this.renewData)},YoastSEO.InputGenerator.prototype.renewData=function(a){a.currentTarget.__refObj.getAnalyzerInput()},YoastSEO.InputGenerator.prototype.snippetCallback=function(a){a.currentTarget.__refObj.getAnalyzerInput()},YoastSEO.InputGenerator.prototype.saveScores=function(a){return a},YoastSEO="undefined"==typeof YoastSEO?{}:YoastSEO,YoastSEO.Pluggable=function(){this.loaded=!1,this.preloadThreshold=3e3,this.plugins={},this.modifications={},setTimeout(this._pollLoadingPlugins.bind(this),1500)},YoastSEO.App.prototype.registerPlugin=function(a,b){return this.pluggable._registerPlugin(a,b)},YoastSEO.App.prototype.pluginReady=function(a){return this.pluggable._ready(a)},YoastSEO.App.prototype.pluginReloaded=function(a){return this.pluggable._reloaded(a)},YoastSEO.App.prototype.registerModification=function(a,b,c,d){return this.pluggable._registerModification(a,b,c,d)},YoastSEO.Pluggable.prototype._registerPlugin=function(a,b){return"string"!=typeof a?(console.error("Failed to register plugin. Expected parameter `pluginName` to be a string."),!1):"undefined"!=typeof b&&"object"!=typeof b?(console.error("Failed to register plugin "+a+". Expected parameters `options` to be a string."),!1):this._validateUniqueness(a)===!1?(console.error("Failed to register plugin. Plugin with name "+a+" already exists"),!1):(this.plugins[a]=b,YoastSEO.app.updateLoadingDialog(this.plugins),!0)},YoastSEO.Pluggable.prototype._ready=function(a){return"string"!=typeof a?(console.error("Failed to modify status for plugin "+a+". Expected parameter `pluginName` to be a string."),!1):void 0===this.plugins[a]?(console.error("Failed to modify status for plugin "+a+". The plugin was not properly registered."),!1):(this.plugins[a].status="ready",YoastSEO.app.updateLoadingDialog(this.plugins),!0)},YoastSEO.Pluggable.prototype._reloaded=function(a){return"string"!=typeof a?(console.error("Failed to reload Content Analysis for "+a+". Expected parameter `pluginName` to be a string."),!1):void 0===this.plugins[a]?(console.error("Failed to reload Content Analysis for plugin "+a+". The plugin was not properly registered."),!1):(YoastSEO.app.runAnalyzer(YoastSEO.app.rawData),!0)},YoastSEO.Pluggable.prototype._registerModification=function(a,b,c,d){if("string"!=typeof a)return console.error("Failed to register modification for plugin "+c+". Expected parameter `modification` to be a string."),!1;if("function"!=typeof b)return console.error("Failed to register modification for plugin "+c+". Expected parameter `callable` to be a function."),!1;if("string"!=typeof c)return console.error("Failed to register modification for plugin "+c+". Expected parameter `pluginName` to be a string."),!1;if(this._validateOrigin(c)===!1)return console.error("Failed to register modification for plugin "+c+". The integration has not finished loading yet."),!1;var e="number"==typeof d?d:10,f={callable:b,origin:c,priority:e};return void 0===this.modifications[a]&&(this.modifications[a]=[]),this.modifications[a].push(f),!0},YoastSEO.Pluggable.prototype._pollLoadingPlugins=function(a){a=void 0===a?0:a,this._allReady()===!0?(this.loaded=!0,YoastSEO.app.pluginsLoaded()):a>=this.preloadThreshold?this._pollTimeExceeded():(a+=50,setTimeout(this._pollLoadingPlugins.bind(this,a),50))},YoastSEO.Pluggable.prototype._allReady=function(){for(var a in this.plugins)if("ready"!==this.plugins[a].status)return!1;return!0},YoastSEO.Pluggable.prototype._pollTimeExceeded=function(){for(var a in this.plugins)void 0!==this.plugins[a].options&&"ready"!==this.plugins[a].options.status&&(console.error("Error: Plugin "+a+". did not finish loading in time."),delete this.plugins[a]);this.loaded=!0,YoastSEO.app.pluginsLoaded()},YoastSEO.Pluggable.prototype._applyModifications=function(a,b,c){var d=this.modifications[a];if(d instanceof Array&&d.length>0){d=this._stripIllegalModifications(d),d.sort(function(a,b){return a.priority-b.priority});for(var e in d){var f=d[e].callable,g=f(b,c);typeof g==typeof b?b=g:console.error("Modification with name "+a+" performed by plugin with name "+d[e].origin+" was ignored because the data that was returned by it was of a different type than the data we had passed it.")}}return b},YoastSEO.Pluggable.prototype._stripIllegalModifications=function(a){for(var b in a)this._validateOrigin(a[b].origin)===!1&&delete a[b];return a},YoastSEO.Pluggable.prototype._validateOrigin=function(a){return"ready"!==this.plugins[a].status?!1:!0},YoastSEO.Pluggable.prototype._validateUniqueness=function(a){return void 0!==this.plugins[a]?!1:!0},YoastSEO="undefined"==typeof YoastSEO?{}:YoastSEO,YoastSEO.PreProcessor=function(a){this.__store={},this.__store.originalText=a,this.stringHelper=YoastSEO.getStringHelper(),this.init()},YoastSEO.PreProcessor.prototype.init=function(){this.textFormat(),this.countStore()},YoastSEO.PreProcessor.prototype.textFormat=function(){this.__store.cleanText=this.cleanText(this.__store.originalText),this.__store.cleanTextSomeTags=this.stringHelper.stripSomeTags(this.__store.cleanText),this.__store.cleanTextNoTags=this.stringHelper.stripAllTags(this.__store.cleanTextSomeTags)},YoastSEO.PreProcessor.prototype.countStore=function(){this.__store.wordcount=this.__store.cleanText.split(" ").length,this.__store.wordcountNoTags=this.__store.cleanTextNoTags.split(" ").length,this.__store.sentenceCount=this.sentenceCount(this.__store.cleanText),this.__store.sentenceCountNoTags=this.sentenceCount(this.__store.cleanTextNoTags),this.__store.syllablecount=this.syllableCount(this.__store.cleanTextNoTags)},YoastSEO.PreProcessor.prototype.sentenceCount=function(a){for(var b=a.split("."),c=0,d=0;d<b.length;d++)""!==b[d]&&" "!==b[d]&&c++;return c},YoastSEO.PreProcessor.prototype.syllableCount=function(a){this.syllableCount=0,a=a.replace(/[.]/g," "),a=this.removeWords(a);for(var b=a.split(" "),c=this.stringHelper.stringToRegex(YoastSEO.preprocessorConfig.syllables.subtractSyllables,!0),d=this.stringHelper.stringToRegex(YoastSEO.preprocessorConfig.syllables.addSyllables,!0),e=0;e<b.length;e++)this.basicSyllableCount(b[e].split(/[^aeiouy]/g)),this.advancedSyllableCount(b[e],c,"subtract"),this.advancedSyllableCount(b[e],d,"add");return this.syllableCount},YoastSEO.PreProcessor.prototype.basicSyllableCount=function(a){for(var b=0;b<a.length;b++)a[b].length>0&&this.syllableCount++},YoastSEO.PreProcessor.prototype.advancedSyllableCount=function(a,b,c){var d=a.match(b);null!==d&&("subtract"===c?this.syllableCount-=d.length:"add"===c&&(this.syllableCount+=d.length))},YoastSEO.PreProcessor.prototype.removeWords=function(a){for(var b=YoastSEO.preprocessorConfig,c=0;c<b.syllables.exclusionWords.length;c++){var d=new RegExp(b.syllables.exclusionWords[c].word,"g"),e=a.match(d);null!==e&&(this.syllableCount+=b.syllables.exclusionWords[c].syllables,a=a.replace(d,""))}return a},YoastSEO.PreProcessor.prototype.cleanText=function(a){return""!==a&&(a=this.replaceDiacritics(a),a=a.toLocaleLowerCase(),a=a.replace(/[\-\;\:\,\(\)\"\'\|\“\”]/g," "),a=a.replace(/[\’]/g,""),a=a.replace(/[.?!]/g,"."),a+=".",a=a.replace(/[ ]*(\n|\r\n|\r)[ ]*/g," "),a=a.replace(/([\.])[\. ]+/g,"$1"),a=a.replace(/[ ]*([\.])+/g,"$1 "),a=a.replace(/[0-9]+[ ]/g,""),a=this.stringHelper.stripSpaces(a)),a},YoastSEO.PreProcessor.prototype.replaceDiacritics=function(a){for(var b=YoastSEO.preprocessorConfig,c=0;c<b.diacriticsRemovalMap.length;c++)a=a.replace(b.diacriticsRemovalMap[c].letters,b.diacriticsRemovalMap[c].base);return a},YoastSEO.getPreProcessor=function(a){return("object"!=typeof YoastSEO.cachedPreProcessor||YoastSEO.cachedPreProcessor.inputText!==a)&&(YoastSEO.cachedPreProcessor=new YoastSEO.PreProcessor(a)),YoastSEO.cachedPreProcessor},YoastSEO="undefined"==typeof YoastSEO?{}:YoastSEO,YoastSEO.ScoreFormatter=function(a){this.scores=a.pageAnalyzer.analyzeScorer.__score,this.overallScore=a.pageAnalyzer.analyzeScorer.__totalScore,this.outputTarget=a.config.targets.output,this.overallTarget=a.config.targets.overall,this.totalScore=0,this.refObj=a,this.outputScore(),this.outputOverallScore()},YoastSEO.ScoreFormatter.prototype.outputScore=function(){this.sortScores();var a=document.getElementById(this.outputTarget);a.innerHTML="";var b=document.createElement("ul");b.className="wpseoanalysis";for(var c=0;c<this.scores.length;c++)if(""!==this.scores[c].text){var d=document.createElement("li");d.className="score";var e=document.createElement("span");e.className="wpseo-score-icon "+this.scoreRating(this.scores[c].score),d.appendChild(e);var f=document.createElement("span");f.className="screen-reader-text",f.textContent="seo score "+this.scoreRating(this.scores[c].score),d.appendChild(f);var g=document.createElement("span");g.className="wpseo-score-text",g.innerHTML=this.scores[c].text,d.appendChild(g),b.appendChild(d)}a.appendChild(b)},YoastSEO.ScoreFormatter.prototype.sortScores=function(){this.scores=this.scores.sort(function(a,b){return a.score-b.score})},YoastSEO.ScoreFormatter.prototype.outputOverallScore=function(){var a=document.getElementById(this.overallTarget);a.className="overallScore "+this.scoreRating(Math.round(this.overallScore)),""===this.refObj.rawData.keyword&&(a.className="overallScore "+this.scoreRating(0)),this.refObj.callbacks.saveScores(this.overallScore)},YoastSEO.ScoreFormatter.prototype.scoreRating=function(a){var b;switch(a){case 0:b="na";break;case 4:case 5:b="poor";break;case 6:case 7:b="ok";break;case 8:case 9:case 10:b="good";break;default:b="bad"}return b},YoastSEO="undefined"==typeof YoastSEO?{}:YoastSEO,YoastSEO.SnippetPreview=function(a){this.refObj=a,this.init()},YoastSEO.SnippetPreview.prototype.init=function(){null!==this.refObj.rawData.pageTitle&&null!==this.refObj.rawData.cite&&(this.output=this.htmlOutput(),this.renderOutput())},YoastSEO.SnippetPreview.prototype.htmlOutput=function(){var a={};return a.title=this.formatTitle(),a.cite=this.formatCite(),a.meta=this.formatMeta(),a.url=this.formatUrl(),a},YoastSEO.SnippetPreview.prototype.formatTitle=function(){var a=this.refObj.rawData.snippetTitle;return""===a&&(a=this.refObj.rawData.pageTitle),""===a&&(a=this.refObj.config.sampleText.title),a=this.refObj.stringHelper.stripAllTags(a),""!==this.refObj.rawData.keyword?this.formatKeyword(a):a},YoastSEO.SnippetPreview.prototype.formatUrl=function(){var a=this.refObj.rawData.baseUrl;return a.replace(/https?:\/\//gi,""),a},YoastSEO.SnippetPreview.prototype.formatCite=function(){var a=this.refObj.rawData.snippetCite;return a=this.refObj.stringHelper.stripAllTags(a),""===a?a=this.refObj.config.sampleText.url:this.formatKeywordUrl(a)},YoastSEO.SnippetPreview.prototype.formatMeta=function(){var a=this.refObj.rawData.snippetMeta;return""===a&&(a=this.getMetaText()),a=this.refObj.stringHelper.stripAllTags(a),a=a.substring(0,YoastSEO.analyzerConfig.maxMeta),""!==this.refObj.rawData.keyword&&""!==a?this.formatKeyword(a):a},YoastSEO.SnippetPreview.prototype.getMetaText=function(){var a;if("undefined"!=typeof this.refObj.rawData.excerpt&&(a=this.refObj.rawData.excerpt),""===a&&(a=this.refObj.config.sampleText.meta),a=this.refObj.stringHelper.stripAllTags(a),""!==this.refObj.rawData.keyword&&""!==this.refObj.rawData.text){
var b=this.getIndexMatches(),c=this.getPeriodMatches();a=a.substring(0,YoastSEO.analyzerConfig.maxMeta);var d=0;if(b.length>0)for(var e=0;e<c.length;){if(!(c[0]<b[0])){d>0&&(d+=2);break}d=c.shift()}}return""===this.refObj.stringHelper.stripAllTags(a)?this.refObj.config.sampleText.meta:a.substring(0,YoastSEO.analyzerConfig.maxMeta)},YoastSEO.SnippetPreview.prototype.getIndexMatches=function(){for(var a=[],b=0,c=this.refObj.rawData.text.indexOf(this.refObj.rawData.keyword,b);c>-1;)a.push(c),b=c+this.refObj.rawData.keyword.length,c=this.refObj.rawData.text.indexOf(this.refObj.rawData.keyword,b);return a},YoastSEO.SnippetPreview.prototype.getPeriodMatches=function(){for(var a,b=[0],c=0;(a=this.refObj.rawData.text.indexOf(".",c))>-1;)b.push(a),c=a+1;return b},YoastSEO.SnippetPreview.prototype.formatKeyword=function(a){var b=new RegExp(this.refObj.rawData.keyword,"ig");return a.replace(b,function(a){return"<strong>"+a+"</strong>"})},YoastSEO.SnippetPreview.prototype.formatKeywordUrl=function(a){var b=this.refObj.rawData.keyword.replace(" ","[-_]");return b=new RegExp(b,"ig"),a.replace(b,function(a){return"<strong>"+a+"</strong>"})},YoastSEO.SnippetPreview.prototype.renderOutput=function(){document.getElementById("snippet_title").innerHTML=this.output.title,document.getElementById("snippet_cite").innerHTML=this.output.cite,document.getElementById("snippet_citeBase").innerHTML=this.output.url,document.getElementById("snippet_meta").innerHTML=this.output.meta},YoastSEO.SnippetPreview.prototype.reRender=function(){this.init()},YoastSEO.SnippetPreview.prototype.disableEnter=function(a){13===a.keyCode&&(a.returnValue=!1,a.cancelBubble=!0,a.preventDefault())},YoastSEO.SnippetPreview.prototype.checkTextLength=function(a){var b=a.currentTarget.textContent;switch(a.currentTarget.id){case"snippet_meta":b.length>YoastSEO.analyzerConfig.maxMeta&&(a.currentTarget.__unformattedText=a.currentTarget.textContent,a.currentTarget.textContent=b.substring(0,YoastSEO.analyzerConfig.maxMeta),a.currentTarget.className="desc");break;case"snippet_title":b.length>40&&(a.currentTarget.__unformattedText=a.currentTarget.textContent,a.currentTarget.textContent=b.substring(0,40),a.currentTarget.className="title")}},YoastSEO.SnippetPreview.prototype.textFeedback=function(a){var b=a.currentTarget.textContent;switch(a.currentTarget.id){case"snippet_meta":b.length>YoastSEO.analyzerConfig.maxMeta?a.currentTarget.className="desc tooLong":a.currentTarget.className="desc";break;case"snippet_title":b.length>40?a.currentTarget.className="title tooLong":a.currentTarget.className="title"}},YoastSEO.SnippetPreview.prototype.showEditIcon=function(a){a.currentTarget.parentElement.className="editIcon snippet_container"},YoastSEO.SnippetPreview.prototype.hideEditIcon=function(){for(var a=document.getElementsByClassName("editIcon "),b=0;b<a.length;b++)a[b].className="snippet_container"},YoastSEO.SnippetPreview.prototype.setFocus=function(a){for(var b=a.currentTarget.firstChild;null!==b;){if("true"===b.contentEditable){b.focus(),b.refObj.snippetPreview.hideEditIcon();break}b=b.nextSibling}b.refObj.snippetPreview.setFocusToEnd(b)},YoastSEO.SnippetPreview.prototype.setFocusToEnd=function(a){if("undefined"!=typeof window.getSelection&&"undefined"!=typeof document.createRange){var b=document.createRange();b.selectNodeContents(a),b.collapse(!1);var c=window.getSelection();c.removeAllRanges(),c.addRange(b)}else if("undefined"!=typeof document.body.createTextRange){var d=document.body.createTextRange();d.moveToElementText(a),d.collapse(!1),d.select()}},YoastSEO="undefined"==typeof YoastSEO?{}:YoastSEO,YoastSEO.StringHelper=function(){},YoastSEO.StringHelper.prototype.replaceString=function(a,b,c){return"undefined"==typeof c&&(c=" "),a=a.replace(this.stringToRegex(b),c),this.stripSpaces(a)},YoastSEO.StringHelper.prototype.matchString=function(a,b){return a.match(this.stringToRegex(b,!1))},YoastSEO.StringHelper.prototype.countMatches=function(a,b){return null!==a.match(b)?a.match.length:0},YoastSEO.StringHelper.prototype.stringToRegex=function(a,b){var c="",d="\\b";b&&(d="");for(var e=0;e<a.length;e++)c.length>0&&(c+="|"),c+=d+a[e]+d;return new RegExp(c,"g")},YoastSEO.StringHelper.prototype.stripSpaces=function(a){return a=a.replace(/ {2,}/g," "),a=a.replace(/^\s+|\s+$/g,"")},YoastSEO.StringHelper.prototype.addEscapeChars=function(a){return a.replace(/[\-\[\]\/\{}\(\)\*\+\?\.\\\^\$\|]/g,"\\$&")},YoastSEO.StringHelper.prototype.stripSomeTags=function(a){return a=a.replace(/<(?!li|\/li|p|\/p|h1|\/h1|h2|\/h2|h3|\/h3|h4|\/h4|h5|\/h5|h6|\/h6|dd).*?\>/g," "),a=this.stripSpaces(a)},YoastSEO.StringHelper.prototype.stripAllTags=function(a){return a=a.replace(/(<([^>]+)>)/gi," "),a=a.replace(/[<>]/g,""),a=this.stripSpaces(a)},YoastSEO.getStringHelper=function(){return"object"!=typeof YoastSEO.cachedStringHelper&&(YoastSEO.cachedStringHelper=new YoastSEO.StringHelper),YoastSEO.cachedStringHelper},YoastSEO="undefined"==typeof YoastSEO?{}:YoastSEO,function(){/**
 * @preserve jed.js https://github.com/SlexAxton/Jed
 */
!function(a,b){function c(a){return l.PF.compile(a||"nplurals=2; plural=(n != 1);")}function d(a,b){this._key=a,this._i18n=b}var e=Array.prototype,f=Object.prototype,g=e.slice,h=f.hasOwnProperty,i=e.forEach,j={},k={forEach:function(a,b,c){var d,e,f;if(null!==a)if(i&&a.forEach===i)a.forEach(b,c);else if(a.length===+a.length){for(d=0,e=a.length;e>d;d++)if(d in a&&b.call(c,a[d],d,a)===j)return}else for(f in a)if(h.call(a,f)&&b.call(c,a[f],f,a)===j)return},extend:function(a){return this.forEach(g.call(arguments,1),function(b){for(var c in b)a[c]=b[c]}),a}},l=function(a){if(this.defaults={locale_data:{messages:{"":{domain:"messages",lang:"en",plural_forms:"nplurals=2; plural=(n != 1);"}}},domain:"messages",debug:!1},this.options=k.extend({},this.defaults,a),this.textdomain(this.options.domain),a.domain&&!this.options.locale_data[this.options.domain])throw new Error("Text domain set to non-existent domain: `"+a.domain+"`")};l.context_delimiter=String.fromCharCode(4),k.extend(d.prototype,{onDomain:function(a){return this._domain=a,this},withContext:function(a){return this._context=a,this},ifPlural:function(a,b){return this._val=a,this._pkey=b,this},fetch:function(a){return"[object Array]"!={}.toString.call(a)&&(a=[].slice.call(arguments,0)),(a&&a.length?l.sprintf:function(a){return a})(this._i18n.dcnpgettext(this._domain,this._context,this._key,this._pkey,this._val),a)}}),k.extend(l.prototype,{translate:function(a){return new d(a,this)},textdomain:function(a){return a?void(this._textdomain=a):this._textdomain},gettext:function(a){return this.dcnpgettext.call(this,b,b,a)},dgettext:function(a,c){return this.dcnpgettext.call(this,a,b,c)},dcgettext:function(a,c){return this.dcnpgettext.call(this,a,b,c)},ngettext:function(a,c,d){return this.dcnpgettext.call(this,b,b,a,c,d)},dngettext:function(a,c,d,e){return this.dcnpgettext.call(this,a,b,c,d,e)},dcngettext:function(a,c,d,e){return this.dcnpgettext.call(this,a,b,c,d,e)},pgettext:function(a,c){return this.dcnpgettext.call(this,b,a,c)},dpgettext:function(a,b,c){return this.dcnpgettext.call(this,a,b,c)},dcpgettext:function(a,b,c){return this.dcnpgettext.call(this,a,b,c)},npgettext:function(a,c,d,e){return this.dcnpgettext.call(this,b,a,c,d,e)},dnpgettext:function(a,b,c,d,e){return this.dcnpgettext.call(this,a,b,c,d,e)},dcnpgettext:function(a,b,d,e,f){e=e||d,a=a||this._textdomain;var g;if(!this.options)return g=new l,g.dcnpgettext.call(g,void 0,void 0,d,e,f);if(!this.options.locale_data)throw new Error("No locale data provided.");if(!this.options.locale_data[a])throw new Error("Domain `"+a+"` was not found.");if(!this.options.locale_data[a][""])throw new Error("No locale meta information provided.");if(!d)throw new Error("No translation key found.");var h,i,j,k=b?b+l.context_delimiter+d:d,m=this.options.locale_data,n=m[a],o=(m.messages||this.defaults.locale_data.messages)[""],p=n[""].plural_forms||n[""]["Plural-Forms"]||n[""]["plural-forms"]||o.plural_forms||o["Plural-Forms"]||o["plural-forms"];if(void 0===f)j=0;else{if("number"!=typeof f&&(f=parseInt(f,10),isNaN(f)))throw new Error("The number that was passed in is not a number.");j=c(p)(f)}if(!n)throw new Error("No domain named `"+a+"` could be found.");return h=n[k],!h||j>h.length?(this.options.missing_key_callback&&this.options.missing_key_callback(k,a),i=[d,e],this.options.debug===!0&&console.log(i[c(p)(f)]),i[c()(f)]):(i=h[j],i?i:(i=[d,e],i[c()(f)]))}});var m=function(){function a(a){return Object.prototype.toString.call(a).slice(8,-1).toLowerCase()}function b(a,b){for(var c=[];b>0;c[--b]=a);return c.join("")}var c=function(){return c.cache.hasOwnProperty(arguments[0])||(c.cache[arguments[0]]=c.parse(arguments[0])),c.format.call(null,c.cache[arguments[0]],arguments)};return c.format=function(c,d){var e,f,g,h,i,j,k,l=1,n=c.length,o="",p=[];for(f=0;n>f;f++)if(o=a(c[f]),"string"===o)p.push(c[f]);else if("array"===o){if(h=c[f],h[2])for(e=d[l],g=0;g<h[2].length;g++){if(!e.hasOwnProperty(h[2][g]))throw m('[sprintf] property "%s" does not exist',h[2][g]);e=e[h[2][g]]}else e=h[1]?d[h[1]]:d[l++];if(/[^s]/.test(h[8])&&"number"!=a(e))throw m("[sprintf] expecting number but found %s",a(e));switch(("undefined"==typeof e||null===e)&&(e=""),h[8]){case"b":e=e.toString(2);break;case"c":e=String.fromCharCode(e);break;case"d":e=parseInt(e,10);break;case"e":e=h[7]?e.toExponential(h[7]):e.toExponential();break;case"f":e=h[7]?parseFloat(e).toFixed(h[7]):parseFloat(e);break;case"o":e=e.toString(8);break;case"s":e=(e=String(e))&&h[7]?e.substring(0,h[7]):e;break;case"u":e=Math.abs(e);break;case"x":e=e.toString(16);break;case"X":e=e.toString(16).toUpperCase()}e=/[def]/.test(h[8])&&h[3]&&e>=0?"+"+e:e,j=h[4]?"0"==h[4]?"0":h[4].charAt(1):" ",k=h[6]-String(e).length,i=h[6]?b(j,k):"",p.push(h[5]?e+i:i+e)}return p.join("")},c.cache={},c.parse=function(a){for(var b=a,c=[],d=[],e=0;b;){if(null!==(c=/^[^\x25]+/.exec(b)))d.push(c[0]);else if(null!==(c=/^\x25{2}/.exec(b)))d.push("%");else{if(null===(c=/^\x25(?:([1-9]\d*)\$|\(([^\)]+)\))?(\+)?(0|'[^$])?(-)?(\d+)?(?:\.(\d+))?([b-fosuxX])/.exec(b)))throw"[sprintf] huh?";if(c[2]){e|=1;var f=[],g=c[2],h=[];if(null===(h=/^([a-z_][a-z_\d]*)/i.exec(g)))throw"[sprintf] huh?";for(f.push(h[1]);""!==(g=g.substring(h[0].length));)if(null!==(h=/^\.([a-z_][a-z_\d]*)/i.exec(g)))f.push(h[1]);else{if(null===(h=/^\[(\d+)\]/.exec(g)))throw"[sprintf] huh?";f.push(h[1])}c[2]=f}else e|=2;if(3===e)throw"[sprintf] mixing positional and named placeholders is not (yet) supported";d.push(c)}b=b.substring(c[0].length)}return d},c}(),n=function(a,b){return b.unshift(a),m.apply(null,b)};l.parse_plural=function(a,b){return a=a.replace(/n/g,b),l.parse_expression(a)},l.sprintf=function(a,b){return"[object Array]"=={}.toString.call(b)?n(a,[].slice.call(b)):m.apply(this,[].slice.call(arguments))},l.prototype.sprintf=function(){return l.sprintf.apply(this,arguments)},l.PF={},l.PF.parse=function(a){var b=l.PF.extractPluralExpr(a);return l.PF.parser.parse.call(l.PF.parser,b)},l.PF.compile=function(a){function b(a){return a===!0?1:a?a:0}var c=l.PF.parse(a);return function(a){return b(l.PF.interpreter(c)(a))}},l.PF.interpreter=function(a){return function(b){switch(a.type){case"GROUP":return l.PF.interpreter(a.expr)(b);case"TERNARY":return l.PF.interpreter(a.expr)(b)?l.PF.interpreter(a.truthy)(b):l.PF.interpreter(a.falsey)(b);case"OR":return l.PF.interpreter(a.left)(b)||l.PF.interpreter(a.right)(b);case"AND":return l.PF.interpreter(a.left)(b)&&l.PF.interpreter(a.right)(b);case"LT":return l.PF.interpreter(a.left)(b)<l.PF.interpreter(a.right)(b);case"GT":return l.PF.interpreter(a.left)(b)>l.PF.interpreter(a.right)(b);case"LTE":return l.PF.interpreter(a.left)(b)<=l.PF.interpreter(a.right)(b);case"GTE":return l.PF.interpreter(a.left)(b)>=l.PF.interpreter(a.right)(b);case"EQ":return l.PF.interpreter(a.left)(b)==l.PF.interpreter(a.right)(b);case"NEQ":return l.PF.interpreter(a.left)(b)!=l.PF.interpreter(a.right)(b);case"MOD":return l.PF.interpreter(a.left)(b)%l.PF.interpreter(a.right)(b);case"VAR":return b;case"NUM":return a.val;default:throw new Error("Invalid Token found.")}}},l.PF.extractPluralExpr=function(a){a=a.replace(/^\s\s*/,"").replace(/\s\s*$/,""),/;\s*$/.test(a)||(a=a.concat(";"));var b,c=/nplurals\=(\d+);/,d=/plural\=(.*);/,e=a.match(c),f={};if(!(e.length>1))throw new Error("nplurals not found in plural_forms string: "+a);if(f.nplurals=e[1],a=a.replace(c,""),b=a.match(d),!(b&&b.length>1))throw new Error("`plural` expression not found: "+a);return b[1]},l.PF.parser=function(){var a={trace:function(){},yy:{},symbols_:{error:2,expressions:3,e:4,EOF:5,"?":6,":":7,"||":8,"&&":9,"<":10,"<=":11,">":12,">=":13,"!=":14,"==":15,"%":16,"(":17,")":18,n:19,NUMBER:20,$accept:0,$end:1},terminals_:{2:"error",5:"EOF",6:"?",7:":",8:"||",9:"&&",10:"<",11:"<=",12:">",13:">=",14:"!=",15:"==",16:"%",17:"(",18:")",19:"n",20:"NUMBER"},productions_:[0,[3,2],[4,5],[4,3],[4,3],[4,3],[4,3],[4,3],[4,3],[4,3],[4,3],[4,3],[4,3],[4,1],[4,1]],performAction:function(a,b,c,d,e,f,g){var h=f.length-1;switch(e){case 1:return{type:"GROUP",expr:f[h-1]};case 2:this.$={type:"TERNARY",expr:f[h-4],truthy:f[h-2],falsey:f[h]};break;case 3:this.$={type:"OR",left:f[h-2],right:f[h]};break;case 4:this.$={type:"AND",left:f[h-2],right:f[h]};break;case 5:this.$={type:"LT",left:f[h-2],right:f[h]};break;case 6:this.$={type:"LTE",left:f[h-2],right:f[h]};break;case 7:this.$={type:"GT",left:f[h-2],right:f[h]};break;case 8:this.$={type:"GTE",left:f[h-2],right:f[h]};break;case 9:this.$={type:"NEQ",left:f[h-2],right:f[h]};break;case 10:this.$={type:"EQ",left:f[h-2],right:f[h]};break;case 11:this.$={type:"MOD",left:f[h-2],right:f[h]};break;case 12:this.$={type:"GROUP",expr:f[h-1]};break;case 13:this.$={type:"VAR"};break;case 14:this.$={type:"NUM",val:Number(a)}}},table:[{3:1,4:2,17:[1,3],19:[1,4],20:[1,5]},{1:[3]},{5:[1,6],6:[1,7],8:[1,8],9:[1,9],10:[1,10],11:[1,11],12:[1,12],13:[1,13],14:[1,14],15:[1,15],16:[1,16]},{4:17,17:[1,3],19:[1,4],20:[1,5]},{5:[2,13],6:[2,13],7:[2,13],8:[2,13],9:[2,13],10:[2,13],11:[2,13],12:[2,13],13:[2,13],14:[2,13],15:[2,13],16:[2,13],18:[2,13]},{5:[2,14],6:[2,14],7:[2,14],8:[2,14],9:[2,14],10:[2,14],11:[2,14],12:[2,14],13:[2,14],14:[2,14],15:[2,14],16:[2,14],18:[2,14]},{1:[2,1]},{4:18,17:[1,3],19:[1,4],20:[1,5]},{4:19,17:[1,3],19:[1,4],20:[1,5]},{4:20,17:[1,3],19:[1,4],20:[1,5]},{4:21,17:[1,3],19:[1,4],20:[1,5]},{4:22,17:[1,3],19:[1,4],20:[1,5]},{4:23,17:[1,3],19:[1,4],20:[1,5]},{4:24,17:[1,3],19:[1,4],20:[1,5]},{4:25,17:[1,3],19:[1,4],20:[1,5]},{4:26,17:[1,3],19:[1,4],20:[1,5]},{4:27,17:[1,3],19:[1,4],20:[1,5]},{6:[1,7],8:[1,8],9:[1,9],10:[1,10],11:[1,11],12:[1,12],13:[1,13],14:[1,14],15:[1,15],16:[1,16],18:[1,28]},{6:[1,7],7:[1,29],8:[1,8],9:[1,9],10:[1,10],11:[1,11],12:[1,12],13:[1,13],14:[1,14],15:[1,15],16:[1,16]},{5:[2,3],6:[2,3],7:[2,3],8:[2,3],9:[1,9],10:[1,10],11:[1,11],12:[1,12],13:[1,13],14:[1,14],15:[1,15],16:[1,16],18:[2,3]},{5:[2,4],6:[2,4],7:[2,4],8:[2,4],9:[2,4],10:[1,10],11:[1,11],12:[1,12],13:[1,13],14:[1,14],15:[1,15],16:[1,16],18:[2,4]},{5:[2,5],6:[2,5],7:[2,5],8:[2,5],9:[2,5],10:[2,5],11:[2,5],12:[2,5],13:[2,5],14:[2,5],15:[2,5],16:[1,16],18:[2,5]},{5:[2,6],6:[2,6],7:[2,6],8:[2,6],9:[2,6],10:[2,6],11:[2,6],12:[2,6],13:[2,6],14:[2,6],15:[2,6],16:[1,16],18:[2,6]},{5:[2,7],6:[2,7],7:[2,7],8:[2,7],9:[2,7],10:[2,7],11:[2,7],12:[2,7],13:[2,7],14:[2,7],15:[2,7],16:[1,16],18:[2,7]},{5:[2,8],6:[2,8],7:[2,8],8:[2,8],9:[2,8],10:[2,8],11:[2,8],12:[2,8],13:[2,8],14:[2,8],15:[2,8],16:[1,16],18:[2,8]},{5:[2,9],6:[2,9],7:[2,9],8:[2,9],9:[2,9],10:[2,9],11:[2,9],12:[2,9],13:[2,9],14:[2,9],15:[2,9],16:[1,16],18:[2,9]},{5:[2,10],6:[2,10],7:[2,10],8:[2,10],9:[2,10],10:[2,10],11:[2,10],12:[2,10],13:[2,10],14:[2,10],15:[2,10],16:[1,16],18:[2,10]},{5:[2,11],6:[2,11],7:[2,11],8:[2,11],9:[2,11],10:[2,11],11:[2,11],12:[2,11],13:[2,11],14:[2,11],15:[2,11],16:[2,11],18:[2,11]},{5:[2,12],6:[2,12],7:[2,12],8:[2,12],9:[2,12],10:[2,12],11:[2,12],12:[2,12],13:[2,12],14:[2,12],15:[2,12],16:[2,12],18:[2,12]},{4:30,17:[1,3],19:[1,4],20:[1,5]},{5:[2,2],6:[1,7],7:[2,2],8:[1,8],9:[1,9],10:[1,10],11:[1,11],12:[1,12],13:[1,13],14:[1,14],15:[1,15],16:[1,16],18:[2,2]}],defaultActions:{6:[2,1]},parseError:function(a,b){throw new Error(a)},parse:function(a){function b(a){e.length=e.length-2*a,f.length=f.length-a,g.length=g.length-a}function c(){var a;return a=d.lexer.lex()||1,"number"!=typeof a&&(a=d.symbols_[a]||a),a}var d=this,e=[0],f=[null],g=[],h=this.table,i="",j=0,k=0,l=0,m=2,n=1;this.lexer.setInput(a),this.lexer.yy=this.yy,this.yy.lexer=this.lexer,"undefined"==typeof this.lexer.yylloc&&(this.lexer.yylloc={});var o=this.lexer.yylloc;g.push(o),"function"==typeof this.yy.parseError&&(this.parseError=this.yy.parseError);for(var p,q,r,s,t,u,v,w,x,y={};;){if(r=e[e.length-1],this.defaultActions[r]?s=this.defaultActions[r]:(null==p&&(p=c()),s=h[r]&&h[r][p]),"undefined"==typeof s||!s.length||!s[0]){if(!l){x=[];for(u in h[r])this.terminals_[u]&&u>2&&x.push("'"+this.terminals_[u]+"'");var z="";z=this.lexer.showPosition?"Parse error on line "+(j+1)+":\n"+this.lexer.showPosition()+"\nExpecting "+x.join(", ")+", got '"+this.terminals_[p]+"'":"Parse error on line "+(j+1)+": Unexpected "+(1==p?"end of input":"'"+(this.terminals_[p]||p)+"'"),this.parseError(z,{text:this.lexer.match,token:this.terminals_[p]||p,line:this.lexer.yylineno,loc:o,expected:x})}if(3==l){if(p==n)throw new Error(z||"Parsing halted.");k=this.lexer.yyleng,i=this.lexer.yytext,j=this.lexer.yylineno,o=this.lexer.yylloc,p=c()}for(;;){if(m.toString()in h[r])break;if(0==r)throw new Error(z||"Parsing halted.");b(1),r=e[e.length-1]}q=p,p=m,r=e[e.length-1],s=h[r]&&h[r][m],l=3}if(s[0]instanceof Array&&s.length>1)throw new Error("Parse Error: multiple actions possible at state: "+r+", token: "+p);switch(s[0]){case 1:e.push(p),f.push(this.lexer.yytext),g.push(this.lexer.yylloc),e.push(s[1]),p=null,q?(p=q,q=null):(k=this.lexer.yyleng,i=this.lexer.yytext,j=this.lexer.yylineno,o=this.lexer.yylloc,l>0&&l--);break;case 2:if(v=this.productions_[s[1]][1],y.$=f[f.length-v],y._$={first_line:g[g.length-(v||1)].first_line,last_line:g[g.length-1].last_line,first_column:g[g.length-(v||1)].first_column,last_column:g[g.length-1].last_column},t=this.performAction.call(y,i,k,j,this.yy,s[1],f,g),"undefined"!=typeof t)return t;v&&(e=e.slice(0,-1*v*2),f=f.slice(0,-1*v),g=g.slice(0,-1*v)),e.push(this.productions_[s[1]][0]),f.push(y.$),g.push(y._$),w=h[e[e.length-2]][e[e.length-1]],e.push(w);break;case 3:return!0}}return!0}},b=function(){var a={EOF:1,parseError:function(a,b){if(!this.yy.parseError)throw new Error(a);this.yy.parseError(a,b)},setInput:function(a){return this._input=a,this._more=this._less=this.done=!1,this.yylineno=this.yyleng=0,this.yytext=this.matched=this.match="",this.conditionStack=["INITIAL"],this.yylloc={first_line:1,first_column:0,last_line:1,last_column:0},this},input:function(){var a=this._input[0];this.yytext+=a,this.yyleng++,this.match+=a,this.matched+=a;var b=a.match(/\n/);return b&&this.yylineno++,this._input=this._input.slice(1),a},unput:function(a){return this._input=a+this._input,this},more:function(){return this._more=!0,this},pastInput:function(){var a=this.matched.substr(0,this.matched.length-this.match.length);return(a.length>20?"...":"")+a.substr(-20).replace(/\n/g,"")},upcomingInput:function(){var a=this.match;return a.length<20&&(a+=this._input.substr(0,20-a.length)),(a.substr(0,20)+(a.length>20?"...":"")).replace(/\n/g,"")},showPosition:function(){var a=this.pastInput(),b=new Array(a.length+1).join("-");return a+this.upcomingInput()+"\n"+b+"^"},next:function(){if(this.done)return this.EOF;this._input||(this.done=!0);var a,b,c;this._more||(this.yytext="",this.match="");for(var d=this._currentRules(),e=0;e<d.length;e++)if(b=this._input.match(this.rules[d[e]]))return c=b[0].match(/\n.*/g),c&&(this.yylineno+=c.length),this.yylloc={first_line:this.yylloc.last_line,last_line:this.yylineno+1,first_column:this.yylloc.last_column,last_column:c?c[c.length-1].length-1:this.yylloc.last_column+b[0].length},this.yytext+=b[0],this.match+=b[0],this.matches=b,this.yyleng=this.yytext.length,this._more=!1,this._input=this._input.slice(b[0].length),this.matched+=b[0],a=this.performAction.call(this,this.yy,this,d[e],this.conditionStack[this.conditionStack.length-1]),a?a:void 0;return""===this._input?this.EOF:void this.parseError("Lexical error on line "+(this.yylineno+1)+". Unrecognized text.\n"+this.showPosition(),{text:"",token:null,line:this.yylineno})},lex:function(){var a=this.next();return"undefined"!=typeof a?a:this.lex()},begin:function(a){this.conditionStack.push(a)},popState:function(){return this.conditionStack.pop()},_currentRules:function(){return this.conditions[this.conditionStack[this.conditionStack.length-1]].rules},topState:function(){return this.conditionStack[this.conditionStack.length-2]},pushState:function(a){this.begin(a)}};return a.performAction=function(a,b,c,d){switch(c){case 0:break;case 1:return 20;case 2:return 19;case 3:return 8;case 4:return 9;case 5:return 6;case 6:return 7;case 7:return 11;case 8:return 13;case 9:return 10;case 10:return 12;case 11:return 14;case 12:return 15;case 13:return 16;case 14:return 17;case 15:return 18;case 16:return 5;case 17:return"INVALID"}},a.rules=[/^\s+/,/^[0-9]+(\.[0-9]+)?\b/,/^n\b/,/^\|\|/,/^&&/,/^\?/,/^:/,/^<=/,/^>=/,/^</,/^>/,/^!=/,/^==/,/^%/,/^\(/,/^\)/,/^$/,/^./],a.conditions={INITIAL:{rules:[0,1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17],inclusive:!0}},a}();return a.lexer=b,a}(),"undefined"!=typeof exports?("undefined"!=typeof module&&module.exports&&(exports=module.exports=l),exports.Jed=l):("function"==typeof define&&define.amd&&define("jed",function(){return l}),a.Jed=l)}(this)}.call(YoastSEO),YoastSEO="undefined"==typeof YoastSEO?{}:YoastSEO,YoastSEO.analyzerConfig={queue:["wordCount","keywordDensity","subHeadings","stopwords","fleschReading","linkCount","imageCount","urlKeyword","urlLength","metaDescription","pageTitleKeyword","pageTitleLength","firstParagraph"],stopWords:["a","about","above","after","again","against","all","am","an","and","any","are","as","at","be","because","been","before","being","below","between","both","but","by","could","did","do","does","doing","down","during","each","few","for","from","further","had","has","have","having","he","he'd","he'll","he's","her","here","here's","hers","herself","him","himself","his","how","how's","i","i'd","i'll","i'm","i've","if","in","into","is","it","it's","its","itself","let's","me","more","most","my","myself","nor","of","on","once","only","or","other","ought","our","ours","ourselves","out","over","own","same","she","she'd","she'll","she's","should","so","some","such","than","that","that's","the","their","theirs","them","themselves","then","there","there's","these","they","they'd","they'll","they're","they've","this","those","through","to","too","under","until","up","very","was","we","we'd","we'll","we're","we've","were","what","what's","when","when's","where","where's","which","while","who","who's","whom","why","why's","with","would","you","you'd","you'll","you're","you've","your","yours","yourself","yourselves"],wordsToRemove:[" a"," in"," an"," on"," for"," the"," and"],maxSlugLength:20,maxUrlLength:40,maxMeta:156},YoastSEO.preprocessorConfig={syllables:{subtractSyllables:["cial","tia","cius","cious","giu","ion","iou","sia$","[^aeiuoyt]{2,}ed$","[aeiouy][^aeiuoyts]{1,}e\\b",".ely$","[cg]h?e[sd]","rved$","rved","[aeiouy][dt]es?$","[aeiouy][^aeiouydt]e[sd]?$","^[dr]e[aeiou][^aeiou]+$","[aeiouy]rse$"],addSyllables:["ia","riet","dien","iu","io","ii","[aeiouym][bdp]l","[aeiou]{3}","^mc","ism$","([^aeiouy])l$","[^l]lien","^coa[dglx].","[^gq]ua[^auieo]","dnt$","uity$","ie(r|st)","[aeiouy]ing","[aeiouw]y[aeiou]"],exclusionWords:[{word:"shoreline",syllables:2},{word:"simile",syllables:3}]},diacriticsRemovalMap:[{base:"a",letters:/[\u0061\u24D0\uFF41\u1E9A\u00E0\u00E1\u00E2\u1EA7\u1EA5\u1EAB\u1EA9\u00E3\u0101\u0103\u1EB1\u1EAF\u1EB5\u1EB3\u0227\u01E1\u00E4\u01DF\u1EA3\u00E5\u01FB\u01CE\u0201\u0203\u1EA1\u1EAD\u1EB7\u1E01\u0105\u2C65\u0250]/g},{base:"aa",letters:/[\uA733]/g},{base:"ae",letters:/[\u00E6\u01FD\u01E3]/g},{base:"ao",letters:/[\uA735]/g},{base:"au",letters:/[\uA737]/g},{base:"av",letters:/[\uA739\uA73B]/g},{base:"ay",letters:/[\uA73D]/g},{base:"b",letters:/[\u0062\u24D1\uFF42\u1E03\u1E05\u1E07\u0180\u0183\u0253]/g},{base:"c",letters:/[\u0063\u24D2\uFF43\u0107\u0109\u010B\u010D\u00E7\u1E09\u0188\u023C\uA73F\u2184]/g},{base:"d",letters:/[\u0064\u24D3\uFF44\u1E0B\u010F\u1E0D\u1E11\u1E13\u1E0F\u0111\u018C\u0256\u0257\uA77A]/g},{base:"dz",letters:/[\u01F3\u01C6]/g},{base:"e",letters:/[\u0065\u24D4\uFF45\u00E8\u00E9\u00EA\u1EC1\u1EBF\u1EC5\u1EC3\u1EBD\u0113\u1E15\u1E17\u0115\u0117\u00EB\u1EBB\u011B\u0205\u0207\u1EB9\u1EC7\u0229\u1E1D\u0119\u1E19\u1E1B\u0247\u025B\u01DD]/g},{base:"f",letters:/[\u0066\u24D5\uFF46\u1E1F\u0192\uA77C]/g},{base:"g",letters:/[\u0067\u24D6\uFF47\u01F5\u011D\u1E21\u011F\u0121\u01E7\u0123\u01E5\u0260\uA7A1\u1D79\uA77F]/g},{base:"h",letters:/[\u0068\u24D7\uFF48\u0125\u1E23\u1E27\u021F\u1E25\u1E29\u1E2B\u1E96\u0127\u2C68\u2C76\u0265]/g},{base:"hv",letters:/[\u0195]/g},{base:"i",letters:/[\u0069\u24D8\uFF49\u00EC\u00ED\u00EE\u0129\u012B\u012D\u00EF\u1E2F\u1EC9\u01D0\u0209\u020B\u1ECB\u012F\u1E2D\u0268\u0131]/g},{base:"j",letters:/[\u006A\u24D9\uFF4A\u0135\u01F0\u0249]/g},{base:"k",letters:/[\u006B\u24DA\uFF4B\u1E31\u01E9\u1E33\u0137\u1E35\u0199\u2C6A\uA741\uA743\uA745\uA7A3]/g},{base:"l",letters:/[\u006C\u24DB\uFF4C\u0140\u013A\u013E\u1E37\u1E39\u013C\u1E3D\u1E3B\u017F\u0142\u019A\u026B\u2C61\uA749\uA781\uA747]/g},{base:"lj",letters:/[\u01C9]/g},{base:"m",letters:/[\u006D\u24DC\uFF4D\u1E3F\u1E41\u1E43\u0271\u026F]/g},{base:"n",letters:/[\u006E\u24DD\uFF4E\u01F9\u0144\u00F1\u1E45\u0148\u1E47\u0146\u1E4B\u1E49\u019E\u0272\u0149\uA791\uA7A5]/g},{base:"nj",letters:/[\u01CC]/g},{base:"o",letters:/[\u006F\u24DE\uFF4F\u00F2\u00F3\u00F4\u1ED3\u1ED1\u1ED7\u1ED5\u00F5\u1E4D\u022D\u1E4F\u014D\u1E51\u1E53\u014F\u022F\u0231\u00F6\u022B\u1ECF\u0151\u01D2\u020D\u020F\u01A1\u1EDD\u1EDB\u1EE1\u1EDF\u1EE3\u1ECD\u1ED9\u01EB\u01ED\u00F8\u01FF\u0254\uA74B\uA74D\u0275]/g},{base:"oi",letters:/[\u01A3]/g},{base:"ou",letters:/[\u0223]/g},{base:"oo",letters:/[\uA74F]/g},{base:"p",letters:/[\u0070\u24DF\uFF50\u1E55\u1E57\u01A5\u1D7D\uA751\uA753\uA755]/g},{base:"q",letters:/[\u0071\u24E0\uFF51\u024B\uA757\uA759]/g},{base:"r",letters:/[\u0072\u24E1\uFF52\u0155\u1E59\u0159\u0211\u0213\u1E5B\u1E5D\u0157\u1E5F\u024D\u027D\uA75B\uA7A7\uA783]/g},{base:"s",letters:/[\u0073\u24E2\uFF53\u00DF\u015B\u1E65\u015D\u1E61\u0161\u1E67\u1E63\u1E69\u0219\u015F\u023F\uA7A9\uA785\u1E9B]/g},{base:"t",letters:/[\u0074\u24E3\uFF54\u1E6B\u1E97\u0165\u1E6D\u021B\u0163\u1E71\u1E6F\u0167\u01AD\u0288\u2C66\uA787]/g},{base:"tz",letters:/[\uA729]/g},{base:"u",letters:/[\u0075\u24E4\uFF55\u00F9\u00FA\u00FB\u0169\u1E79\u016B\u1E7B\u016D\u00FC\u01DC\u01D8\u01D6\u01DA\u1EE7\u016F\u0171\u01D4\u0215\u0217\u01B0\u1EEB\u1EE9\u1EEF\u1EED\u1EF1\u1EE5\u1E73\u0173\u1E77\u1E75\u0289]/g},{base:"v",letters:/[\u0076\u24E5\uFF56\u1E7D\u1E7F\u028B\uA75F\u028C]/g},{base:"vy",letters:/[\uA761]/g},{base:"w",letters:/[\u0077\u24E6\uFF57\u1E81\u1E83\u0175\u1E87\u1E85\u1E98\u1E89\u2C73]/g},{base:"x",letters:/[\u0078\u24E7\uFF58\u1E8B\u1E8D]/g},{base:"y",letters:/[\u0079\u24E8\uFF59\u1EF3\u00FD\u0177\u1EF9\u0233\u1E8F\u00FF\u1EF7\u1E99\u1EF5\u01B4\u024F\u1EFF]/g},{base:"z",letters:/[\u007A\u24E9\uFF5A\u017A\u1E91\u017C\u017E\u1E93\u1E95\u01B6\u0225\u0240\u2C6C\uA763]/g}]},YoastSEO="undefined"==typeof YoastSEO?{}:YoastSEO,YoastSEO.analyzerScoreRating=9,YoastSEO.AnalyzerScoring=function(a){this.analyzerScoring=[{scoreName:"wordCount",scoreArray:[{min:300,score:9,text:a.dgettext("js-text-analysis","The text contains %1$d words, this is more than the %2$d word recommended minimum.")},{min:250,max:299,score:7,text:a.dgettext("js-text-analysis","The text contains %1$d words, this is slightly below the %2$d word recommended minimum, add a bit more copy.")},{min:200,max:249,score:5,text:a.dgettext("js-text-analysis","The text contains %1$d words, this is below the %2$d word recommended minimum. Add more useful content on this topic for readers.")},{min:100,max:199,score:-10,text:a.dgettext("js-text-analysis","The text contains %1$d words, this is below the %2$d word recommended minimum. Add more useful content on this topic for readers.")},{min:0,max:99,score:-20,text:a.dgettext("js-text-analysis","The text contains %1$d words. This is far too low and should be increased.")}],replaceArray:[{name:"wordCount",position:"%1$d",source:"matcher"},{name:"recommendedWordcount",position:"%2$d",value:300}]},{scoreName:"keywordCheck",scoreArray:[{max:0,score:-999,text:a.dgettext("js-text-analysis","No focus keyword was set for this page. If you do not set a focus keyword, no score can be calculated.")}]},{scoreName:"keywordDensity",scoreArray:[{min:3.5,score:-50,text:a.dgettext("js-text-analysis","The keyword density is %1$f%, which is way over the advised 2.5% maximum, the focus keyword was found %2$d times.")},{min:2.5,max:3.49,score:-10,text:a.dgettext("js-text-analysis","The keyword density is %1$f%, which is over the advised 2.5% maximum, the focus keyword was found %2$d times.")},{min:.5,max:2.49,score:9,text:a.dgettext("js-text-analysis","The keyword density is %1$f%, which is great, the focus keyword was found %2$d times.")},{min:0,max:.49,score:4,text:a.dgettext("js-text-analysis","The keyword density is %1$f%, which is a bit low, the focus keyword was found %2$d times.")}],replaceArray:[{name:"keywordDensity",position:"%1$f",source:"matcher"},{name:"keywordCount",position:"%2$d",sourceObj:".refObj.__store.keywordCount"}]},{scoreName:"linkCount",scoreArray:[{matcher:"total",min:0,max:0,score:6,text:a.dgettext("js-text-analysis","No outbound links appear in this page, consider adding some as appropriate.")},{matcher:"totalKeyword",min:1,score:2,text:a.dgettext("js-text-analysis","You're linking to another page with the focus keyword you want this page to rank for, consider changing that if you truly want this page to rank.")},{type:"externalAllNofollow",score:7,text:a.dgettext("js-text-analysis","This page has %2$s outbound link(s), all nofollowed.")},{type:"externalHasNofollow",score:8,text:a.dgettext("js-text-analysis","This page has %2$s nofollowed link(s) and %3$s normal outbound link(s).")},{type:"externalAllDofollow",score:9,text:a.dgettext("js-text-analysis","This page has %1$s outbound link(s).")}],replaceArray:[{name:"links",position:"%1$s",sourceObj:".result.externalTotal"},{name:"nofollow",position:"%2$s",sourceObj:".result.externalNofollow"},{name:"dofollow",position:"%3$s",sourceObj:".result.externalDofollow"}]},{scoreName:"fleschReading",scoreArray:[{min:90,score:9,text:"<%text%>",resultText:"very easy",note:""},{min:80,max:89.9,score:9,text:"<%text%>",resultText:"easy",note:""},{min:70,max:79.9,score:8,text:"<%text%>",resultText:"fairly easy",note:""},{min:60,max:69.9,score:7,text:"<%text%>",resultText:"ok",note:""},{min:50,max:59.9,score:6,text:"<%text%>",resultText:a.dgettext("js-text-analysis","fairly difficult"),note:a.dgettext("js-text-analysis","Try to make shorter sentences to improve readability.")},{min:30,max:49.9,score:5,text:"<%text%>",resultText:a.dgettext("js-text-analysis","difficult"),note:a.dgettext("js-text-analysis","Try to make shorter sentences, using less difficult words to improve readability.")},{min:0,max:29.9,score:4,text:"<%text%>",resultText:a.dgettext("js-text-analysis","very difficult"),note:a.dgettext("js-text-analysis","Try to make shorter sentences, using less difficult words to improve readability.")}],replaceArray:[{name:"scoreText",position:"<%text%>",value:a.dgettext("js-text-analysis","The copy scores %1$s in the %2$s test, which is considered %3$s to read. %4$s")},{name:"text",position:"%1$s",sourceObj:".result"},{name:"scoreUrl",position:"%2$s",value:"<a href='https://en.wikipedia.org/wiki/Flesch-Kincaid_readability_test#Flesch_Reading_Ease' target='new'>Flesch Reading Ease</a>"},{name:"resultText",position:"%3$s",scoreObj:"resultText"},{name:"note",position:"%4$s",scoreObj:"note"}]},{scoreName:"metaDescriptionLength",metaMinLength:120,metaMaxLength:156,scoreArray:[{max:0,score:1,text:a.dgettext("js-text-analysis","No meta description has been specified, search engines will display copy from the page instead.")},{max:120,score:6,text:a.dgettext("js-text-analysis","The meta description is under %1$d characters, however up to %2$d characters are available.")},{min:156,score:6,text:a.dgettext("js-text-analysis","The specified meta description is over %2$d characters, reducing it will ensure the entire description is visible")},{min:120,max:156,score:9,text:a.dgettext("js-text-analysis","In the specified meta description, consider: How does it compare to the competition? Could it be made more appealing?")}],replaceArray:[{name:"minCharacters",position:"%1$d",value:120},{name:"maxCharacters",position:"%2$d",value:156}]},{scoreName:"metaDescriptionKeyword",scoreArray:[{min:1,score:9,text:a.dgettext("js-text-analysis","The meta description contains the focus keyword.")},{max:0,min:0,score:3,text:a.dgettext("js-text-analysis","A meta description has been specified, but it does not contain the focus keyword.")}]},{scoreName:"firstParagraph",scoreArray:[{max:0,score:3,text:a.dgettext("js-text-analysis","The focus keyword doesn't appear in the first paragraph of the copy, make sure the topic is clear immediately.")},{min:1,score:9,text:a.dgettext("js-text-analysis","The focus keyword appears in the first paragraph of the copy.")}]},{scoreName:"stopwordKeywordCount",scoreArray:[{matcher:"count",min:1,score:5,text:a.dgettext("js-text-analysis","The focus keyword for this page contains one or more %1$s, consider removing them. Found '%2$s'.")},{matcher:"count",max:0,score:0,text:""}],replaceArray:[{name:"scoreUrl",position:"%1$s",value:a.dgettext("js-text-analysis","<a href='https://en.wikipedia.org/wiki/Stop_words' target='new'>stop words</a>")},{name:"stopwords",position:"%2$s",sourceObj:".result.matches"}]},{scoreName:"subHeadings",scoreArray:[{matcher:"count",max:0,score:7,text:a.dgettext("js-text-analysis","No subheading tags (like an H2) appear in the copy.")},{matcher:"matches",max:0,score:3,text:a.dgettext("js-text-analysis","You have not used your focus keyword in any subheading (such as an H2) in your copy.")},{matcher:"matches",min:1,score:9,text:a.dgettext("js-text-analysis","The focus keyword appears in %2$d (out of %1$d) subheadings in the copy. While not a major ranking factor, this is beneficial.")}],replaceArray:[{name:"count",position:"%1$d",sourceObj:".result.count"},{name:"matches",position:"%2$d",sourceObj:".result.matches"}]},{scoreName:"pageTitleLength",scoreArray:[{max:0,score:1,text:a.dgettext("js-text-analysis","Please create a page title.")},{max:40,score:6,text:a.dgettext("js-text-analysis","The page title contains %3$d characters, which is less than the recommended minimum of %1$d characters. Use the space to add keyword variations or create compelling call-to-action copy.")},{min:70,score:6,text:a.dgettext("js-text-analysis","The page title contains %3$d characters, which is more than the viewable limit of %2$d characters; some words will not be visible to users in your listing.")},{min:40,max:70,score:9,text:a.dgettext("js-text-analysis","The page title is more than %1$d characters and less than the recommended %2$d character limit.")}],replaceArray:[{name:"minLength",position:"%1$d",value:40},{name:"maxLength",position:"%2$d",value:70},{name:"length",position:"%3$d",source:"matcher"}]},{scoreName:"pageTitleKeyword",scoreTitleKeywordLimit:0,scoreArray:[{matcher:"matches",max:0,score:2,text:a.dgettext("js-text-analysis","The focus keyword '%1$s' does not appear in the page title.")},{matcher:"position",max:1,score:9,text:a.dgettext("js-text-analysis","The page title contains the focus keyword, at the beginning which is considered to improve rankings.")},{matcher:"position",min:1,score:6,text:a.dgettext("js-text-analysis","The page title contains the focus keyword, but it does not appear at the beginning; try and move it to the beginning.")}],replaceArray:[{name:"keyword",position:"%1$s",sourceObj:".refObj.config.keyword"}]},{scoreName:"urlKeyword",scoreArray:[{min:1,score:9,text:a.dgettext("js-text-analysis","The focus keyword appears in the URL for this page.")},{max:0,score:6,text:a.dgettext("js-text-analysis","The focus keyword does not appear in the URL for this page. If you decide to rename the URL be sure to check the old URL 301 redirects to the new one!")}]},{scoreName:"urlLength",scoreArray:[{type:"urlTooLong",score:5,text:a.dgettext("js-text-analysis","The slug for this page is a bit long, consider shortening it.")}]},{scoreName:"urlStopwords",scoreArray:[{min:1,score:5,text:a.dgettext("js-text-analysis","The slug for this page contains one or more <a href='http://en.wikipedia.org/wiki/Stop_words' target='new'>stop words</a>, consider removing them.")}]},{scoreName:"imageCount",scoreArray:[{
matcher:"total",max:0,score:3,text:a.dgettext("js-text-analysis","No images appear in this page, consider adding some as appropriate.")},{matcher:"noAlt",min:1,score:5,text:a.dgettext("js-text-analysis","The images on this page are missing alt tags.")},{matcher:"alt",min:1,score:5,text:a.dgettext("js-text-analysis","The images on this page do not have alt tags containing your focus keyword.")},{matcher:"altKeyword",min:1,score:9,text:a.dgettext("js-text-analysis","The images on this page contain alt tags with the focus keyword.")}]},{scoreName:"keywordDoubles",scoreArray:[{matcher:"count",max:0,score:9,text:a.dgettext("js-text-analysis","You've never used this focus keyword before, very good.")},{matcher:"count",max:1,score:6,text:a.dgettext("js-text-analysis","You've used this focus keyword %1$sonce before%2$s, be sure to make very clear which URL on your site is the most important for this keyword.")},{matcher:"count",min:1,score:1,text:a.dgettext("js-text-analysis","You've used this focus keyword %3$s%4$d times before%2$s, it's probably a good idea to read %6$sthis post on cornerstone content%5$s and improve your keyword strategy.")}],replaceArray:[{name:"singleUrl",position:"%1$s",sourceObj:".refObj.config.postUrl"},{name:"endTag",position:"%2$s",value:"</a>"},{name:"multiUrl",position:"%3$s",sourceObj:".refObj.config.searchUrl"},{name:"occurrences",position:"%4$d",sourceObj:".result.count"},{name:"endTag",position:"%5$s",value:"</a>"},{name:"cornerstone",position:"%6$s",value:"<a href='https://yoast.com/cornerstone-content-rank/' target='new'>"},{name:"id",position:"{id}",sourceObj:".result.id"},{name:"keyword",position:"{keyword}",sourceObj:".refObj.config.keyword"}]}]};;
var YoastSeo = YoastSeo || {};
YoastSeo.model = YoastSeo.model || {};

/**
 * @file
 * Drupal Yoast SEO analyser model class.
 *
 * @ignore
 */

(function ($, Drupal) {

  "use strict";

  YoastSeo.model.Status = Backbone.Model.extend({}, {

    /**
     * Returns a string that is used as a CSS class, based on the numeric score.
     *
     * @param score
     * @returns output
     */
    scoreRating: function (score) {
      var rules = YoastSeo.model.Status.score_status,
        def = rules['default'];
      delete rules['default'];

      for (var i in rules) {
        if (score <= parseInt(i)) {
          return rules[i];
        }
      }

      return def;
    }

  });

})(jQuery, Drupal);
;
var YoastSeo = YoastSeo || {};

/**
 * @file
 * Drupal Yoast SEO analyser model class.
 *
 * @ignore
 */

(function ($, Drupal) {

  "use strict";

  YoastSeo.Analyser = Backbone.Model.extend({

    /**
     * The instance of the Yoast analyser.
     */
    yoast_analyser: null,

    /**
     * The model default options.
     */
    default_options: {
      analyser: {
        snippetPreview: null,
        elementTarget: [],
        typeDelay: 300,
        typeDelayStep: 100,
        maxTypeDelay: 1500,
        dynamicDelay: true,
        multiKeyword: false,
        snippetFields: {
          title: "snippet_title",
          url: "snippet_cite",
          meta: "snippet_meta"
        },
        targets: {
          output: null,
          overall: null,
          snippet: null
        },
        sampleText: {
          url: '',
          title: '',
          keyword: '',
          meta: '',
          text: ''
        }
      },
      baseRoot: '/'
    },

    // Analyser constructor.
    initialize: function (attributes, options) {
      this.options = $.extend(true, {}, this.default_options, options);

      // Declaring the callback functions required by the Yoast SEO analyser.
      this.options.analyser.callbacks = {
        getData: this.getData.bind(this),
        getAnalyzerInput: this.getAnalyzerInput.bind(this),
        bindElementEvents: this.bindElementEvents.bind(this),
        updateSnippetValues: this.updateSnippetValues.bind(this),
        saveScores: this.saveScores.bind(this)
      };

      // Make it global.
      this.yoast_analyser = new YoastSEO.App(this.options.analyser);
    },

    /**
     * Destroy the analyser
     */
    destroy: function() {
      delete this.yoast_analyser;
    },

    /**
     * Return an object fulfilling the Yoast SEO library getData callback requirements.
     *
     * @callback YoastSEO.App~getData
     *
     * @returns {Object} data
     * @returns {String} data.keyword The keyword that should be used
     * @returns {String} data.meta
     * @returns {String} data.text The text to analyze
     * @returns {String} data.pageTitle The text in the HTML title tag
     * @returns {String} data.title The title to analyze
     * @returns {String} data.url The URL for the given page
     * @returns {String} data.excerpt Excerpt for the pages
     */
    getData: function () {
      var data = {
        keyword: '',
        meta: '',
        text: '',
        pageTitle: '',
        title: '',
        url: '',
        excerpt: '',
        snippetMeta: '',
        snippetCite: '',
        snippetTitle: '',
        baseUrl: ''
      };
      return data;
    },

    /**
     * @callback YoastSEO.App~getAnalyzerInput
     */
    getAnalyzerInput: function () {
      // If needed implement your logic in an inherited class.
    },

    /**
     * Calls the eventbinders.
     * We don't need it.
     *
     * @callback YoastSEO.App~bindElementEvents
     */
    bindElementEvents: function () {
      // If needed implement your logic in an inherited class.
    },

    /**
     * Updates the snippet values.
     * We don't need it.
     *
     * @callback YoastSEO.App~updateSnippetValues
     *
     * @param {Object} ev
     */
    updateSnippetValues: function () {
      // If needed implement your logic in an inherited class.
    },

    /**
     * Score has been calculated callback.
     *
     * @callback YoastSEO.App~saveScores
     */
    saveScores: function (score) {
      if (this.options.callback.saveScores != null) {
        this.options.callback.saveScores(score);
      }
    }

  });

})(jQuery, Drupal);
;
/**
 * @file
 * Drupal Yoast SEO form utility.
 *
 * This library will help developers to interacts with drupal form
 * on client side.
 *
 * @ignore
 */

(function ($, Drupal) {

  'use strict';

  /**
   * @namespace
   */
  var BackboneForm = {

    /**
     * Form item views store.
     */
    _formItemViews: {},

    /**
     * Based on a form item HTMLElement wrapper, get the FormItem view class
     * to use to control the form item HTMLElement field.
     *
     * @param el
     *
     * @returns {function}
     */
    getFormItemClass: function (el_wrapper) {
      var field_item_class = BackboneForm.views.Textfield;
      var field_types_map = {
        'js-form-type-textfield': 'Textfield',
        'js-form-type-textarea': 'Textarea'
      };

      // If the element carries a CKEDITOR.
      var $textarea = $('textarea', $(el_wrapper));
      if ($textarea.length && CKEDITOR.dom.element.get($textarea[0]).getEditor()) {
        field_item_class = BackboneForm.views.Ckeditor;
      }
      else {
        // Else define the FormItem class regarding the element wrapper classes.
        for (var field_type in field_types_map) {
          if ($(el_wrapper).hasClass(field_type)) {
            field_item_class = BackboneForm.views[field_types_map[field_type]];
          }
        }
      }

      return field_item_class;
    },

    /**
     * Factory to instantiate or retrieve a Form Item view based on a HTMLElement
     * wrapper.
     *
     * @param el_wrapper The HTMLElement to plug the FormItem view element on.
     * @param options Options to pass to the form item view constructor.
     *
     * @returns {Backbone.View}
     */
    getFormItemView: function (el_wrapper, options) {
      // Get the FormItem view class based on the HTMLElement wrapper.
      var FormItemViewClass = BackboneForm.getFormItemClass(el_wrapper),
      // The HTMLElement to bind the FieldItem view onto.
        el = null,
      // The form item view.
        formItem = null,
      // The options to pass to the form item class.
        options = options || {};

      // Based on the FormItem view tag, retrieve the HTMLElement to bind the View onto.
      el = $(FormItemViewClass.tag, el_wrapper);
      options.el = el;

      // Instantiate the form item view.
      formItem = new FormItemViewClass(options);

      // If the element has an idea, store it.
      var id = el.attr('id');
      if (id) {
        BackboneForm._formItemViews[id] = formItem;
      }

      // Instantiate the FormItem view.
      return formItem;
    }
  };

  /**
   * @namespace
   */
  BackboneForm.views = {};

  /**
   * Abstract class (kind of) which as for aim to control Drupal Form Item field.
   *
   * @type {BackboneForm.views.FormItem}
   */
  BackboneForm.views.FormItem = Backbone.View.extend({
    /**
     * {@inheritdoc}
     */
    events: {
      'input': '_onInput',
      'focus': '_onFocus',
      'blur': '_onBlur'
    },

    /**
     * The FormItem view callbacks.
     */
    callbacks: {
      // When the value has changed.
      changed: null,
      // When the component has the focus.
      focused: null,
      // When the component has blured.
      blured: null
    },

    /**
     * The value before it has been changed.
     */
    _beforeChangeValue: null,

    /**
     * {@inheritdoc}
     */
    initialize: function (options) {
      var options = options || {};

      // Callbacks have been given in options.
      if (typeof options.callbacks != 'undefined') {
        this.callbacks = options.callbacks;
      }
    },

    /**
     * Listen to the input event.
     *
     * @param evt
     */
    _onInput: function () {
      this._change();
    },

    /**
     * Listen to the focus event.
     *
     * @param evt
     */
    _onFocus: function () {
      this._focus();
    },

    /**
     * Listen to the blur event.
     *
     * @param evt
     */
    _onBlur: function () {
      this._blur();
    },

    /**
     * This function is internally called when the component value changed.
     *
     * @param evt
     * @param val
     */
    _change: function () {
      var value = this.value();
      if (typeof this.callbacks.changed == 'function'
        && value != this._beforeChangeValue) {
        this.callbacks.changed(value);
        this._beforeChangeValue = value;
      }
    },

    /**
     * This function is internally called when the component get the focus.
     *
     * @param evt
     */
    _focus: function () {
      if (typeof this.callbacks.focused == 'function') {
        this.callbacks.focused();
      }
    },

    /**
     * This function is internally called when the component has blured.
     *
     * @param evt
     */
    _blur: function () {
      if (typeof this.callbacks.blured == 'function') {
        this.callbacks.blured();
      }
    },

    /**
     * Get/Set the value of the form item view component.
     *
     * @param val (optional) set the value of the form item view.
     *
     * @return The value of the component if getter or void if setter.
     */
    value: function (val) {
      // No value is provided.
      // Get the value of the component.
      if (typeof val == 'undefined') {
        return this.$el.val();
      }
      // A value is provided.
      // Set the value of the component.
      else {
        this.$el.val(val);
      }
    }
  }, {
    /**
     * The tag of the HTMLElement that carries the form item field.
     */
    tag: 'input'
  });

  /**
   * FormItem view that has for aim to control textfield form item.
   *
   * @type {BackboneForm.views.Textfield}
   */
  BackboneForm.views.Textfield = BackboneForm.views.FormItem.extend({}, {
    tag: 'input'
  });

  /**
   * FormItem view that has for aim to control html element which are editable form item.
   *
   * @type {BackboneForm.views.ContentEditableHtmlElement}
   */
  BackboneForm.views.ContentEditableHtmlElement = BackboneForm.views.FormItem.extend({
    /**
     * {@inheritdoc}
     */
    events: {
      'focus': '_onFocus',
      'blur': '_onBlur',
      // Parent component use the input event, but this event is not supported on IE
      // for contenteditable elements.
      'keyup': '_onKeyup',
      'paste': '_onPaste'
    },

    /**
     * {@inheritdoc}
     */
    _onKeyup: function (evt) {
      this._change();
    },

    /**
     * This function is internally called when the component catch a paste event.
     *
     * @param evt
     */
    _onPaste: function (evt) {
      var self = this;
      setTimeout(function() {
        self._change();
      }, 0);
    },

    /**
     * Move the cursor to the end of the contenteditable element.
     */
    moveCursorEnd: function() {
      var range,selection;
      // Firefox, Chrome, Opera, Safari, IE 9+
      if (document.createRange) {
        range = document.createRange();//Create a range (a range is a like the selection but invisible)
        range.selectNodeContents(this.el);//Select the entire contents of the element with the range
        range.collapse(false);//collapse the range to the end point. false means collapse to end rather than the start
        selection = window.getSelection();//get the selection object (allows you to change selection)
        selection.removeAllRanges();//remove any selections already made
        selection.addRange(range);//make the range you have just created the visible selection
      }
    },

    /**
     * {@inheritdoc}
     */
    value: function (val) {
      // No value is provided.
      // Get the value of the component.
      if (typeof val == 'undefined') {
        return this.$el.html();
      }
      // A value is provided.
      // Set the value of the component.
      else {
        this.$el.html(val);
      }
    }
  }, {
    // Can be any editable HTMLElement.
    tag: 'span'
  });

  /**
   * FormItem view that has for aim to control textfield form item.
   *
   * @type {BackboneForm.views.Textarea}
   */
  BackboneForm.views.Textarea = BackboneForm.views.FormItem.extend({}, {
    tag: 'textarea'
  });

  /**
   * FormItem view that has for aim to control textarea ckeditor form item.
   *
   * @type {BackboneForm.views.Ckeditor}
   */
  BackboneForm.views.Ckeditor = BackboneForm.views.Textarea.extend({
    /**
     * {@inheritdoc}
     */
    events: {},

    /**
     * {@inheritdoc}
     */
    initialize: function (options) {
      var self = this;

      // @todo find a way to call super in Backbone.
      var options = options || {},
        elId = this.$el.attr('id');

      if (typeof elId  == 'undefined') {
        console.debug('BackboneForm.views.Ckeditor requires the elements it is attached to to have an id.');
      }

      // Callbacks have been given in options.
      if (typeof options.callbacks != 'undefined') {
        this.callbacks = options.callbacks;
      }

      // Listen to any change on the CKEDITOR component.
      Drupal.editors.ckeditor.onChange(this.el, function (val) {
        self.$el.val(val);
        self._change();
      });

      // Listen to any change on the CKEDITOR component when it is in source mode.
      if (typeof CKEDITOR.instances[elId] != 'undefined') {
        CKEDITOR.instances[elId].on('key', function() {
          var ckeditor = this;

          if (ckeditor.mode == 'source') {
            setTimeout(function() {
              self.$el.val(ckeditor.getData());
              self._change();
            }, 0);
          }
        });
      } else {
        console.debug('BackboneForm.views.Ckeditor is attached to an element which CKEDITOR can not retrieve');
      }
    }
  }, {
    tag: 'textarea'
  });

  Drupal.BackboneForm = BackboneForm;

})(jQuery, Drupal);
;
var YoastSeo = YoastSeo || {};

/**
 * @file
 * Drupal Yoast SEO focus keyword field handler.
 *
 * @ignore
 */

(function ($, Drupal) {

  'use strict';

  /**
   * This component takes care of handling the focus keyword field.
   *
   *
   * @type {YoastSeo.FocusKeyword}
   */
  YoastSeo.FocusKeyword = Backbone.View.extend({

    /**
     * {@inheritdoc}
     */
    initialize: function (options) {
      this.options = options || {};
      var language = options.language || null,
        self = this;

      // Autocomplete for focus keyword field.
      // We use the google autocomplete api.
      $(this.el).autocomplete({
        source: function(request, response) {
          $.getJSON("http://suggestqueries.google.com/complete/search?callback=?", {
            hl: language,
            q: request.term,
            client: "youtube"
          }).done(function(data) {
            var suggestions = [];
            $.each(data[1], function(key, val) {
              suggestions.push({"value":val[0]});
            });
            suggestions.length = 5;
            response(suggestions);
          });
        },

        // When an item is selected, as no change event is triggered, do it manually.
        close: function() {
          var formItemView = Drupal.BackboneForm._formItemViews[self.$el.attr('id')];
          formItemView._change();
        }
      });
    }

  }, {});

})(jQuery, Drupal);
;
var YoastSeo = YoastSeo || {};

/**
 * @file
 * Drupal Yoast SEO.
 *
 * @ignore
 */

(function ($, Drupal) {

  'use strict';

  /**
   * This component takes care of displaying the Yoast SEO score computed for
   * a content.
   *
   * @type {YoastSeo.Status}
   */
  YoastSeo.Status = Backbone.View.extend({

    /**
     * {@inheritdoc}
     */
    initialize: function (options) {
      var options = options || {};
      this.options = options;

      // Initialize the tooltips.
      $('#yoast-overall-score a.help').tooltip();
    },

    /**
     * Sets the SEO score in both the hidden input and the rating element.
     *
     * @param score
     */
    setScore: function (score) {
      this.score = score;
      var rate = YoastSeo.model.Status.scoreRating(score),
        yoast_settings = drupalSettings.yoast_seo;

      // Update score text in the score box.
      $('.score_value', this.$el).text(rate);

      // Update score in the score field.
      $('[data-drupal-selector="' + yoast_settings.fields.seo_status + '"]')
        .attr('value', score)
        .val(score);
    }

  }, {});

})(jQuery, Drupal);
;
var YoastSeo = YoastSeo || {};
YoastSeo.form = YoastSeo.form || {};

/**
 * @file
 * Drupal Yoast SEO form snippet element Backbone view.
 *
 * This widget as form aim to handle snippet preview field which are content
 * editable element.
 *
 * @ignore
 */

(function ($, Drupal) {

  'use strict';

  /**
   * FormItem view that has for aim to control snippet element which are content editable form item.
   *
   * @type {YoastSeo.form.SnippetElement}
   */
  YoastSeo.form.SnippetElement = Drupal.BackboneForm.views.ContentEditableHtmlElement.extend({
    /**
     * {@inheritdoc}
     */
    events: {
      'focus': '_onFocus',
      'blur': '_onBlur',
      'keyup': '_onKeyup',
      'keypress': '_onKeypress',
      'paste': '_onPaste'
    },

    /**
     * {@inheritdoc}
     */
    _onKeypress: function (evt) {
      // The user can't press enter on the snippet fields.
      if (evt.keyCode == 13) {
        evt.preventDefault();
        evt.stopImmediatePropagation();
        return;
      }
    }

  }, {
    // Can be any editable HTMLElement.
    tag: 'span'
  });

})(jQuery, Drupal);
;
var YoastSeo = YoastSeo || {};

/**
 * @file
 * Drupal Yoast SEO analyser model class for the node edit page.
 *
 * @ignore
 */

(function ($, Drupal) {

  "use strict";

  YoastSeo.AnalyserEditNode = YoastSeo.Analyser.extend({

    /**
     * Map the field of the node edit page with the attributes of the array
     * returned by the getData callback function.
     */
    fieldsMapping: {
      meta: 'meta_description',
      text: 'body',
      pageTitle: 'meta_title',
      title: 'title',
      url: 'path',
      snippetCite: 'path',
      snippetMeta: 'meta_description',
      snippetTitle: 'meta_title',
      keyword: 'focus_keyword'
    },

    /**
     * Tokens already resolved remotely.
     */
    tokensRemote: {},

    /**
     * Extract the form node edit page fields values.
     * Resolve tokens if there are and they can be solved, either locally or remotely.
     *
     * @param data
     * @returns {*}
     */
    extractFieldsValues: function(data) {
      // For all data required by the Yoast SEO snippet.
      // If their is a field extract the data from the fields if these fields
      // have been mapped.
      for (var fieldName in data) {
        var formItemView = Drupal.BackboneForm._formItemViews[this.options.fields[this.fieldsMapping[fieldName]]];

        if (typeof formItemView !== 'undefined') {
          var fieldValue = formItemView.value();

          // If the field hasn't been filled already.
          // Use the default value if provided.
          if (fieldValue == '') {
            if (typeof this.options.default_text[this.fieldsMapping[fieldName]] !== 'undefined'
              && this.options.default_text[this.fieldsMapping[fieldName]] != '') {
              data[fieldName] = this.tokenReplace(this.options.default_text[this.fieldsMapping[fieldName]]);
            }
          }
          // If the field has been filled.
          // Extract the value from the field and replace the tokens if any by their values.
          else {
            data[fieldName] = this.tokenReplace(formItemView.value());
          }
        }

        // If the data is empty and a place holder has been defined, use the placeholder as value.
        if ((typeof this.options.placeholder_text[fieldName] !== 'undefined'
          && this.options.placeholder_text[fieldName] != '') && data[fieldName] == '') {
          data[fieldName] = this.options.placeholder_text[fieldName];
        }
      }

      return data;
    },

    /**
     * {@inheritdoc}
     */
    getData: function () {
      var data = {
        keyword: '',
        meta: '',
        text: '',
        pageTitle: '',
        title: '',
        url: '',
        excerpt: '',
        snippetMeta: '',
        snippetCite: '',
        snippetTitle: '',
        baseUrl: this.options.base_root
      };

      // Extract form values regarding the required getData fields.
      data = this.extractFieldsValues(data);

      // The get data function can be called before the yoast analyser
      // has been instantiated (while instantiating this class by instance).
      if (this.yoast_analyser != null) {
        this.yoast_analyser.rawData = data;
      }

      return data;
    },

    /**
     * Replace tokens contained in a string by their values.
     * The token can be solved following two ways :
     * * Either on the page, if the token is relative to a page field ;
     * * Or remotely, by requesting the server ;
     *
     * @param value The string to process.
     * @returns {string}
     * @todo Can be moved in an util library.
     */
    tokenReplace: function (value) {
      var self = this,
        tokenRegex = /(\[[^\]]*:[^\]]*\])/g,
        match = value.match(tokenRegex),
        tokensNotFound = [];

      // If the value contains tokens.
      if (match != null) {
        // Replace all the tokens by their relative value.
        for (var i in match) {
          var tokenRelativeField = null,
            tokenRawValue = false;

          // Check if the token is relative to a field present on the page.
          if (typeof this.options.tokens[match[i]] != 'undefined') {
            var fieldName = this.options.tokens[match[i]],
              isRelativeField = this.options.fields[fieldName] != undefined;

            // If no field exist with the same token value, we consider it's a raw value.
            if (!isRelativeField) {
              tokenRawValue = true;
            }
            // Else, we know it's related to a field content.
            else {
              tokenRelativeField = this.options.tokens[match[i]];
            }
          }

          // If the token can be solved locally.
          if (tokenRelativeField != null) {
            // Replace the token with the relative field token value.
            var formItemView = Drupal.BackboneForm._formItemViews[this.options.fields[tokenRelativeField]];
            if (typeof formItemView !== 'undefined') {
              var tokenValue = this.tokenReplace(formItemView.value());
              value = value.replace(match[i], tokenValue);
            }
          }
          else if (tokenRawValue == true) {
            value = value.replace(match[i], this.options.tokens[match[i]]);
          }
          // The token value has to be found remotely.
          else {
            // If the token value has already been resolved and stored locally.
            if (typeof this.tokensRemote[match[i]] != 'undefined') {
              value = value.replace(match[i], this.tokensRemote[match[i]]);
            }
            else {
              tokensNotFound.push(match[i]);
            }
          }
        }

        // If some tokens hasn't been resolved locally.
        // Try to solve them remotely.
        if (tokensNotFound.length) {
          jQuery.ajax({
            async: false,
            url: Drupal.url('yoast_seo/tokens'),
            type: 'POST',
            data: {'tokens[]': tokensNotFound},
            dataType: 'json'
          }).then(function (data) {
            // Store their value locally.
            // It will avoid an unnecessary call to the server.
            for (var token in data) {
              self.tokensRemote[token] = data[token];
              value = value.replace(token, self.tokensRemote[token]);
            }
          });
        }
      }

      return value;
    },

    /**
     * refresh the snippet.
     */
    refreshSnippet: function () {
      this.yoast_analyser.reloadSnippetText();
    },

    /**
     * Refresh the anlysis
     */
    refreshAnalysis: function () {
      //this.yoast_analyser.refresh(); // If the external Yoast lib is switched to 1.0.4
      this.yoast_analyser.runAnalyzerCallback();
    },

    /**
     * Save Meta title and description in a cookies.
     * This is for reusing in the preview page.
     */
    saveCookie: function() {
      var data = this.getData(),
        dataToStore = {
        pageTitle: data.pageTitle,
        meta: data.meta,
        keyword: data.keyword,
        url: data.url
      };

      // Store meta title and meta description in a cookie.
      $.cookie.json = true;
      $.cookie(this.options.cookie_data_key, dataToStore, {json: true, path: '/' });
    }
  });

})(jQuery, Drupal);
;
/**
 * @file
 * Drupal Yoast SEO script to apply to the node edit pages.
 *
 * @ignore
 */
(function ($, Drupal) {

  Drupal.behaviors.yoast_seo = {
    attach: function (context, settings) {

      if (settings.yoast_seo == undefined) {
        throw 'YoastSEO settings are not defined';
      }

      // Settings for Yoast SEO.
      var yoast_settings = settings.yoast_seo;

      // Store the score status.
      YoastSeo.model.Status.score_status = yoast_settings.score_status;

      // Initialize the backbone form fields layer upon the drupal rendered fields.
      // It will help to manipulate and interact with them from javascript.
      $('.js-form-item', $('#' + yoast_settings.form_id)).each(function () {
        var formItem = Drupal.BackboneForm.getFormItemView(this, {
          callbacks: {
            changed: function(evt, val) {
              formItem.$el.trigger('yoast_seo-form_item-changed');
            }
          }
        });
      });

      // Instantiate the Yoast SEO status widget, to handle scores display.
      var status_widget_class = YoastSeo.Status;
      // If the premium module is activated, use the premium status widgets.
      if (yoast_settings.premium.activated) {
        status_widget_class = YoastSeo.PremiumEstimatedStatus;
      }

      var status_widget = new status_widget_class({
        el: $('#' + yoast_settings.targets.overall_score_target_id)
      });

      // Instantiate the Yoast SEO focus keyword widget, to handle the autocomplete capability.
      var focus_keyword_widget = new YoastSeo.FocusKeyword({
        el: $('#' + yoast_settings.fields.focus_keyword),
        language: yoast_settings.language
      });

      // Initialize the Yoast analyser.
      // Build the analyser options
      var analyzer_options = {
        analyser: {
          snippetPreview: yoast_settings.snippet_preview,
          elementTarget: [yoast_settings.targets.wrapper_target_id],
          targets: {
            output: yoast_settings.targets.output_target_id,
            overall: yoast_settings.targets.overall_score_target_id,
            snippet: yoast_settings.targets.snippet_target_id
          },
          sampleText: {
            keyword: yoast_settings.default_text.keyword,
            text: yoast_settings.default_text.body
          },
          SEOTitleOverwritten: yoast_settings.seo_title_overwritten
        },
        callback: {
          saveScores: function(score) {
            status_widget.setScore(score);
            analyser.saveCookie();
          }
        },
        default_text: yoast_settings.default_text,
        base_root: yoast_settings.base_root,
        fields: yoast_settings.fields,
        placeholder_text: {
          snippetTitle: yoast_settings.placeholder_text.snippetTitle,
          snippetMeta: yoast_settings.placeholder_text.snippetMeta,
          snippetCite: yoast_settings.placeholder_text.snippetCite
        },
        tokens: yoast_settings.tokens,
        cookie_data_key: yoast_settings.cookie_data_key
      };
      var analyser = new YoastSeo.AnalyserEditNode({}, analyzer_options);

      // Update this.data everytime the field values are modified.
      jQuery(window).on('yoast_seo-form_item-changed', function () {
        analyser.getData();
        analyser.refreshSnippet();
        analyser.refreshAnalysis();
      });

      // Instantiate the FormItem View component plugged on the snippet preview title field.
      var snippetTitle = new YoastSeo.form.SnippetElement({
        el: $('#snippet_title'),
        callbacks: {
          // When the snippet preview title get the focus.
          // Replace the snippet preview title by a component which allows the edition of the title raw value (based on
          // the meta tag title field, including tokens).
          focused: function() {
            // Retrieve the Form Item view behind the meta tag title field.
            var formItem = Drupal.BackboneForm._formItemViews[settings.yoast_seo.fields['meta_title']],
              rawValue = formItem.value();

            // If the raw value is empty, check if a default value has been provided.
            if (rawValue == '' && settings.yoast_seo.default_text['meta_title'] != '') {
              rawValue = settings.yoast_seo.default_text['meta_title'];
            }

            // Display the raw value component instead of the computed value.
            snippetTitle.$el.hide();
            snippetTitleRaw.$el.show();
            snippetTitleRaw.value(rawValue);
            snippetTitleRaw.$el.focus();
          }
        }
      });

      // Add a field to manage the snippet preview title raw value.
      $('<span contenteditable="true" class="title" id="snippet_title_raw" style="display:none"></span>').appendTo('#title_container');

      // Instantiate the FormItem View component plugged on the snippet preview title raw field.
      var snippetTitleRaw = new YoastSeo.form.SnippetElement({
        el: $('#snippet_title_raw'),
        callbacks: {
          // When snippet preview title raw value component change, update the meta tag title value.
          // By updating the meta tag title value, the analyser should perform a new analysis.
          changed: function() {
            var formItem = Drupal.BackboneForm._formItemViews[settings.yoast_seo.fields['meta_title']];
            formItem.value(snippetTitleRaw.value());
            formItem._change();
          },
          // When the component lose the focus, hide it and display the snippet preview title component instead.
          blured: function() {
            snippetTitle.$el.show();
            snippetTitleRaw.$el.hide();
          },
          // When the component get the focus.
          focused: function() {
            snippetTitleRaw.moveCursorEnd();
          }
        }
      });

      // Instantiate the FormItem View component plugged on the snippet preview summary field.
      var snippetSummary = new YoastSeo.form.SnippetElement({
        el: $('#snippet_meta'),
        callbacks: {
          // When the snippet preview summary get the focus.
          // Replace the snippet preview summary by a component which allows the edition of the summary raw value (based on
          // the meta tag description field, including tokens).
          focused: function() {
            // Retrieve the Form Item view behind the meta tag summary field.
            var formItem = Drupal.BackboneForm._formItemViews[settings.yoast_seo.fields['meta_description']],
              rawValue = formItem.value();

            // If the raw value is empty, check if a default value has been provided.
            if (rawValue == '' && settings.yoast_seo.default_text['meta_description'] != '') {
              rawValue = settings.yoast_seo.default_text['meta_description'];
            }

            // Display the raw value component instead of the computed value.
            snippetSummary.$el.hide();
            snippetSummaryRaw.$el.show();
            snippetSummaryRaw.value(rawValue);
            snippetSummaryRaw.$el.focus();
          }
        }
      });

      // Add a field to manage the snippet preview summary raw value.
      $('<span contenteditable="true" class="desc" id="snippet_meta_raw" style="display:none"></span>').appendTo('#meta_container');

      // Instantiate the FormItem View component plugged on the snippet preview summary raw field.
      var snippetSummaryRaw = new YoastSeo.form.SnippetElement({
        el: $('#snippet_meta_raw'),
        callbacks: {
          // When snippet preview summary raw value component change, update the meta tag summary value.
          // By updating the meta tag summary value, the analyser should perform a new analysis.
          changed: function() {
            var formItem = Drupal.BackboneForm._formItemViews[settings.yoast_seo.fields['meta_description']];
            formItem.value(snippetSummaryRaw.value());
            formItem._change();
          },
          // When the component lose the focus, hide it and display the snippet preview summary component instead.
          blured: function() {
            snippetSummary.$el.show();
            snippetSummaryRaw.$el.hide();
          },
          // When the component get the focus.
          focused: function() {
            snippetSummaryRaw.moveCursorEnd();
          }
        }
      });

      // Instantiate the FormItem View component plugged on the snippet preview url field.
      var snippetUrl = new YoastSeo.form.SnippetElement({
        el: $('#snippet_cite'),
        callbacks: {
          // When the snippet preview cite get the focus.
          // Replace the snippet preview cite by a component which allows the edition of the cite raw value (based on
          // the advanced alias field, including tokens).
          focused: function() {
            // Retrieve the Form Item view behind the advanced alias field.
            var formItem = Drupal.BackboneForm._formItemViews[settings.yoast_seo.fields['path']],
              value = formItem.value();
            // If the value is empty, add a default / at the beginning of the field.
            if (value == '') {
              value = '/';
            }
            // Display the raw value component instead of the computed value.
            snippetUrl.$el.hide();
            snippetUrlRaw.$el.show();
            snippetUrlRaw.value(value);
            snippetUrlRaw.$el.focus();
          }
        }
      });

      // Add a field to manage the snippet preview summary raw value.
      $('<span contenteditable="true" class="url" id="snippet_cite_raw" style="display:none"></span>').appendTo('#url_container');

      // Instantiate the FormItem View component plugged on the snippet preview cite raw field.
      var snippetUrlRaw = new YoastSeo.form.SnippetElement({
        el: $('#snippet_cite_raw'),
        callbacks: {
          // When snippet preview url raw value component change, update the advanced alias field value.
          // By updating the advanced alias field value, the analyser should perform a new analysis.
          changed: function() {
            var formItem = Drupal.BackboneForm._formItemViews[settings.yoast_seo.fields['path']];
            formItem.value(snippetUrlRaw.value());
            formItem._change();
          },
          // When the component lose the focus, hide it and display the snippet preview url component instead.
          blured: function() {
            if (snippetUrlRaw.value() == '/') {
              var formItem = Drupal.BackboneForm._formItemViews[settings.yoast_seo.fields['path']];
              formItem.value('');
              formItem._change();
            }
            snippetUrl.$el.show();
            snippetUrlRaw.$el.hide();
          },
          // When the component get the focus.
          focused: function() {
            snippetUrlRaw.moveCursorEnd();
          }
        }
      });

    }
  };

})(jQuery, Drupal);
;
/**
 * @file
 * Attaches behavior for the Filter module.
 */

(function ($, Drupal) {

  'use strict';

  /**
   * Displays the guidelines of the selected text format automatically.
   *
   * @type {Drupal~behavior}
   *
   * @prop {Drupal~behaviorAttach} attach
   *   Attaches behavior for updating filter guidelines.
   */
  Drupal.behaviors.filterGuidelines = {
    attach: function (context) {

      function updateFilterGuidelines(event) {
        var $this = $(event.target);
        var value = $this.val();
        $this.closest('.filter-wrapper')
          .find('.filter-guidelines-item').hide()
          .filter('.filter-guidelines-' + value).show();
      }

      $(context).find('.filter-guidelines').once('filter-guidelines')
        .find(':header').hide()
        .closest('.filter-wrapper').find('select.filter-list')
        .on('change.filterGuidelines', updateFilterGuidelines)
        // Need to trigger the namespaced event to avoid triggering formUpdated
        // when initializing the select.
        .trigger('change.filterGuidelines');
    }
  };

})(jQuery, Drupal);
;
/**
 * @file
 * Provides JavaScript additions to the managed file field type.
 *
 * This file provides progress bar support (if available), popup windows for
 * file previews, and disabling of other file fields during Ajax uploads (which
 * prevents separate file fields from accidentally uploading files).
 */

(function ($, Drupal) {

  'use strict';

  /**
   * Attach behaviors to the file fields passed in the settings.
   *
   * @type {Drupal~behavior}
   *
   * @prop {Drupal~behaviorAttach} attach
   *   Attaches validation for file extensions.
   * @prop {Drupal~behaviorDetach} detach
   *   Detaches validation for file extensions.
   */
  Drupal.behaviors.fileValidateAutoAttach = {
    attach: function (context, settings) {
      var $context = $(context);
      var elements;

      function initFileValidation(selector) {
        $context.find(selector)
          .once('fileValidate')
          .on('change.fileValidate', {extensions: elements[selector]}, Drupal.file.validateExtension);
      }

      if (settings.file && settings.file.elements) {
        elements = settings.file.elements;
        Object.keys(elements).forEach(initFileValidation);
      }
    },
    detach: function (context, settings, trigger) {
      var $context = $(context);
      var elements;

      function removeFileValidation(selector) {
        $context.find(selector)
          .removeOnce('fileValidate')
          .off('change.fileValidate', Drupal.file.validateExtension);
      }

      if (trigger === 'unload' && settings.file && settings.file.elements) {
        elements = settings.file.elements;
        Object.keys(elements).forEach(removeFileValidation);
      }
    }
  };

  /**
   * Attach behaviors to file element auto upload.
   *
   * @type {Drupal~behavior}
   *
   * @prop {Drupal~behaviorAttach} attach
   *   Attaches triggers for the upload button.
   * @prop {Drupal~behaviorDetach} detach
   *   Detaches auto file upload trigger.
   */
  Drupal.behaviors.fileAutoUpload = {
    attach: function (context) {
      $(context).find('input[type="file"]').once('auto-file-upload').on('change.autoFileUpload', Drupal.file.triggerUploadButton);
    },
    detach: function (context, setting, trigger) {
      if (trigger === 'unload') {
        $(context).find('input[type="file"]').removeOnce('auto-file-upload').off('.autoFileUpload');
      }
    }
  };

  /**
   * Attach behaviors to the file upload and remove buttons.
   *
   * @type {Drupal~behavior}
   *
   * @prop {Drupal~behaviorAttach} attach
   *   Attaches form submit events.
   * @prop {Drupal~behaviorDetach} detach
   *   Detaches form submit events.
   */
  Drupal.behaviors.fileButtons = {
    attach: function (context) {
      var $context = $(context);
      $context.find('.js-form-submit').on('mousedown', Drupal.file.disableFields);
      $context.find('.js-form-managed-file .js-form-submit').on('mousedown', Drupal.file.progressBar);
    },
    detach: function (context) {
      var $context = $(context);
      $context.find('.js-form-submit').off('mousedown', Drupal.file.disableFields);
      $context.find('.js-form-managed-file .js-form-submit').off('mousedown', Drupal.file.progressBar);
    }
  };

  /**
   * Attach behaviors to links within managed file elements for preview windows.
   *
   * @type {Drupal~behavior}
   *
   * @prop {Drupal~behaviorAttach} attach
   *   Attaches triggers.
   * @prop {Drupal~behaviorDetach} detach
   *   Detaches triggers.
   */
  Drupal.behaviors.filePreviewLinks = {
    attach: function (context) {
      $(context).find('div.js-form-managed-file .file a').on('click', Drupal.file.openInNewWindow);
    },
    detach: function (context) {
      $(context).find('div.js-form-managed-file .file a').off('click', Drupal.file.openInNewWindow);
    }
  };

  /**
   * File upload utility functions.
   *
   * @namespace
   */
  Drupal.file = Drupal.file || {

    /**
     * Client-side file input validation of file extensions.
     *
     * @name Drupal.file.validateExtension
     *
     * @param {jQuery.Event} event
     *   The event triggered. For example `change.fileValidate`.
     */
    validateExtension: function (event) {
      event.preventDefault();
      // Remove any previous errors.
      $('.file-upload-js-error').remove();

      // Add client side validation for the input[type=file].
      var extensionPattern = event.data.extensions.replace(/,\s*/g, '|');
      if (extensionPattern.length > 1 && this.value.length > 0) {
        var acceptableMatch = new RegExp('\\.(' + extensionPattern + ')$', 'gi');
        if (!acceptableMatch.test(this.value)) {
          var error = Drupal.t('The selected file %filename cannot be uploaded. Only files with the following extensions are allowed: %extensions.', {
            // According to the specifications of HTML5, a file upload control
            // should not reveal the real local path to the file that a user
            // has selected. Some web browsers implement this restriction by
            // replacing the local path with "C:\fakepath\", which can cause
            // confusion by leaving the user thinking perhaps Drupal could not
            // find the file because it messed up the file path. To avoid this
            // confusion, therefore, we strip out the bogus fakepath string.
            '%filename': this.value.replace('C:\\fakepath\\', ''),
            '%extensions': extensionPattern.replace(/\|/g, ', ')
          });
          $(this).closest('div.js-form-managed-file').prepend('<div class="messages messages--error file-upload-js-error" aria-live="polite">' + error + '</div>');
          this.value = '';
          // Cancel all other change event handlers.
          event.stopImmediatePropagation();
        }
      }
    },

    /**
     * Trigger the upload_button mouse event to auto-upload as a managed file.
     *
     * @name Drupal.file.triggerUploadButton
     *
     * @param {jQuery.Event} event
     *   The event triggered. For example `change.autoFileUpload`.
     */
    triggerUploadButton: function (event) {
      $(event.target).closest('.js-form-managed-file').find('.js-form-submit').trigger('mousedown');
    },

    /**
     * Prevent file uploads when using buttons not intended to upload.
     *
     * @name Drupal.file.disableFields
     *
     * @param {jQuery.Event} event
     *   The event triggered, most likely a `mousedown` event.
     */
    disableFields: function (event) {
      var $clickedButton = $(this).findOnce('ajax');

      // Only disable upload fields for Ajax buttons.
      if (!$clickedButton.length) {
        return;
      }

      // Check if we're working with an "Upload" button.
      var $enabledFields = [];
      if ($clickedButton.closest('div.js-form-managed-file').length > 0) {
        $enabledFields = $clickedButton.closest('div.js-form-managed-file').find('input.js-form-file');
      }

      // Temporarily disable upload fields other than the one we're currently
      // working with. Filter out fields that are already disabled so that they
      // do not get enabled when we re-enable these fields at the end of
      // behavior processing. Re-enable in a setTimeout set to a relatively
      // short amount of time (1 second). All the other mousedown handlers
      // (like Drupal's Ajax behaviors) are executed before any timeout
      // functions are called, so we don't have to worry about the fields being
      // re-enabled too soon. @todo If the previous sentence is true, why not
      // set the timeout to 0?
      var $fieldsToTemporarilyDisable = $('div.js-form-managed-file input.js-form-file').not($enabledFields).not(':disabled');
      $fieldsToTemporarilyDisable.prop('disabled', true);
      setTimeout(function () {
        $fieldsToTemporarilyDisable.prop('disabled', false);
      }, 1000);
    },

    /**
     * Add progress bar support if possible.
     *
     * @name Drupal.file.progressBar
     *
     * @param {jQuery.Event} event
     *   The event triggered, most likely a `mousedown` event.
     */
    progressBar: function (event) {
      var $clickedButton = $(this);
      var $progressId = $clickedButton.closest('div.js-form-managed-file').find('input.file-progress');
      if ($progressId.length) {
        var originalName = $progressId.attr('name');

        // Replace the name with the required identifier.
        $progressId.attr('name', originalName.match(/APC_UPLOAD_PROGRESS|UPLOAD_IDENTIFIER/)[0]);

        // Restore the original name after the upload begins.
        setTimeout(function () {
          $progressId.attr('name', originalName);
        }, 1000);
      }
      // Show the progress bar if the upload takes longer than half a second.
      setTimeout(function () {
        $clickedButton.closest('div.js-form-managed-file').find('div.ajax-progress-bar').slideDown();
      }, 500);
    },

    /**
     * Open links to files within forms in a new window.
     *
     * @name Drupal.file.openInNewWindow
     *
     * @param {jQuery.Event} event
     *   The event triggered, most likely a `click` event.
     */
    openInNewWindow: function (event) {
      event.preventDefault();
      $(this).attr('target', '_blank');
      window.open(this.href, 'filePreview', 'toolbar=0,scrollbars=1,location=1,statusbar=1,menubar=0,resizable=1,width=500,height=550');
    }
  };

})(jQuery, Drupal);
;
/*!
 * jQuery Form Plugin
 * version: 3.51.0-2014.06.20
 * Requires jQuery v1.5 or later
 * Copyright (c) 2014 M. Alsup
 * Examples and documentation at: http://malsup.com/jquery/form/
 * Project repository: https://github.com/malsup/form
 * Dual licensed under the MIT and GPL licenses.
 * https://github.com/malsup/form#copyright-and-license
 */
!function(e){"use strict";"function"==typeof define&&define.amd?define(["jquery"],e):e("undefined"!=typeof jQuery?jQuery:window.Zepto)}(function(e){"use strict";function t(t){var r=t.data;t.isDefaultPrevented()||(t.preventDefault(),e(t.target).ajaxSubmit(r))}function r(t){var r=t.target,a=e(r);if(!a.is("[type=submit],[type=image]")){var n=a.closest("[type=submit]");if(0===n.length)return;r=n[0]}var i=this;if(i.clk=r,"image"==r.type)if(void 0!==t.offsetX)i.clk_x=t.offsetX,i.clk_y=t.offsetY;else if("function"==typeof e.fn.offset){var o=a.offset();i.clk_x=t.pageX-o.left,i.clk_y=t.pageY-o.top}else i.clk_x=t.pageX-r.offsetLeft,i.clk_y=t.pageY-r.offsetTop;setTimeout(function(){i.clk=i.clk_x=i.clk_y=null},100)}function a(){if(e.fn.ajaxSubmit.debug){var t="[jquery.form] "+Array.prototype.join.call(arguments,"");window.console&&window.console.log?window.console.log(t):window.opera&&window.opera.postError&&window.opera.postError(t)}}var n={};n.fileapi=void 0!==e("<input type='file'/>").get(0).files,n.formdata=void 0!==window.FormData;var i=!!e.fn.prop;e.fn.attr2=function(){if(!i)return this.attr.apply(this,arguments);var e=this.prop.apply(this,arguments);return e&&e.jquery||"string"==typeof e?e:this.attr.apply(this,arguments)},e.fn.ajaxSubmit=function(t){function r(r){var a,n,i=e.param(r,t.traditional).split("&"),o=i.length,s=[];for(a=0;o>a;a++)i[a]=i[a].replace(/\+/g," "),n=i[a].split("="),s.push([decodeURIComponent(n[0]),decodeURIComponent(n[1])]);return s}function o(a){for(var n=new FormData,i=0;i<a.length;i++)n.append(a[i].name,a[i].value);if(t.extraData){var o=r(t.extraData);for(i=0;i<o.length;i++)o[i]&&n.append(o[i][0],o[i][1])}t.data=null;var s=e.extend(!0,{},e.ajaxSettings,t,{contentType:!1,processData:!1,cache:!1,type:u||"POST"});t.uploadProgress&&(s.xhr=function(){var r=e.ajaxSettings.xhr();return r.upload&&r.upload.addEventListener("progress",function(e){var r=0,a=e.loaded||e.position,n=e.total;e.lengthComputable&&(r=Math.ceil(a/n*100)),t.uploadProgress(e,a,n,r)},!1),r}),s.data=null;var c=s.beforeSend;return s.beforeSend=function(e,r){r.data=t.formData?t.formData:n,c&&c.call(this,e,r)},e.ajax(s)}function s(r){function n(e){var t=null;try{e.contentWindow&&(t=e.contentWindow.document)}catch(r){a("cannot get iframe.contentWindow document: "+r)}if(t)return t;try{t=e.contentDocument?e.contentDocument:e.document}catch(r){a("cannot get iframe.contentDocument: "+r),t=e.document}return t}function o(){function t(){try{var e=n(g).readyState;a("state = "+e),e&&"uninitialized"==e.toLowerCase()&&setTimeout(t,50)}catch(r){a("Server abort: ",r," (",r.name,")"),s(k),j&&clearTimeout(j),j=void 0}}var r=f.attr2("target"),i=f.attr2("action"),o="multipart/form-data",c=f.attr("enctype")||f.attr("encoding")||o;w.setAttribute("target",p),(!u||/post/i.test(u))&&w.setAttribute("method","POST"),i!=m.url&&w.setAttribute("action",m.url),m.skipEncodingOverride||u&&!/post/i.test(u)||f.attr({encoding:"multipart/form-data",enctype:"multipart/form-data"}),m.timeout&&(j=setTimeout(function(){T=!0,s(D)},m.timeout));var l=[];try{if(m.extraData)for(var d in m.extraData)m.extraData.hasOwnProperty(d)&&l.push(e.isPlainObject(m.extraData[d])&&m.extraData[d].hasOwnProperty("name")&&m.extraData[d].hasOwnProperty("value")?e('<input type="hidden" name="'+m.extraData[d].name+'">').val(m.extraData[d].value).appendTo(w)[0]:e('<input type="hidden" name="'+d+'">').val(m.extraData[d]).appendTo(w)[0]);m.iframeTarget||v.appendTo("body"),g.attachEvent?g.attachEvent("onload",s):g.addEventListener("load",s,!1),setTimeout(t,15);try{w.submit()}catch(h){var x=document.createElement("form").submit;x.apply(w)}}finally{w.setAttribute("action",i),w.setAttribute("enctype",c),r?w.setAttribute("target",r):f.removeAttr("target"),e(l).remove()}}function s(t){if(!x.aborted&&!F){if(M=n(g),M||(a("cannot access response document"),t=k),t===D&&x)return x.abort("timeout"),void S.reject(x,"timeout");if(t==k&&x)return x.abort("server abort"),void S.reject(x,"error","server abort");if(M&&M.location.href!=m.iframeSrc||T){g.detachEvent?g.detachEvent("onload",s):g.removeEventListener("load",s,!1);var r,i="success";try{if(T)throw"timeout";var o="xml"==m.dataType||M.XMLDocument||e.isXMLDoc(M);if(a("isXml="+o),!o&&window.opera&&(null===M.body||!M.body.innerHTML)&&--O)return a("requeing onLoad callback, DOM not available"),void setTimeout(s,250);var u=M.body?M.body:M.documentElement;x.responseText=u?u.innerHTML:null,x.responseXML=M.XMLDocument?M.XMLDocument:M,o&&(m.dataType="xml"),x.getResponseHeader=function(e){var t={"content-type":m.dataType};return t[e.toLowerCase()]},u&&(x.status=Number(u.getAttribute("status"))||x.status,x.statusText=u.getAttribute("statusText")||x.statusText);var c=(m.dataType||"").toLowerCase(),l=/(json|script|text)/.test(c);if(l||m.textarea){var f=M.getElementsByTagName("textarea")[0];if(f)x.responseText=f.value,x.status=Number(f.getAttribute("status"))||x.status,x.statusText=f.getAttribute("statusText")||x.statusText;else if(l){var p=M.getElementsByTagName("pre")[0],h=M.getElementsByTagName("body")[0];p?x.responseText=p.textContent?p.textContent:p.innerText:h&&(x.responseText=h.textContent?h.textContent:h.innerText)}}else"xml"==c&&!x.responseXML&&x.responseText&&(x.responseXML=X(x.responseText));try{E=_(x,c,m)}catch(y){i="parsererror",x.error=r=y||i}}catch(y){a("error caught: ",y),i="error",x.error=r=y||i}x.aborted&&(a("upload aborted"),i=null),x.status&&(i=x.status>=200&&x.status<300||304===x.status?"success":"error"),"success"===i?(m.success&&m.success.call(m.context,E,"success",x),S.resolve(x.responseText,"success",x),d&&e.event.trigger("ajaxSuccess",[x,m])):i&&(void 0===r&&(r=x.statusText),m.error&&m.error.call(m.context,x,i,r),S.reject(x,"error",r),d&&e.event.trigger("ajaxError",[x,m,r])),d&&e.event.trigger("ajaxComplete",[x,m]),d&&!--e.active&&e.event.trigger("ajaxStop"),m.complete&&m.complete.call(m.context,x,i),F=!0,m.timeout&&clearTimeout(j),setTimeout(function(){m.iframeTarget?v.attr("src",m.iframeSrc):v.remove(),x.responseXML=null},100)}}}var c,l,m,d,p,v,g,x,y,b,T,j,w=f[0],S=e.Deferred();if(S.abort=function(e){x.abort(e)},r)for(l=0;l<h.length;l++)c=e(h[l]),i?c.prop("disabled",!1):c.removeAttr("disabled");if(m=e.extend(!0,{},e.ajaxSettings,t),m.context=m.context||m,p="jqFormIO"+(new Date).getTime(),m.iframeTarget?(v=e(m.iframeTarget),b=v.attr2("name"),b?p=b:v.attr2("name",p)):(v=e('<iframe name="'+p+'" src="'+m.iframeSrc+'" />'),v.css({position:"absolute",top:"-1000px",left:"-1000px"})),g=v[0],x={aborted:0,responseText:null,responseXML:null,status:0,statusText:"n/a",getAllResponseHeaders:function(){},getResponseHeader:function(){},setRequestHeader:function(){},abort:function(t){var r="timeout"===t?"timeout":"aborted";a("aborting upload... "+r),this.aborted=1;try{g.contentWindow.document.execCommand&&g.contentWindow.document.execCommand("Stop")}catch(n){}v.attr("src",m.iframeSrc),x.error=r,m.error&&m.error.call(m.context,x,r,t),d&&e.event.trigger("ajaxError",[x,m,r]),m.complete&&m.complete.call(m.context,x,r)}},d=m.global,d&&0===e.active++&&e.event.trigger("ajaxStart"),d&&e.event.trigger("ajaxSend",[x,m]),m.beforeSend&&m.beforeSend.call(m.context,x,m)===!1)return m.global&&e.active--,S.reject(),S;if(x.aborted)return S.reject(),S;y=w.clk,y&&(b=y.name,b&&!y.disabled&&(m.extraData=m.extraData||{},m.extraData[b]=y.value,"image"==y.type&&(m.extraData[b+".x"]=w.clk_x,m.extraData[b+".y"]=w.clk_y)));var D=1,k=2,A=e("meta[name=csrf-token]").attr("content"),L=e("meta[name=csrf-param]").attr("content");L&&A&&(m.extraData=m.extraData||{},m.extraData[L]=A),m.forceSync?o():setTimeout(o,10);var E,M,F,O=50,X=e.parseXML||function(e,t){return window.ActiveXObject?(t=new ActiveXObject("Microsoft.XMLDOM"),t.async="false",t.loadXML(e)):t=(new DOMParser).parseFromString(e,"text/xml"),t&&t.documentElement&&"parsererror"!=t.documentElement.nodeName?t:null},C=e.parseJSON||function(e){return window.eval("("+e+")")},_=function(t,r,a){var n=t.getResponseHeader("content-type")||"",i="xml"===r||!r&&n.indexOf("xml")>=0,o=i?t.responseXML:t.responseText;return i&&"parsererror"===o.documentElement.nodeName&&e.error&&e.error("parsererror"),a&&a.dataFilter&&(o=a.dataFilter(o,r)),"string"==typeof o&&("json"===r||!r&&n.indexOf("json")>=0?o=C(o):("script"===r||!r&&n.indexOf("javascript")>=0)&&e.globalEval(o)),o};return S}if(!this.length)return a("ajaxSubmit: skipping submit process - no element selected"),this;var u,c,l,f=this;"function"==typeof t?t={success:t}:void 0===t&&(t={}),u=t.type||this.attr2("method"),c=t.url||this.attr2("action"),l="string"==typeof c?e.trim(c):"",l=l||window.location.href||"",l&&(l=(l.match(/^([^#]+)/)||[])[1]),t=e.extend(!0,{url:l,success:e.ajaxSettings.success,type:u||e.ajaxSettings.type,iframeSrc:/^https/i.test(window.location.href||"")?"javascript:false":"about:blank"},t);var m={};if(this.trigger("form-pre-serialize",[this,t,m]),m.veto)return a("ajaxSubmit: submit vetoed via form-pre-serialize trigger"),this;if(t.beforeSerialize&&t.beforeSerialize(this,t)===!1)return a("ajaxSubmit: submit aborted via beforeSerialize callback"),this;var d=t.traditional;void 0===d&&(d=e.ajaxSettings.traditional);var p,h=[],v=this.formToArray(t.semantic,h);if(t.data&&(t.extraData=t.data,p=e.param(t.data,d)),t.beforeSubmit&&t.beforeSubmit(v,this,t)===!1)return a("ajaxSubmit: submit aborted via beforeSubmit callback"),this;if(this.trigger("form-submit-validate",[v,this,t,m]),m.veto)return a("ajaxSubmit: submit vetoed via form-submit-validate trigger"),this;var g=e.param(v,d);p&&(g=g?g+"&"+p:p),"GET"==t.type.toUpperCase()?(t.url+=(t.url.indexOf("?")>=0?"&":"?")+g,t.data=null):t.data=g;var x=[];if(t.resetForm&&x.push(function(){f.resetForm()}),t.clearForm&&x.push(function(){f.clearForm(t.includeHidden)}),!t.dataType&&t.target){var y=t.success||function(){};x.push(function(r){var a=t.replaceTarget?"replaceWith":"html";e(t.target)[a](r).each(y,arguments)})}else t.success&&x.push(t.success);if(t.success=function(e,r,a){for(var n=t.context||this,i=0,o=x.length;o>i;i++)x[i].apply(n,[e,r,a||f,f])},t.error){var b=t.error;t.error=function(e,r,a){var n=t.context||this;b.apply(n,[e,r,a,f])}}if(t.complete){var T=t.complete;t.complete=function(e,r){var a=t.context||this;T.apply(a,[e,r,f])}}var j=e("input[type=file]:enabled",this).filter(function(){return""!==e(this).val()}),w=j.length>0,S="multipart/form-data",D=f.attr("enctype")==S||f.attr("encoding")==S,k=n.fileapi&&n.formdata;a("fileAPI :"+k);var A,L=(w||D)&&!k;t.iframe!==!1&&(t.iframe||L)?t.closeKeepAlive?e.get(t.closeKeepAlive,function(){A=s(v)}):A=s(v):A=(w||D)&&k?o(v):e.ajax(t),f.removeData("jqxhr").data("jqxhr",A);for(var E=0;E<h.length;E++)h[E]=null;return this.trigger("form-submit-notify",[this,t]),this},e.fn.ajaxForm=function(n){if(n=n||{},n.delegation=n.delegation&&e.isFunction(e.fn.on),!n.delegation&&0===this.length){var i={s:this.selector,c:this.context};return!e.isReady&&i.s?(a("DOM not ready, queuing ajaxForm"),e(function(){e(i.s,i.c).ajaxForm(n)}),this):(a("terminating; zero elements found by selector"+(e.isReady?"":" (DOM not ready)")),this)}return n.delegation?(e(document).off("submit.form-plugin",this.selector,t).off("click.form-plugin",this.selector,r).on("submit.form-plugin",this.selector,n,t).on("click.form-plugin",this.selector,n,r),this):this.ajaxFormUnbind().bind("submit.form-plugin",n,t).bind("click.form-plugin",n,r)},e.fn.ajaxFormUnbind=function(){return this.unbind("submit.form-plugin click.form-plugin")},e.fn.formToArray=function(t,r){var a=[];if(0===this.length)return a;var i,o=this[0],s=this.attr("id"),u=t?o.getElementsByTagName("*"):o.elements;if(u&&!/MSIE [678]/.test(navigator.userAgent)&&(u=e(u).get()),s&&(i=e(':input[form="'+s+'"]').get(),i.length&&(u=(u||[]).concat(i))),!u||!u.length)return a;var c,l,f,m,d,p,h;for(c=0,p=u.length;p>c;c++)if(d=u[c],f=d.name,f&&!d.disabled)if(t&&o.clk&&"image"==d.type)o.clk==d&&(a.push({name:f,value:e(d).val(),type:d.type}),a.push({name:f+".x",value:o.clk_x},{name:f+".y",value:o.clk_y}));else if(m=e.fieldValue(d,!0),m&&m.constructor==Array)for(r&&r.push(d),l=0,h=m.length;h>l;l++)a.push({name:f,value:m[l]});else if(n.fileapi&&"file"==d.type){r&&r.push(d);var v=d.files;if(v.length)for(l=0;l<v.length;l++)a.push({name:f,value:v[l],type:d.type});else a.push({name:f,value:"",type:d.type})}else null!==m&&"undefined"!=typeof m&&(r&&r.push(d),a.push({name:f,value:m,type:d.type,required:d.required}));if(!t&&o.clk){var g=e(o.clk),x=g[0];f=x.name,f&&!x.disabled&&"image"==x.type&&(a.push({name:f,value:g.val()}),a.push({name:f+".x",value:o.clk_x},{name:f+".y",value:o.clk_y}))}return a},e.fn.formSerialize=function(t){return e.param(this.formToArray(t))},e.fn.fieldSerialize=function(t){var r=[];return this.each(function(){var a=this.name;if(a){var n=e.fieldValue(this,t);if(n&&n.constructor==Array)for(var i=0,o=n.length;o>i;i++)r.push({name:a,value:n[i]});else null!==n&&"undefined"!=typeof n&&r.push({name:this.name,value:n})}}),e.param(r)},e.fn.fieldValue=function(t){for(var r=[],a=0,n=this.length;n>a;a++){var i=this[a],o=e.fieldValue(i,t);null===o||"undefined"==typeof o||o.constructor==Array&&!o.length||(o.constructor==Array?e.merge(r,o):r.push(o))}return r},e.fieldValue=function(t,r){var a=t.name,n=t.type,i=t.tagName.toLowerCase();if(void 0===r&&(r=!0),r&&(!a||t.disabled||"reset"==n||"button"==n||("checkbox"==n||"radio"==n)&&!t.checked||("submit"==n||"image"==n)&&t.form&&t.form.clk!=t||"select"==i&&-1==t.selectedIndex))return null;if("select"==i){var o=t.selectedIndex;if(0>o)return null;for(var s=[],u=t.options,c="select-one"==n,l=c?o+1:u.length,f=c?o:0;l>f;f++){var m=u[f];if(m.selected){var d=m.value;if(d||(d=m.attributes&&m.attributes.value&&!m.attributes.value.specified?m.text:m.value),c)return d;s.push(d)}}return s}return e(t).val()},e.fn.clearForm=function(t){return this.each(function(){e("input,select,textarea",this).clearFields(t)})},e.fn.clearFields=e.fn.clearInputs=function(t){var r=/^(?:color|date|datetime|email|month|number|password|range|search|tel|text|time|url|week)$/i;return this.each(function(){var a=this.type,n=this.tagName.toLowerCase();r.test(a)||"textarea"==n?this.value="":"checkbox"==a||"radio"==a?this.checked=!1:"select"==n?this.selectedIndex=-1:"file"==a?/MSIE/.test(navigator.userAgent)?e(this).replaceWith(e(this).clone(!0)):e(this).val(""):t&&(t===!0&&/hidden/.test(a)||"string"==typeof t&&e(this).is(t))&&(this.value="")})},e.fn.resetForm=function(){return this.each(function(){("function"==typeof this.reset||"object"==typeof this.reset&&!this.reset.nodeType)&&this.reset()})},e.fn.enable=function(e){return void 0===e&&(e=!0),this.each(function(){this.disabled=!e})},e.fn.selected=function(t){return void 0===t&&(t=!0),this.each(function(){var r=this.type;if("checkbox"==r||"radio"==r)this.checked=t;else if("option"==this.tagName.toLowerCase()){var a=e(this).parent("select");t&&a[0]&&"select-one"==a[0].type&&a.find("option").selected(!1),this.selected=t}})},e.fn.ajaxSubmit.debug=!1});
;
(function(){if(window.matchMedia&&window.matchMedia("all").addListener){return false}var e=window.matchMedia,i=e("only all").matches,n=false,t=0,a=[],r=function(i){clearTimeout(t);t=setTimeout(function(){for(var i=0,n=a.length;i<n;i++){var t=a[i].mql,r=a[i].listeners||[],o=e(t.media).matches;if(o!==t.matches){t.matches=o;for(var s=0,l=r.length;s<l;s++){r[s].call(window,t)}}}},30)};window.matchMedia=function(t){var o=e(t),s=[],l=0;o.addListener=function(e){if(!i){return}if(!n){n=true;window.addEventListener("resize",r,true)}if(l===0){l=a.push({mql:o,listeners:s})}s.push(e)};o.removeListener=function(e){for(var i=0,n=s.length;i<n;i++){if(s[i]===e){s.splice(i,1)}}};return o}})();
;
/**
 * @file
 * Builds a nested accordion widget.
 *
 * Invoke on an HTML list element with the jQuery plugin pattern.
 *
 * @example
 * $('.toolbar-menu').drupalToolbarMenu();
 */

(function ($, Drupal, drupalSettings) {

  'use strict';

  /**
   * Store the open menu tray.
   */
  var activeItem = Drupal.url(drupalSettings.path.currentPath);

  $.fn.drupalToolbarMenu = function () {

    var ui = {
      handleOpen: Drupal.t('Extend'),
      handleClose: Drupal.t('Collapse')
    };

    /**
     * Handle clicks from the disclosure button on an item with sub-items.
     *
     * @param {Object} event
     *   A jQuery Event object.
     */
    function toggleClickHandler(event) {
      var $toggle = $(event.target);
      var $item = $toggle.closest('li');
      // Toggle the list item.
      toggleList($item);
      // Close open sibling menus.
      var $openItems = $item.siblings().filter('.open');
      toggleList($openItems, false);
    }

    /**
     * Handle clicks from a menu item link.
     *
     * @param {Object} event
     *   A jQuery Event object.
     */
    function linkClickHandler(event) {
      // If the toolbar is positioned fixed (and therefore hiding content
      // underneath), then users expect clicks in the administration menu tray
      // to take them to that destination but for the menu tray to be closed
      // after clicking: otherwise the toolbar itself is obstructing the view
      // of the destination they chose.
      if (!Drupal.toolbar.models.toolbarModel.get('isFixed')) {
        Drupal.toolbar.models.toolbarModel.set('activeTab', null);
      }
      // Stopping propagation to make sure that once a toolbar-box is clicked
      // (the whitespace part), the page is not redirected anymore.
      event.stopPropagation();
    }

    /**
     * Toggle the open/close state of a list is a menu.
     *
     * @param {jQuery} $item
     *   The li item to be toggled.
     *
     * @param {Boolean} switcher
     *   A flag that forces toggleClass to add or a remove a class, rather than
     *   simply toggling its presence.
     */
    function toggleList($item, switcher) {
      var $toggle = $item.children('.toolbar-box').children('.toolbar-handle');
      switcher = (typeof switcher !== 'undefined') ? switcher : !$item.hasClass('open');
      // Toggle the item open state.
      $item.toggleClass('open', switcher);
      // Twist the toggle.
      $toggle.toggleClass('open', switcher);
      // Adjust the toggle text.
      $toggle
        .find('.action')
        // Expand Structure, Collapse Structure.
        .text((switcher) ? ui.handleClose : ui.handleOpen);
    }

    /**
     * Add markup to the menu elements.
     *
     * Items with sub-elements have a list toggle attached to them. Menu item
     * links and the corresponding list toggle are wrapped with in a div
     * classed with .toolbar-box. The .toolbar-box div provides a positioning
     * context for the item list toggle.
     *
     * @param {jQuery} $menu
     *   The root of the menu to be initialized.
     */
    function initItems($menu) {
      var options = {
        class: 'toolbar-icon toolbar-handle',
        action: ui.handleOpen,
        text: ''
      };
      // Initialize items and their links.
      $menu.find('li > a').wrap('<div class="toolbar-box">');
      // Add a handle to each list item if it has a menu.
      $menu.find('li').each(function (index, element) {
        var $item = $(element);
        if ($item.children('ul.toolbar-menu').length) {
          var $box = $item.children('.toolbar-box');
          options.text = Drupal.t('@label', {'@label': $box.find('a').text()});
          $item.children('.toolbar-box')
            .append(Drupal.theme('toolbarMenuItemToggle', options));
        }
      });
    }

    /**
     * Adds a level class to each list based on its depth in the menu.
     *
     * This function is called recursively on each sub level of lists elements
     * until the depth of the menu is exhausted.
     *
     * @param {jQuery} $lists
     *   A jQuery object of ul elements.
     *
     * @param {number} level
     *   The current level number to be assigned to the list elements.
     */
    function markListLevels($lists, level) {
      level = (!level) ? 1 : level;
      var $lis = $lists.children('li').addClass('level-' + level);
      $lists = $lis.children('ul');
      if ($lists.length) {
        markListLevels($lists, level + 1);
      }
    }

    /**
     * On page load, open the active menu item.
     *
     * Marks the trail of the active link in the menu back to the root of the
     * menu with .menu-item--active-trail.
     *
     * @param {jQuery} $menu
     *   The root of the menu.
     */
    function openActiveItem($menu) {
      var pathItem = $menu.find('a[href="' + location.pathname + '"]');
      if (pathItem.length && !activeItem) {
        activeItem = location.pathname;
      }
      if (activeItem) {
        var $activeItem = $menu.find('a[href="' + activeItem + '"]').addClass('menu-item--active');
        var $activeTrail = $activeItem.parentsUntil('.root', 'li').addClass('menu-item--active-trail');
        toggleList($activeTrail, true);
      }
    }

    // Return the jQuery object.
    return this.each(function (selector) {
      var $menu = $(this).once('toolbar-menu');
      if ($menu.length) {
        // Bind event handlers.
        $menu
          .on('click.toolbar', '.toolbar-box', toggleClickHandler)
          .on('click.toolbar', '.toolbar-box a', linkClickHandler);

        $menu.addClass('root');
        initItems($menu);
        markListLevels($menu);
        // Restore previous and active states.
        openActiveItem($menu);
      }
    });
  };

  /**
   * A toggle is an interactive element often bound to a click handler.
   *
   * @param {object} options
   *   Options for the button.
   * @param {string} options.class
   *   Class to set on the button.
   * @param {string} options.action
   *   Action for the button.
   * @param {string} options.text
   *   Used as label for the button.
   *
   * @return {string}
   *   A string representing a DOM fragment.
   */
  Drupal.theme.toolbarMenuItemToggle = function (options) {
    return '<button class="' + options['class'] + '"><span class="action">' + options.action + '</span><span class="label">' + options.text + '</span></button>';
  };

}(jQuery, Drupal, drupalSettings));
;
/**
 * @file
 * Defines the behavior of the Drupal administration toolbar.
 */

(function ($, Drupal, drupalSettings) {

  'use strict';

  // Merge run-time settings with the defaults.
  var options = $.extend(
    {
      breakpoints: {
        'toolbar.narrow': '',
        'toolbar.standard': '',
        'toolbar.wide': ''
      }
    },
    drupalSettings.toolbar,
    // Merge strings on top of drupalSettings so that they are not mutable.
    {
      strings: {
        horizontal: Drupal.t('Horizontal orientation'),
        vertical: Drupal.t('Vertical orientation')
      }
    }
  );

  /**
   * Registers tabs with the toolbar.
   *
   * The Drupal toolbar allows modules to register top-level tabs. These may
   * point directly to a resource or toggle the visibility of a tray.
   *
   * Modules register tabs with hook_toolbar().
   *
   * @type {Drupal~behavior}
   *
   * @prop {Drupal~behaviorAttach} attach
   *   Attaches the toolbar rendering functionality to the toolbar element.
   */
  Drupal.behaviors.toolbar = {
    attach: function (context) {
      // Verify that the user agent understands media queries. Complex admin
      // toolbar layouts require media query support.
      if (!window.matchMedia('only screen').matches) {
        return;
      }
      // Process the administrative toolbar.
      $(context).find('#toolbar-administration').once('toolbar').each(function () {

        // Establish the toolbar models and views.
        var model = Drupal.toolbar.models.toolbarModel = new Drupal.toolbar.ToolbarModel({
          locked: JSON.parse(localStorage.getItem('Drupal.toolbar.trayVerticalLocked')) || false,
          activeTab: document.getElementById(JSON.parse(localStorage.getItem('Drupal.toolbar.activeTabID')))
        });
        Drupal.toolbar.views.toolbarVisualView = new Drupal.toolbar.ToolbarVisualView({
          el: this,
          model: model,
          strings: options.strings
        });
        Drupal.toolbar.views.toolbarAuralView = new Drupal.toolbar.ToolbarAuralView({
          el: this,
          model: model,
          strings: options.strings
        });
        Drupal.toolbar.views.bodyVisualView = new Drupal.toolbar.BodyVisualView({
          el: this,
          model: model
        });

        // Render collapsible menus.
        var menuModel = Drupal.toolbar.models.menuModel = new Drupal.toolbar.MenuModel();
        Drupal.toolbar.views.menuVisualView = new Drupal.toolbar.MenuVisualView({
          el: $(this).find('.toolbar-menu-administration').get(0),
          model: menuModel,
          strings: options.strings
        });

        // Handle the resolution of Drupal.toolbar.setSubtrees.
        // This is handled with a deferred so that the function may be invoked
        // asynchronously.
        Drupal.toolbar.setSubtrees.done(function (subtrees) {
          menuModel.set('subtrees', subtrees);
          var theme = drupalSettings.ajaxPageState.theme;
          localStorage.setItem('Drupal.toolbar.subtrees.' + theme, JSON.stringify(subtrees));
          // Indicate on the toolbarModel that subtrees are now loaded.
          model.set('areSubtreesLoaded', true);
        });

        // Attach a listener to the configured media query breakpoints.
        for (var label in options.breakpoints) {
          if (options.breakpoints.hasOwnProperty(label)) {
            var mq = options.breakpoints[label];
            var mql = Drupal.toolbar.mql[label] = window.matchMedia(mq);
            // Curry the model and the label of the media query breakpoint to
            // the mediaQueryChangeHandler function.
            mql.addListener(Drupal.toolbar.mediaQueryChangeHandler.bind(null, model, label));
            // Fire the mediaQueryChangeHandler for each configured breakpoint
            // so that they process once.
            Drupal.toolbar.mediaQueryChangeHandler.call(null, model, label, mql);
          }
        }

        // Trigger an initial attempt to load menu subitems. This first attempt
        // is made after the media query handlers have had an opportunity to
        // process. The toolbar starts in the vertical orientation by default,
        // unless the viewport is wide enough to accommodate a horizontal
        // orientation. Thus we give the Toolbar a chance to determine if it
        // should be set to horizontal orientation before attempting to load
        // menu subtrees.
        Drupal.toolbar.views.toolbarVisualView.loadSubtrees();

        $(document)
          // Update the model when the viewport offset changes.
          .on('drupalViewportOffsetChange.toolbar', function (event, offsets) {
            model.set('offsets', offsets);
          });

        // Broadcast model changes to other modules.
        model
          .on('change:orientation', function (model, orientation) {
            $(document).trigger('drupalToolbarOrientationChange', orientation);
          })
          .on('change:activeTab', function (model, tab) {
            $(document).trigger('drupalToolbarTabChange', tab);
          })
          .on('change:activeTray', function (model, tray) {
            $(document).trigger('drupalToolbarTrayChange', tray);
          });

        // If the toolbar's orientation is horizontal and no active tab is
        // defined then show the tray of the first toolbar tab by default (but
        // not the first 'Home' toolbar tab).
        if (Drupal.toolbar.models.toolbarModel.get('orientation') === 'horizontal' && Drupal.toolbar.models.toolbarModel.get('activeTab') === null) {
          Drupal.toolbar.models.toolbarModel.set({
            activeTab: $('.toolbar-bar .toolbar-tab:not(.home-toolbar-tab) a').get(0)
          });
        }
      });
    }
  };

  /**
   * Toolbar methods of Backbone objects.
   *
   * @namespace
   */
  Drupal.toolbar = {

    /**
     * A hash of View instances.
     *
     * @type {object.<string, Backbone.View>}
     */
    views: {},

    /**
     * A hash of Model instances.
     *
     * @type {object.<string, Backbone.Model>}
     */
    models: {},

    /**
     * A hash of MediaQueryList objects tracked by the toolbar.
     *
     * @type {object.<string, object>}
     */
    mql: {},

    /**
     * Accepts a list of subtree menu elements.
     *
     * A deferred object that is resolved by an inlined JavaScript callback.
     *
     * @type {jQuery.Deferred}
     *
     * @see toolbar_subtrees_jsonp().
     */
    setSubtrees: new $.Deferred(),

    /**
     * Respond to configured narrow media query changes.
     *
     * @param {Drupal.toolbar.ToolbarModel} model
     *   A toolbar model
     * @param {string} label
     *   Media query label.
     * @param {object} mql
     *   A MediaQueryList object.
     */
    mediaQueryChangeHandler: function (model, label, mql) {
      switch (label) {
        case 'toolbar.narrow':
          model.set({
            isOriented: mql.matches,
            isTrayToggleVisible: false
          });
          // If the toolbar doesn't have an explicit orientation yet, or if the
          // narrow media query doesn't match then set the orientation to
          // vertical.
          if (!mql.matches || !model.get('orientation')) {
            model.set({orientation: 'vertical'}, {validate: true});
          }
          break;

        case 'toolbar.standard':
          model.set({
            isFixed: mql.matches
          });
          break;

        case 'toolbar.wide':
          model.set({
            orientation: ((mql.matches) ? 'horizontal' : 'vertical')
          }, {validate: true});
          // The tray orientation toggle visibility does not need to be
          // validated.
          model.set({
            isTrayToggleVisible: mql.matches
          });
          break;

        default:
          break;
      }
    }
  };

  /**
   * A toggle is an interactive element often bound to a click handler.
   *
   * @return {string}
   *   A string representing a DOM fragment.
   */
  Drupal.theme.toolbarOrientationToggle = function () {
    return '<div class="toolbar-toggle-orientation"><div class="toolbar-lining">' +
      '<button class="toolbar-icon" type="button"></button>' +
      '</div></div>';
  };

  /**
   * Ajax command to set the toolbar subtrees.
   *
   * @param {Drupal.Ajax} ajax
   *   {@link Drupal.Ajax} object created by {@link Drupal.ajax}.
   * @param {object} response
   *   JSON response from the Ajax request.
   * @param {number} [status]
   *   XMLHttpRequest status.
   */
  Drupal.AjaxCommands.prototype.setToolbarSubtrees = function (ajax, response, status) {
    Drupal.toolbar.setSubtrees.resolve(response.subtrees);
  };

}(jQuery, Drupal, drupalSettings));
;
/**
 * @file
 * A Backbone Model for collapsible menus.
 */

(function (Backbone, Drupal) {

  'use strict';

  /**
   * Backbone Model for collapsible menus.
   *
   * @constructor
   *
   * @augments Backbone.Model
   */
  Drupal.toolbar.MenuModel = Backbone.Model.extend(/** @lends Drupal.toolbar.MenuModel# */{

    /**
     * @type {object}
     *
     * @prop {object} subtrees
     */
    defaults: /** @lends Drupal.toolbar.MenuModel# */{

      /**
       * @type {object}
       */
      subtrees: {}
    }
  });

}(Backbone, Drupal));
;
/**
 * @file
 * A Backbone Model for the toolbar.
 */

(function (Backbone, Drupal) {

  'use strict';

  /**
   * Backbone model for the toolbar.
   *
   * @constructor
   *
   * @augments Backbone.Model
   */
  Drupal.toolbar.ToolbarModel = Backbone.Model.extend(/** @lends Drupal.toolbar.ToolbarModel# */{

    /**
     * @type {object}
     *
     * @prop activeTab
     * @prop activeTray
     * @prop isOriented
     * @prop isFixed
     * @prop areSubtreesLoaded
     * @prop isViewportOverflowConstrained
     * @prop orientation
     * @prop locked
     * @prop isTrayToggleVisible
     * @prop height
     * @prop offsets
     */
    defaults: /** @lends Drupal.toolbar.ToolbarModel# */{

      /**
       * The active toolbar tab. All other tabs should be inactive under
       * normal circumstances. It will remain active across page loads. The
       * active item is stored as an ID selector e.g. '#toolbar-item--1'.
       *
       * @type {string}
       */
      activeTab: null,

      /**
       * Represents whether a tray is open or not. Stored as an ID selector e.g.
       * '#toolbar-item--1-tray'.
       *
       * @type {string}
       */
      activeTray: null,

      /**
       * Indicates whether the toolbar is displayed in an oriented fashion,
       * either horizontal or vertical.
       *
       * @type {bool}
       */
      isOriented: false,

      /**
       * Indicates whether the toolbar is positioned absolute (false) or fixed
       * (true).
       *
       * @type {bool}
       */
      isFixed: false,

      /**
       * Menu subtrees are loaded through an AJAX request only when the Toolbar
       * is set to a vertical orientation.
       *
       * @type {bool}
       */
      areSubtreesLoaded: false,

      /**
       * If the viewport overflow becomes constrained, isFixed must be true so
       * that elements in the trays aren't lost off-screen and impossible to
       * get to.
       *
       * @type {bool}
       */
      isViewportOverflowConstrained: false,

      /**
       * The orientation of the active tray.
       *
       * @type {string}
       */
      orientation: 'vertical',

      /**
       * A tray is locked if a user toggled it to vertical. Otherwise a tray
       * will switch between vertical and horizontal orientation based on the
       * configured breakpoints. The locked state will be maintained across page
       * loads.
       *
       * @type {bool}
       */
      locked: false,

      /**
       * Indicates whether the tray orientation toggle is visible.
       *
       * @type {bool}
       */
      isTrayToggleVisible: false,

      /**
       * The height of the toolbar.
       *
       * @type {number}
       */
      height: null,

      /**
       * The current viewport offsets determined by {@link Drupal.displace}. The
       * offsets suggest how a module might position is components relative to
       * the viewport.
       *
       * @type {object}
       *
       * @prop {number} top
       * @prop {number} right
       * @prop {number} bottom
       * @prop {number} left
       */
      offsets: {
        top: 0,
        right: 0,
        bottom: 0,
        left: 0
      }
    },

    /**
     * @inheritdoc
     *
     * @param {object} attributes
     *   Attributes for the toolbar.
     * @param {object} options
     *   Options for the toolbar.
     *
     * @return {string|undefined}
     *   Returns an error message if validation failed.
     */
    validate: function (attributes, options) {
      // Prevent the orientation being set to horizontal if it is locked, unless
      // override has not been passed as an option.
      if (attributes.orientation === 'horizontal' && this.get('locked') && !options.override) {
        return Drupal.t('The toolbar cannot be set to a horizontal orientation when it is locked.');
      }
    }
  });

}(Backbone, Drupal));
;
/**
 * @file
 * A Backbone view for the body element.
 */

(function ($, Drupal, Backbone) {

  'use strict';

  Drupal.toolbar.BodyVisualView = Backbone.View.extend(/** @lends Drupal.toolbar.BodyVisualView# */{

    /**
     * Adjusts the body element with the toolbar position and dimension changes.
     *
     * @constructs
     *
     * @augments Backbone.View
     */
    initialize: function () {
      this.listenTo(this.model, 'change:orientation change:offsets change:activeTray change:isOriented change:isFixed change:isViewportOverflowConstrained', this.render);
    },

    /**
     * @inheritdoc
     */
    render: function () {
      var $body = $('body');
      var orientation = this.model.get('orientation');
      var isOriented = this.model.get('isOriented');
      var isViewportOverflowConstrained = this.model.get('isViewportOverflowConstrained');

      $body
        // We are using JavaScript to control media-query handling for two
        // reasons: (1) Using JavaScript let's us leverage the breakpoint
        // configurations and (2) the CSS is really complex if we try to hide
        // some styling from browsers that don't understand CSS media queries.
        // If we drive the CSS from classes added through JavaScript,
        // then the CSS becomes simpler and more robust.
        .toggleClass('toolbar-vertical', (orientation === 'vertical'))
        .toggleClass('toolbar-horizontal', (isOriented && orientation === 'horizontal'))
        // When the toolbar is fixed, it will not scroll with page scrolling.
        .toggleClass('toolbar-fixed', (isViewportOverflowConstrained || this.model.get('isFixed')))
        // Toggle the toolbar-tray-open class on the body element. The class is
        // applied when a toolbar tray is active. Padding might be applied to
        // the body element to prevent the tray from overlapping content.
        .toggleClass('toolbar-tray-open', !!this.model.get('activeTray'))
        // Apply padding to the top of the body to offset the placement of the
        // toolbar bar element.
        .css('padding-top', this.model.get('offsets').top);
    }
  });

}(jQuery, Drupal, Backbone));
;
/**
 * @file
 * A Backbone view for the collapsible menus.
 */

(function ($, Backbone, Drupal) {

  'use strict';

  Drupal.toolbar.MenuVisualView = Backbone.View.extend(/** @lends Drupal.toolbar.MenuVisualView# */{

    /**
     * Backbone View for collapsible menus.
     *
     * @constructs
     *
     * @augments Backbone.View
     */
    initialize: function () {
      this.listenTo(this.model, 'change:subtrees', this.render);
    },

    /**
     * @inheritdoc
     */
    render: function () {
      var subtrees = this.model.get('subtrees');
      // Add subtrees.
      for (var id in subtrees) {
        if (subtrees.hasOwnProperty(id)) {
          this.$el
            .find('#toolbar-link-' + id)
            .once('toolbar-subtrees')
            .after(subtrees[id]);
        }
      }
      // Render the main menu as a nested, collapsible accordion.
      if ('drupalToolbarMenu' in $.fn) {
        this.$el
          .children('.toolbar-menu')
          .drupalToolbarMenu();
      }
    }
  });

}(jQuery, Backbone, Drupal));
;
/**
 * @file
 * A Backbone view for the aural feedback of the toolbar.
 */

(function (Backbone, Drupal) {

  'use strict';

  Drupal.toolbar.ToolbarAuralView = Backbone.View.extend(/** @lends Drupal.toolbar.ToolbarAuralView# */{

    /**
     * Backbone view for the aural feedback of the toolbar.
     *
     * @constructs
     *
     * @augments Backbone.View
     *
     * @param {object} options
     *   Options for the view.
     * @param {object} options.strings
     *   Various strings to use in the view.
     */
    initialize: function (options) {
      this.strings = options.strings;

      this.listenTo(this.model, 'change:orientation', this.onOrientationChange);
      this.listenTo(this.model, 'change:activeTray', this.onActiveTrayChange);
    },

    /**
     * Announces an orientation change.
     *
     * @param {Drupal.toolbar.ToolbarModel} model
     *   The toolbar model in question.
     * @param {string} orientation
     *   The new value of the orientation attribute in the model.
     */
    onOrientationChange: function (model, orientation) {
      Drupal.announce(Drupal.t('Tray orientation changed to @orientation.', {
        '@orientation': orientation
      }));
    },

    /**
     * Announces a changed active tray.
     *
     * @param {Drupal.toolbar.ToolbarModel} model
     *   The toolbar model in question.
     * @param {HTMLElement} tray
     *   The new value of the tray attribute in the model.
     */
    onActiveTrayChange: function (model, tray) {
      var relevantTray = (tray === null) ? model.previous('activeTray') : tray;
      var action = (tray === null) ? Drupal.t('closed') : Drupal.t('opened');
      var trayNameElement = relevantTray.querySelector('.toolbar-tray-name');
      var text;
      if (trayNameElement !== null) {
        text = Drupal.t('Tray "@tray" @action.', {
          '@tray': trayNameElement.textContent, '@action': action
        });
      }
      else {
        text = Drupal.t('Tray @action.', {'@action': action});
      }
      Drupal.announce(text);
    }
  });

}(Backbone, Drupal));
;
/**
 * @file
 * A Backbone view for the toolbar element. Listens to mouse & touch.
 */

(function ($, Drupal, drupalSettings, Backbone) {

  'use strict';

  Drupal.toolbar.ToolbarVisualView = Backbone.View.extend(/** @lends Drupal.toolbar.ToolbarVisualView# */{

    /**
     * Event map for the `ToolbarVisualView`.
     *
     * @return {object}
     *   A map of events.
     */
    events: function () {
      // Prevents delay and simulated mouse events.
      var touchEndToClick = function (event) {
        event.preventDefault();
        event.target.click();
      };

      return {
        'click .toolbar-bar .toolbar-tab': 'onTabClick',
        'click .toolbar-toggle-orientation button': 'onOrientationToggleClick',
        'touchend .toolbar-bar .toolbar-tab': touchEndToClick,
        'touchend .toolbar-toggle-orientation button': touchEndToClick
      };
    },

    /**
     * Backbone view for the toolbar element. Listens to mouse & touch.
     *
     * @constructs
     *
     * @augments Backbone.View
     *
     * @param {object} options
     *   Options for the view object.
     * @param {object} options.strings
     *   Various strings to use in the view.
     */
    initialize: function (options) {
      this.strings = options.strings;

      this.listenTo(this.model, 'change:activeTab change:orientation change:isOriented change:isTrayToggleVisible', this.render);
      this.listenTo(this.model, 'change:mqMatches', this.onMediaQueryChange);
      this.listenTo(this.model, 'change:offsets', this.adjustPlacement);

      // Add the tray orientation toggles.
      this.$el
        .find('.toolbar-tray .toolbar-lining')
        .append(Drupal.theme('toolbarOrientationToggle'));

      // Trigger an activeTab change so that listening scripts can respond on
      // page load. This will call render.
      this.model.trigger('change:activeTab');
    },

    /**
     * @inheritdoc
     *
     * @return {Drupal.toolbar.ToolbarVisualView}
     *   The `ToolbarVisualView` instance.
     */
    render: function () {
      this.updateTabs();
      this.updateTrayOrientation();
      this.updateBarAttributes();
      // Load the subtrees if the orientation of the toolbar is changed to
      // vertical. This condition responds to the case that the toolbar switches
      // from horizontal to vertical orientation. The toolbar starts in a
      // vertical orientation by default and then switches to horizontal during
      // initialization if the media query conditions are met. Simply checking
      // that the orientation is vertical here would result in the subtrees
      // always being loaded, even when the toolbar initialization ultimately
      // results in a horizontal orientation.
      //
      // @see Drupal.behaviors.toolbar.attach() where admin menu subtrees
      // loading is invoked during initialization after media query conditions
      // have been processed.
      if (this.model.changed.orientation === 'vertical' || this.model.changed.activeTab) {
        this.loadSubtrees();
      }
      // Trigger a recalculation of viewport displacing elements. Use setTimeout
      // to ensure this recalculation happens after changes to visual elements
      // have processed.
      window.setTimeout(function () {
        Drupal.displace(true);
      }, 0);
      return this;
    },

    /**
     * Responds to a toolbar tab click.
     *
     * @param {jQuery.Event} event
     *   The event triggered.
     */
    onTabClick: function (event) {
      // If this tab has a tray associated with it, it is considered an
      // activatable tab.
      if (event.target.hasAttribute('data-toolbar-tray')) {
        var activeTab = this.model.get('activeTab');
        var clickedTab = event.target;

        // Set the event target as the active item if it is not already.
        this.model.set('activeTab', (!activeTab || clickedTab !== activeTab) ? clickedTab : null);

        event.preventDefault();
        event.stopPropagation();
      }
    },

    /**
     * Toggles the orientation of a toolbar tray.
     *
     * @param {jQuery.Event} event
     *   The event triggered.
     */
    onOrientationToggleClick: function (event) {
      var orientation = this.model.get('orientation');
      // Determine the toggle-to orientation.
      var antiOrientation = (orientation === 'vertical') ? 'horizontal' : 'vertical';
      var locked = antiOrientation === 'vertical';
      // Remember the locked state.
      if (locked) {
        localStorage.setItem('Drupal.toolbar.trayVerticalLocked', 'true');
      }
      else {
        localStorage.removeItem('Drupal.toolbar.trayVerticalLocked');
      }
      // Update the model.
      this.model.set({
        locked: locked,
        orientation: antiOrientation
      }, {
        validate: true,
        override: true
      });

      event.preventDefault();
      event.stopPropagation();
    },

    /**
     * Updates the display of the tabs: toggles a tab and the associated tray.
     */
    updateTabs: function () {
      var $tab = $(this.model.get('activeTab'));
      // Deactivate the previous tab.
      $(this.model.previous('activeTab'))
        .removeClass('is-active')
        .prop('aria-pressed', false);
      // Deactivate the previous tray.
      $(this.model.previous('activeTray'))
        .removeClass('is-active');

      // Activate the selected tab.
      if ($tab.length > 0) {
        $tab
          .addClass('is-active')
          // Mark the tab as pressed.
          .prop('aria-pressed', true);
        var name = $tab.attr('data-toolbar-tray');
        // Store the active tab name or remove the setting.
        var id = $tab.get(0).id;
        if (id) {
          localStorage.setItem('Drupal.toolbar.activeTabID', JSON.stringify(id));
        }
        // Activate the associated tray.
        var $tray = this.$el.find('[data-toolbar-tray="' + name + '"].toolbar-tray');
        if ($tray.length) {
          $tray.addClass('is-active');
          this.model.set('activeTray', $tray.get(0));
        }
        else {
          // There is no active tray.
          this.model.set('activeTray', null);
        }
      }
      else {
        // There is no active tray.
        this.model.set('activeTray', null);
        localStorage.removeItem('Drupal.toolbar.activeTabID');
      }
    },

    /**
     * Update the attributes of the toolbar bar element.
     */
    updateBarAttributes: function () {
      var isOriented = this.model.get('isOriented');
      if (isOriented) {
        this.$el.find('.toolbar-bar').attr('data-offset-top', '');
      }
      else {
        this.$el.find('.toolbar-bar').removeAttr('data-offset-top');
      }
      // Toggle between a basic vertical view and a more sophisticated
      // horizontal and vertical display of the toolbar bar and trays.
      this.$el.toggleClass('toolbar-oriented', isOriented);
    },

    /**
     * Updates the orientation of the active tray if necessary.
     */
    updateTrayOrientation: function () {
      var orientation = this.model.get('orientation');
      // The antiOrientation is used to render the view of action buttons like
      // the tray orientation toggle.
      var antiOrientation = (orientation === 'vertical') ? 'horizontal' : 'vertical';
      // Update the orientation of the trays.
      var $trays = this.$el.find('.toolbar-tray')
        .removeClass('toolbar-tray-horizontal toolbar-tray-vertical')
        .addClass('toolbar-tray-' + orientation);

      // Update the tray orientation toggle button.
      var iconClass = 'toolbar-icon-toggle-' + orientation;
      var iconAntiClass = 'toolbar-icon-toggle-' + antiOrientation;
      var $orientationToggle = this.$el.find('.toolbar-toggle-orientation')
        .toggle(this.model.get('isTrayToggleVisible'));
      $orientationToggle.find('button')
        .val(antiOrientation)
        .attr('title', this.strings[antiOrientation])
        .text(this.strings[antiOrientation])
        .removeClass(iconClass)
        .addClass(iconAntiClass);

      // Update data offset attributes for the trays.
      var dir = document.documentElement.dir;
      var edge = (dir === 'rtl') ? 'right' : 'left';
      // Remove data-offset attributes from the trays so they can be refreshed.
      $trays.removeAttr('data-offset-left data-offset-right data-offset-top');
      // If an active vertical tray exists, mark it as an offset element.
      $trays.filter('.toolbar-tray-vertical.is-active').attr('data-offset-' + edge, '');
      // If an active horizontal tray exists, mark it as an offset element.
      $trays.filter('.toolbar-tray-horizontal.is-active').attr('data-offset-top', '');
    },

    /**
     * Sets the tops of the trays so that they align with the bottom of the bar.
     */
    adjustPlacement: function () {
      var $trays = this.$el.find('.toolbar-tray');
      if (!this.model.get('isOriented')) {
        $trays.css('margin-top', 0);
        $trays.removeClass('toolbar-tray-horizontal').addClass('toolbar-tray-vertical');
      }
      else {
        // The toolbar container is invisible. Its placement is used to
        // determine the container for the trays.
        $trays.css('margin-top', this.$el.find('.toolbar-bar').outerHeight());
      }
    },

    /**
     * Calls the endpoint URI that builds an AJAX command with the rendered
     * subtrees.
     *
     * The rendered admin menu subtrees HTML is cached on the client in
     * localStorage until the cache of the admin menu subtrees on the server-
     * side is invalidated. The subtreesHash is stored in localStorage as well
     * and compared to the subtreesHash in drupalSettings to determine when the
     * admin menu subtrees cache has been invalidated.
     */
    loadSubtrees: function () {
      var $activeTab = $(this.model.get('activeTab'));
      var orientation = this.model.get('orientation');
      // Only load and render the admin menu subtrees if:
      //   (1) They have not been loaded yet.
      //   (2) The active tab is the administration menu tab, indicated by the
      //       presence of the data-drupal-subtrees attribute.
      //   (3) The orientation of the tray is vertical.
      if (!this.model.get('areSubtreesLoaded') && typeof $activeTab.data('drupal-subtrees') !== 'undefined' && orientation === 'vertical') {
        var subtreesHash = drupalSettings.toolbar.subtreesHash;
        var theme = drupalSettings.ajaxPageState.theme;
        var endpoint = Drupal.url('toolbar/subtrees/' + subtreesHash);
        var cachedSubtreesHash = localStorage.getItem('Drupal.toolbar.subtreesHash.' + theme);
        var cachedSubtrees = JSON.parse(localStorage.getItem('Drupal.toolbar.subtrees.' + theme));
        var isVertical = this.model.get('orientation') === 'vertical';
        // If we have the subtrees in localStorage and the subtree hash has not
        // changed, then use the cached data.
        if (isVertical && subtreesHash === cachedSubtreesHash && cachedSubtrees) {
          Drupal.toolbar.setSubtrees.resolve(cachedSubtrees);
        }
        // Only make the call to get the subtrees if the orientation of the
        // toolbar is vertical.
        else if (isVertical) {
          // Remove the cached menu information.
          localStorage.removeItem('Drupal.toolbar.subtreesHash.' + theme);
          localStorage.removeItem('Drupal.toolbar.subtrees.' + theme);
          // The AJAX response's command will trigger the resolve method of the
          // Drupal.toolbar.setSubtrees Promise.
          Drupal.ajax({url: endpoint}).execute();
          // Cache the hash for the subtrees locally.
          localStorage.setItem('Drupal.toolbar.subtreesHash.' + theme, subtreesHash);
        }
      }
    }
  });

}(jQuery, Drupal, drupalSettings, Backbone));
;
/* jQuery Foundation Joyride Plugin 2.1 | Copyright 2012, ZURB | www.opensource.org/licenses/mit-license.php */
(function(e,t,n){"use strict";var r={version:"2.0.3",tipLocation:"bottom",nubPosition:"auto",scroll:!0,scrollSpeed:300,timer:0,autoStart:!1,startTimerOnClick:!0,startOffset:0,nextButton:!0,tipAnimation:"fade",pauseAfter:[],tipAnimationFadeSpeed:300,cookieMonster:!1,cookieName:"joyride",cookieDomain:!1,cookiePath:!1,localStorage:!1,localStorageKey:"joyride",tipContainer:"body",modal:!1,expose:!1,postExposeCallback:e.noop,preRideCallback:e.noop,postRideCallback:e.noop,preStepCallback:e.noop,postStepCallback:e.noop,template:{link:'<a href="#close" class="joyride-close-tip">X</a>',timer:'<div class="joyride-timer-indicator-wrap"><span class="joyride-timer-indicator"></span></div>',tip:'<div class="joyride-tip-guide"><span class="joyride-nub"></span></div>',wrapper:'<div class="joyride-content-wrapper" role="dialog"></div>',button:'<a href="#" class="joyride-next-tip"></a>',modal:'<div class="joyride-modal-bg"></div>',expose:'<div class="joyride-expose-wrapper"></div>',exposeCover:'<div class="joyride-expose-cover"></div>'}},i=i||!1,s={},o={init:function(n){return this.each(function(){e.isEmptyObject(s)?(s=e.extend(!0,r,n),s.document=t.document,s.$document=e(s.document),s.$window=e(t),s.$content_el=e(this),s.$body=e(s.tipContainer),s.body_offset=e(s.tipContainer).position(),s.$tip_content=e("> li",s.$content_el),s.paused=!1,s.attempts=0,s.tipLocationPatterns={top:["bottom"],bottom:[],left:["right","top","bottom"],right:["left","top","bottom"]},o.jquery_check(),e.isFunction(e.cookie)||(s.cookieMonster=!1),(!s.cookieMonster||!e.cookie(s.cookieName))&&(!s.localStorage||!o.support_localstorage()||!localStorage.getItem(s.localStorageKey))&&(s.$tip_content.each(function(t){o.create({$li:e(this),index:t})}),s.autoStart&&(!s.startTimerOnClick&&s.timer>0?(o.show("init"),o.startTimer()):o.show("init"))),s.$document.on("click.joyride",".joyride-next-tip, .joyride-modal-bg",function(e){e.preventDefault(),s.$li.next().length<1?o.end():s.timer>0?(clearTimeout(s.automate),o.hide(),o.show(),o.startTimer()):(o.hide(),o.show())}),s.$document.on("click.joyride",".joyride-close-tip",function(e){e.preventDefault(),o.end()}),s.$window.bind("resize.joyride",function(t){if(s.$li){if(s.exposed&&s.exposed.length>0){var n=e(s.exposed);n.each(function(){var t=e(this);o.un_expose(t),o.expose(t)})}o.is_phone()?o.pos_phone():o.pos_default()}})):o.restart()})},resume:function(){o.set_li(),o.show()},nextTip:function(){s.$li.next().length<1?o.end():s.timer>0?(clearTimeout(s.automate),o.hide(),o.show(),o.startTimer()):(o.hide(),o.show())},tip_template:function(t){var n,r,i;return t.tip_class=t.tip_class||"",n=e(s.template.tip).addClass(t.tip_class),r=e.trim(e(t.li).html())+o.button_text(t.button_text)+s.template.link+o.timer_instance(t.index),i=e(s.template.wrapper),t.li.attr("data-aria-labelledby")&&i.attr("aria-labelledby",t.li.attr("data-aria-labelledby")),t.li.attr("data-aria-describedby")&&i.attr("aria-describedby",t.li.attr("data-aria-describedby")),n.append(i),n.first().attr("data-index",t.index),e(".joyride-content-wrapper",n).append(r),n[0]},timer_instance:function(t){var n;return t===0&&s.startTimerOnClick&&s.timer>0||s.timer===0?n="":n=o.outerHTML(e(s.template.timer)[0]),n},button_text:function(t){return s.nextButton?(t=e.trim(t)||"Next",t=o.outerHTML(e(s.template.button).append(t)[0])):t="",t},create:function(t){var n=t.$li.attr("data-button")||t.$li.attr("data-text"),r=t.$li.attr("class"),i=e(o.tip_template({tip_class:r,index:t.index,button_text:n,li:t.$li}));e(s.tipContainer).append(i)},show:function(t){var r={},i,u=[],a=0,f,l=null;if(s.$li===n||e.inArray(s.$li.index(),s.pauseAfter)===-1){s.paused?s.paused=!1:o.set_li(t),s.attempts=0;if(s.$li.length&&s.$target.length>0){t&&(s.preRideCallback(s.$li.index(),s.$next_tip),s.modal&&o.show_modal()),s.preStepCallback(s.$li.index(),s.$next_tip),u=(s.$li.data("options")||":").split(";"),a=u.length;for(i=a-1;i>=0;i--)f=u[i].split(":"),f.length===2&&(r[e.trim(f[0])]=e.trim(f[1]));s.tipSettings=e.extend({},s,r),s.tipSettings.tipLocationPattern=s.tipLocationPatterns[s.tipSettings.tipLocation],s.modal&&s.expose&&o.expose(),!/body/i.test(s.$target.selector)&&s.scroll&&o.scroll_to(),o.is_phone()?o.pos_phone(!0):o.pos_default(!0),l=e(".joyride-timer-indicator",s.$next_tip),/pop/i.test(s.tipAnimation)?(l.outerWidth(0),s.timer>0?(s.$next_tip.show(),l.animate({width:e(".joyride-timer-indicator-wrap",s.$next_tip).outerWidth()},s.timer)):s.$next_tip.show()):/fade/i.test(s.tipAnimation)&&(l.outerWidth(0),s.timer>0?(s.$next_tip.fadeIn(s.tipAnimationFadeSpeed),s.$next_tip.show(),l.animate({width:e(".joyride-timer-indicator-wrap",s.$next_tip).outerWidth()},s.timer)):s.$next_tip.fadeIn(s.tipAnimationFadeSpeed)),s.$current_tip=s.$next_tip,e(".joyride-next-tip",s.$current_tip).focus(),o.tabbable(s.$current_tip)}else s.$li&&s.$target.length<1?o.show():o.end()}else s.paused=!0},is_phone:function(){return i?i.mq("only screen and (max-width: 767px)"):s.$window.width()<767?!0:!1},support_localstorage:function(){return i?i.localstorage:!!t.localStorage},hide:function(){s.modal&&s.expose&&o.un_expose(),s.modal||e(".joyride-modal-bg").hide(),s.$current_tip.hide(),s.postStepCallback(s.$li.index(),s.$current_tip)},set_li:function(e){e?(s.$li=s.$tip_content.eq(s.startOffset),o.set_next_tip(),s.$current_tip=s.$next_tip):(s.$li=s.$li.next(),o.set_next_tip()),o.set_target()},set_next_tip:function(){s.$next_tip=e(".joyride-tip-guide[data-index="+s.$li.index()+"]")},set_target:function(){var t=s.$li.attr("data-class"),n=s.$li.attr("data-id"),r=function(){return n?e(s.document.getElementById(n)):t?e("."+t).filter(":visible").first():e("body")};s.$target=r()},scroll_to:function(){var t,n;t=s.$window.height()/2,n=Math.ceil(s.$target.offset().top-t+s.$next_tip.outerHeight()),e("html, body").stop().animate({scrollTop:n},s.scrollSpeed)},paused:function(){return e.inArray(s.$li.index()+1,s.pauseAfter)===-1?!0:!1},destroy:function(){e.isEmptyObject(s)||s.$document.off(".joyride"),e(t).off(".joyride"),e(".joyride-close-tip, .joyride-next-tip, .joyride-modal-bg").off(".joyride"),e(".joyride-tip-guide, .joyride-modal-bg").remove(),clearTimeout(s.automate),s={}},restart:function(){s.autoStart?(o.hide(),s.$li=n,o.show("init")):(!s.startTimerOnClick&&s.timer>0?(o.show("init"),o.startTimer()):o.show("init"),s.autoStart=!0)},pos_default:function(t){var n=Math.ceil(s.$window.height()/2),r=s.$next_tip.offset(),i=e(".joyride-nub",s.$next_tip),u=Math.ceil(i.outerWidth()/2),a=Math.ceil(i.outerHeight()/2),f=t||!1;f&&(s.$next_tip.css("visibility","hidden"),s.$next_tip.show());if(!/body/i.test(s.$target.selector)){var l=s.tipSettings.tipAdjustmentY?parseInt(s.tipSettings.tipAdjustmentY):0,c=s.tipSettings.tipAdjustmentX?parseInt(s.tipSettings.tipAdjustmentX):0;o.bottom()?(s.$next_tip.css({top:s.$target.offset().top+a+s.$target.outerHeight()+l,left:s.$target.offset().left+c}),/right/i.test(s.tipSettings.nubPosition)&&s.$next_tip.css("left",s.$target.offset().left-s.$next_tip.outerWidth()+s.$target.outerWidth()),o.nub_position(i,s.tipSettings.nubPosition,"top")):o.top()?(s.$next_tip.css({top:s.$target.offset().top-s.$next_tip.outerHeight()-a+l,left:s.$target.offset().left+c}),o.nub_position(i,s.tipSettings.nubPosition,"bottom")):o.right()?(s.$next_tip.css({top:s.$target.offset().top+l,left:s.$target.outerWidth()+s.$target.offset().left+u+c}),o.nub_position(i,s.tipSettings.nubPosition,"left")):o.left()&&(s.$next_tip.css({top:s.$target.offset().top+l,left:s.$target.offset().left-s.$next_tip.outerWidth()-u+c}),o.nub_position(i,s.tipSettings.nubPosition,"right")),!o.visible(o.corners(s.$next_tip))&&s.attempts<s.tipSettings.tipLocationPattern.length&&(i.removeClass("bottom").removeClass("top").removeClass("right").removeClass("left"),s.tipSettings.tipLocation=s.tipSettings.tipLocationPattern[s.attempts],s.attempts++,o.pos_default(!0))}else s.$li.length&&o.pos_modal(i);f&&(s.$next_tip.hide(),s.$next_tip.css("visibility","visible"))},pos_phone:function(t){var n=s.$next_tip.outerHeight(),r=s.$next_tip.offset(),i=s.$target.outerHeight(),u=e(".joyride-nub",s.$next_tip),a=Math.ceil(u.outerHeight()/2),f=t||!1;u.removeClass("bottom").removeClass("top").removeClass("right").removeClass("left"),f&&(s.$next_tip.css("visibility","hidden"),s.$next_tip.show()),/body/i.test(s.$target.selector)?s.$li.length&&o.pos_modal(u):o.top()?(s.$next_tip.offset({top:s.$target.offset().top-n-a}),u.addClass("bottom")):(s.$next_tip.offset({top:s.$target.offset().top+i+a}),u.addClass("top")),f&&(s.$next_tip.hide(),s.$next_tip.css("visibility","visible"))},pos_modal:function(e){o.center(),e.hide(),o.show_modal()},show_modal:function(){e(".joyride-modal-bg").length<1&&e("body").append(s.template.modal).show(),/pop/i.test(s.tipAnimation)?e(".joyride-modal-bg").show():e(".joyride-modal-bg").fadeIn(s.tipAnimationFadeSpeed)},expose:function(){var n,r,i,u,a="expose-"+Math.floor(Math.random()*1e4);if(arguments.length>0&&arguments[0]instanceof e)i=arguments[0];else{if(!s.$target||!!/body/i.test(s.$target.selector))return!1;i=s.$target}if(i.length<1)return t.console&&console.error("element not valid",i),!1;n=e(s.template.expose),s.$body.append(n),n.css({top:i.offset().top,left:i.offset().left,width:i.outerWidth(!0),height:i.outerHeight(!0)}),r=e(s.template.exposeCover),u={zIndex:i.css("z-index"),position:i.css("position")},i.css("z-index",n.css("z-index")*1+1),u.position=="static"&&i.css("position","relative"),i.data("expose-css",u),r.css({top:i.offset().top,left:i.offset().left,width:i.outerWidth(!0),height:i.outerHeight(!0)}),s.$body.append(r),n.addClass(a),r.addClass(a),s.tipSettings.exposeClass&&(n.addClass(s.tipSettings.exposeClass),r.addClass(s.tipSettings.exposeClass)),i.data("expose",a),s.postExposeCallback(s.$li.index(),s.$next_tip,i),o.add_exposed(i)},un_expose:function(){var n,r,i,u,a=!1;if(arguments.length>0&&arguments[0]instanceof e)r=arguments[0];else{if(!s.$target||!!/body/i.test(s.$target.selector))return!1;r=s.$target}if(r.length<1)return t.console&&console.error("element not valid",r),!1;n=r.data("expose"),i=e("."+n),arguments.length>1&&(a=arguments[1]),a===!0?e(".joyride-expose-wrapper,.joyride-expose-cover").remove():i.remove(),u=r.data("expose-css"),u.zIndex=="auto"?r.css("z-index",""):r.css("z-index",u.zIndex),u.position!=r.css("position")&&(u.position=="static"?r.css("position",""):r.css("position",u.position)),r.removeData("expose"),r.removeData("expose-z-index"),o.remove_exposed(r)},add_exposed:function(t){s.exposed=s.exposed||[],t instanceof e?s.exposed.push(t[0]):typeof t=="string"&&s.exposed.push(t)},remove_exposed:function(t){var n;t instanceof e?n=t[0]:typeof t=="string"&&(n=t),s.exposed=s.exposed||[];for(var r=0;r<s.exposed.length;r++)if(s.exposed[r]==n){s.exposed.splice(r,1);return}},center:function(){var e=s.$window;return s.$next_tip.css({top:(e.height()-s.$next_tip.outerHeight())/2+e.scrollTop(),left:(e.width()-s.$next_tip.outerWidth())/2+e.scrollLeft()}),!0},bottom:function(){return/bottom/i.test(s.tipSettings.tipLocation)},top:function(){return/top/i.test(s.tipSettings.tipLocation)},right:function(){return/right/i.test(s.tipSettings.tipLocation)},left:function(){return/left/i.test(s.tipSettings.tipLocation)},corners:function(e){var t=s.$window,n=t.height()/2,r=Math.ceil(s.$target.offset().top-n+s.$next_tip.outerHeight()),i=t.width()+t.scrollLeft(),o=t.height()+r,u=t.height()+t.scrollTop(),a=t.scrollTop();return r<a&&(r<0?a=0:a=r),o>u&&(u=o),[e.offset().top<a,i<e.offset().left+e.outerWidth(),u<e.offset().top+e.outerHeight(),t.scrollLeft()>e.offset().left]},visible:function(e){var t=e.length;while(t--)if(e[t])return!1;return!0},nub_position:function(e,t,n){t==="auto"?e.addClass(n):e.addClass(t)},startTimer:function(){s.$li.length?s.automate=setTimeout(function(){o.hide(),o.show(),o.startTimer()},s.timer):clearTimeout(s.automate)},end:function(){s.cookieMonster&&e.cookie(s.cookieName,"ridden",{expires:365,domain:s.cookieDomain,path:s.cookiePath}),s.localStorage&&localStorage.setItem(s.localStorageKey,!0),s.timer>0&&clearTimeout(s.automate),s.modal&&s.expose&&o.un_expose(),s.$current_tip&&s.$current_tip.hide(),s.$li&&(s.postStepCallback(s.$li.index(),s.$current_tip),s.postRideCallback(s.$li.index(),s.$current_tip)),e(".joyride-modal-bg").hide()},jquery_check:function(){return e.isFunction(e.fn.on)?!0:(e.fn.on=function(e,t,n){return this.delegate(t,e,n)},e.fn.off=function(e,t,n){return this.undelegate(t,e,n)},!1)},outerHTML:function(e){return e.outerHTML||(new XMLSerializer).serializeToString(e)},version:function(){return s.version},tabbable:function(t){e(t).on("keydown",function(n){if(!n.isDefaultPrevented()&&n.keyCode&&n.keyCode===27){n.preventDefault(),o.end();return}if(n.keyCode!==9)return;var r=e(t).find(":tabbable"),i=r.filter(":first"),s=r.filter(":last");n.target===s[0]&&!n.shiftKey?(i.focus(1),n.preventDefault()):n.target===i[0]&&n.shiftKey&&(s.focus(1),n.preventDefault())})}};e.fn.joyride=function(t){if(o[t])return o[t].apply(this,Array.prototype.slice.call(arguments,1));if(typeof t=="object"||!t)return o.init.apply(this,arguments);e.error("Method "+t+" does not exist on jQuery.joyride")}})(jQuery,this);
;
/**
 * @file
 * Attaches behaviors for the Tour module's toolbar tab.
 */

(function ($, Backbone, Drupal, document) {

  'use strict';

  var queryString = decodeURI(window.location.search);

  /**
   * Attaches the tour's toolbar tab behavior.
   *
   * It uses the query string for:
   * - tour: When ?tour=1 is present, the tour will start automatically after
   *   the page has loaded.
   * - tips: Pass ?tips=class in the url to filter the available tips to the
   *   subset which match the given class.
   *
   * @example
   * http://example.com/foo?tour=1&tips=bar
   *
   * @type {Drupal~behavior}
   *
   * @prop {Drupal~behaviorAttach} attach
   *   Attach tour functionality on `tour` events.
   */
  Drupal.behaviors.tour = {
    attach: function (context) {
      $('body').once('tour').each(function () {
        var model = new Drupal.tour.models.StateModel();
        new Drupal.tour.views.ToggleTourView({
          el: $(context).find('#toolbar-tab-tour'),
          model: model
        });

        model
          // Allow other scripts to respond to tour events.
          .on('change:isActive', function (model, isActive) {
            $(document).trigger((isActive) ? 'drupalTourStarted' : 'drupalTourStopped');
          })
          // Initialization: check whether a tour is available on the current
          // page.
          .set('tour', $(context).find('ol#tour'));

        // Start the tour immediately if toggled via query string.
        if (/tour=?/i.test(queryString)) {
          model.set('isActive', true);
        }
      });
    }
  };

  /**
   * @namespace
   */
  Drupal.tour = Drupal.tour || {

    /**
     * @namespace Drupal.tour.models
     */
    models: {},

    /**
     * @namespace Drupal.tour.views
     */
    views: {}
  };

  /**
   * Backbone Model for tours.
   *
   * @constructor
   *
   * @augments Backbone.Model
   */
  Drupal.tour.models.StateModel = Backbone.Model.extend(/** @lends Drupal.tour.models.StateModel# */{

    /**
     * @type {object}
     */
    defaults: /** @lends Drupal.tour.models.StateModel# */{

      /**
       * Indicates whether the Drupal root window has a tour.
       *
       * @type {Array}
       */
      tour: [],

      /**
       * Indicates whether the tour is currently running.
       *
       * @type {bool}
       */
      isActive: false,

      /**
       * Indicates which tour is the active one (necessary to cleanly stop).
       *
       * @type {Array}
       */
      activeTour: []
    }
  });

  Drupal.tour.views.ToggleTourView = Backbone.View.extend(/** @lends Drupal.tour.views.ToggleTourView# */{

    /**
     * @type {object}
     */
    events: {click: 'onClick'},

    /**
     * Handles edit mode toggle interactions.
     *
     * @constructs
     *
     * @augments Backbone.View
     */
    initialize: function () {
      this.listenTo(this.model, 'change:tour change:isActive', this.render);
      this.listenTo(this.model, 'change:isActive', this.toggleTour);
    },

    /**
     * @inheritdoc
     *
     * @return {Drupal.tour.views.ToggleTourView}
     *   The `ToggleTourView` view.
     */
    render: function () {
      // Render the visibility.
      this.$el.toggleClass('hidden', this._getTour().length === 0);
      // Render the state.
      var isActive = this.model.get('isActive');
      this.$el.find('button')
        .toggleClass('is-active', isActive)
        .prop('aria-pressed', isActive);
      return this;
    },

    /**
     * Model change handler; starts or stops the tour.
     */
    toggleTour: function () {
      if (this.model.get('isActive')) {
        var $tour = this._getTour();
        this._removeIrrelevantTourItems($tour, this._getDocument());
        var that = this;
        if ($tour.find('li').length) {
          $tour.joyride({
            autoStart: true,
            postRideCallback: function () { that.model.set('isActive', false); },
            // HTML segments for tip layout.
            template: {
              link: '<a href=\"#close\" class=\"joyride-close-tip\">&times;</a>',
              button: '<a href=\"#\" class=\"button button--primary joyride-next-tip\"></a>'
            }
          });
          this.model.set({isActive: true, activeTour: $tour});
        }
      }
      else {
        this.model.get('activeTour').joyride('destroy');
        this.model.set({isActive: false, activeTour: []});
      }
    },

    /**
     * Toolbar tab click event handler; toggles isActive.
     *
     * @param {jQuery.Event} event
     *   The click event.
     */
    onClick: function (event) {
      this.model.set('isActive', !this.model.get('isActive'));
      event.preventDefault();
      event.stopPropagation();
    },

    /**
     * Gets the tour.
     *
     * @return {jQuery}
     *   A jQuery element pointing to a `<ol>` containing tour items.
     */
    _getTour: function () {
      return this.model.get('tour');
    },

    /**
     * Gets the relevant document as a jQuery element.
     *
     * @return {jQuery}
     *   A jQuery element pointing to the document within which a tour would be
     *   started given the current state.
     */
    _getDocument: function () {
      return $(document);
    },

    /**
     * Removes tour items for elements that don't have matching page elements.
     *
     * Or that are explicitly filtered out via the 'tips' query string.
     *
     * @example
     * <caption>This will filter out tips that do not have a matching
     * page element or don't have the "bar" class.</caption>
     * http://example.com/foo?tips=bar
     *
     * @param {jQuery} $tour
     *   A jQuery element pointing to a `<ol>` containing tour items.
     * @param {jQuery} $document
     *   A jQuery element pointing to the document within which the elements
     *   should be sought.
     *
     * @see Drupal.tour.views.ToggleTourView#_getDocument
     */
    _removeIrrelevantTourItems: function ($tour, $document) {
      var removals = false;
      var tips = /tips=([^&]+)/.exec(queryString);
      $tour
        .find('li')
        .each(function () {
          var $this = $(this);
          var itemId = $this.attr('data-id');
          var itemClass = $this.attr('data-class');
          // If the query parameter 'tips' is set, remove all tips that don't
          // have the matching class.
          if (tips && !$(this).hasClass(tips[1])) {
            removals = true;
            $this.remove();
            return;
          }
          // Remove tip from the DOM if there is no corresponding page element.
          if ((!itemId && !itemClass) ||
            (itemId && $document.find('#' + itemId).length) ||
            (itemClass && $document.find('.' + itemClass).length)) {
            return;
          }
          removals = true;
          $this.remove();
        });

      // If there were removals, we'll have to do some clean-up.
      if (removals) {
        var total = $tour.find('li').length;
        if (!total) {
          this.model.set({tour: []});
        }

        $tour
          .find('li')
          // Rebuild the progress data.
          .each(function (index) {
            var progress = Drupal.t('!tour_item of !total', {'!tour_item': index + 1, '!total': total});
            $(this).find('.tour-progress').text(progress);
          })
          // Update the last item to have "End tour" as the button.
          .eq(-1)
          .attr('data-text', Drupal.t('End tour'));
      }
    }

  });

})(jQuery, Backbone, Drupal, document);
;
/**
 * @file
 * Manages page tabbing modifications made by modules.
 */

/**
 * Allow modules to respond to the constrain event.
 *
 * @event drupalTabbingConstrained
 */

/**
 * Allow modules to respond to the tabbingContext release event.
 *
 * @event drupalTabbingContextReleased
 */

/**
 * Allow modules to respond to the constrain event.
 *
 * @event drupalTabbingContextActivated
 */

/**
 * Allow modules to respond to the constrain event.
 *
 * @event drupalTabbingContextDeactivated
 */

(function ($, Drupal) {

  'use strict';

  /**
   * Provides an API for managing page tabbing order modifications.
   *
   * @constructor Drupal~TabbingManager
   */
  function TabbingManager() {

    /**
     * Tabbing sets are stored as a stack. The active set is at the top of the
     * stack. We use a JavaScript array as if it were a stack; we consider the
     * first element to be the bottom and the last element to be the top. This
     * allows us to use JavaScript's built-in Array.push() and Array.pop()
     * methods.
     *
     * @type {Array.<Drupal~TabbingContext>}
     */
    this.stack = [];
  }

  /**
   * Add public methods to the TabbingManager class.
   */
  $.extend(TabbingManager.prototype, /** @lends Drupal~TabbingManager# */{

    /**
     * Constrain tabbing to the specified set of elements only.
     *
     * Makes elements outside of the specified set of elements unreachable via
     * the tab key.
     *
     * @param {jQuery} elements
     *   The set of elements to which tabbing should be constrained. Can also
     *   be a jQuery-compatible selector string.
     *
     * @return {Drupal~TabbingContext}
     *   The TabbingContext instance.
     *
     * @fires event:drupalTabbingConstrained
     */
    constrain: function (elements) {
      // Deactivate all tabbingContexts to prepare for the new constraint. A
      // tabbingContext instance will only be reactivated if the stack is
      // unwound to it in the _unwindStack() method.
      var il = this.stack.length;
      for (var i = 0; i < il; i++) {
        this.stack[i].deactivate();
      }

      // The "active tabbing set" are the elements tabbing should be constrained
      // to.
      var $elements = $(elements).find(':tabbable').addBack(':tabbable');

      var tabbingContext = new TabbingContext({
        // The level is the current height of the stack before this new
        // tabbingContext is pushed on top of the stack.
        level: this.stack.length,
        $tabbableElements: $elements
      });

      this.stack.push(tabbingContext);

      // Activates the tabbingContext; this will manipulate the DOM to constrain
      // tabbing.
      tabbingContext.activate();

      // Allow modules to respond to the constrain event.
      $(document).trigger('drupalTabbingConstrained', tabbingContext);

      return tabbingContext;
    },

    /**
     * Restores a former tabbingContext when an active one is released.
     *
     * The TabbingManager stack of tabbingContext instances will be unwound
     * from the top-most released tabbingContext down to the first non-released
     * tabbingContext instance. This non-released instance is then activated.
     */
    release: function () {
      // Unwind as far as possible: find the topmost non-released
      // tabbingContext.
      var toActivate = this.stack.length - 1;
      while (toActivate >= 0 && this.stack[toActivate].released) {
        toActivate--;
      }

      // Delete all tabbingContexts after the to be activated one. They have
      // already been deactivated, so their effect on the DOM has been reversed.
      this.stack.splice(toActivate + 1);

      // Get topmost tabbingContext, if one exists, and activate it.
      if (toActivate >= 0) {
        this.stack[toActivate].activate();
      }
    },

    /**
     * Makes all elements outside of the tabbingContext's set untabbable.
     *
     * Elements made untabbable have their original tabindex and autofocus
     * values stored so that they might be restored later when this
     * tabbingContext is deactivated.
     *
     * @param {Drupal~TabbingContext} tabbingContext
     *   The TabbingContext instance that has been activated.
     */
    activate: function (tabbingContext) {
      var $set = tabbingContext.$tabbableElements;
      var level = tabbingContext.level;
      // Determine which elements are reachable via tabbing by default.
      var $disabledSet = $(':tabbable')
        // Exclude elements of the active tabbing set.
        .not($set);
      // Set the disabled set on the tabbingContext.
      tabbingContext.$disabledElements = $disabledSet;
      // Record the tabindex for each element, so we can restore it later.
      var il = $disabledSet.length;
      for (var i = 0; i < il; i++) {
        this.recordTabindex($disabledSet.eq(i), level);
      }
      // Make all tabbable elements outside of the active tabbing set
      // unreachable.
      $disabledSet
        .prop('tabindex', -1)
        .prop('autofocus', false);

      // Set focus on an element in the tabbingContext's set of tabbable
      // elements. First, check if there is an element with an autofocus
      // attribute. Select the last one from the DOM order.
      var $hasFocus = $set.filter('[autofocus]').eq(-1);
      // If no element in the tabbable set has an autofocus attribute, select
      // the first element in the set.
      if ($hasFocus.length === 0) {
        $hasFocus = $set.eq(0);
      }
      $hasFocus.trigger('focus');
    },

    /**
     * Restores that tabbable state of a tabbingContext's disabled elements.
     *
     * Elements that were made untabbable have their original tabindex and
     * autofocus values restored.
     *
     * @param {Drupal~TabbingContext} tabbingContext
     *   The TabbingContext instance that has been deactivated.
     */
    deactivate: function (tabbingContext) {
      var $set = tabbingContext.$disabledElements;
      var level = tabbingContext.level;
      var il = $set.length;
      for (var i = 0; i < il; i++) {
        this.restoreTabindex($set.eq(i), level);
      }
    },

    /**
     * Records the tabindex and autofocus values of an untabbable element.
     *
     * @param {jQuery} $el
     *   The set of elements that have been disabled.
     * @param {number} level
     *   The stack level for which the tabindex attribute should be recorded.
     */
    recordTabindex: function ($el, level) {
      var tabInfo = $el.data('drupalOriginalTabIndices') || {};
      tabInfo[level] = {
        tabindex: $el[0].getAttribute('tabindex'),
        autofocus: $el[0].hasAttribute('autofocus')
      };
      $el.data('drupalOriginalTabIndices', tabInfo);
    },

    /**
     * Restores the tabindex and autofocus values of a reactivated element.
     *
     * @param {jQuery} $el
     *   The element that is being reactivated.
     * @param {number} level
     *   The stack level for which the tabindex attribute should be restored.
     */
    restoreTabindex: function ($el, level) {
      var tabInfo = $el.data('drupalOriginalTabIndices');
      if (tabInfo && tabInfo[level]) {
        var data = tabInfo[level];
        if (data.tabindex) {
          $el[0].setAttribute('tabindex', data.tabindex);
        }
        // If the element did not have a tabindex at this stack level then
        // remove it.
        else {
          $el[0].removeAttribute('tabindex');
        }
        if (data.autofocus) {
          $el[0].setAttribute('autofocus', 'autofocus');
        }

        // Clean up $.data.
        if (level === 0) {
          // Remove all data.
          $el.removeData('drupalOriginalTabIndices');
        }
        else {
          // Remove the data for this stack level and higher.
          var levelToDelete = level;
          while (tabInfo.hasOwnProperty(levelToDelete)) {
            delete tabInfo[levelToDelete];
            levelToDelete++;
          }
          $el.data('drupalOriginalTabIndices', tabInfo);
        }
      }
    }
  });

  /**
   * Stores a set of tabbable elements.
   *
   * This constraint can be removed with the release() method.
   *
   * @constructor Drupal~TabbingContext
   *
   * @param {object} options
   *   A set of initiating values
   * @param {number} options.level
   *   The level in the TabbingManager's stack of this tabbingContext.
   * @param {jQuery} options.$tabbableElements
   *   The DOM elements that should be reachable via the tab key when this
   *   tabbingContext is active.
   * @param {jQuery} options.$disabledElements
   *   The DOM elements that should not be reachable via the tab key when this
   *   tabbingContext is active.
   * @param {bool} options.released
   *   A released tabbingContext can never be activated again. It will be
   *   cleaned up when the TabbingManager unwinds its stack.
   * @param {bool} options.active
   *   When true, the tabbable elements of this tabbingContext will be reachable
   *   via the tab key and the disabled elements will not. Only one
   *   tabbingContext can be active at a time.
   */
  function TabbingContext(options) {

    $.extend(this, /** @lends Drupal~TabbingContext# */{

      /**
       * @type {?number}
       */
      level: null,

      /**
       * @type {jQuery}
       */
      $tabbableElements: $(),

      /**
       * @type {jQuery}
       */
      $disabledElements: $(),

      /**
       * @type {bool}
       */
      released: false,

      /**
       * @type {bool}
       */
      active: false
    }, options);
  }

  /**
   * Add public methods to the TabbingContext class.
   */
  $.extend(TabbingContext.prototype, /** @lends Drupal~TabbingContext# */{

    /**
     * Releases this TabbingContext.
     *
     * Once a TabbingContext object is released, it can never be activated
     * again.
     *
     * @fires event:drupalTabbingContextReleased
     */
    release: function () {
      if (!this.released) {
        this.deactivate();
        this.released = true;
        Drupal.tabbingManager.release(this);
        // Allow modules to respond to the tabbingContext release event.
        $(document).trigger('drupalTabbingContextReleased', this);
      }
    },

    /**
     * Activates this TabbingContext.
     *
     * @fires event:drupalTabbingContextActivated
     */
    activate: function () {
      // A released TabbingContext object can never be activated again.
      if (!this.active && !this.released) {
        this.active = true;
        Drupal.tabbingManager.activate(this);
        // Allow modules to respond to the constrain event.
        $(document).trigger('drupalTabbingContextActivated', this);
      }
    },

    /**
     * Deactivates this TabbingContext.
     *
     * @fires event:drupalTabbingContextDeactivated
     */
    deactivate: function () {
      if (this.active) {
        this.active = false;
        Drupal.tabbingManager.deactivate(this);
        // Allow modules to respond to the constrain event.
        $(document).trigger('drupalTabbingContextDeactivated', this);
      }
    }
  });

  // Mark this behavior as processed on the first pass and return if it is
  // already processed.
  if (Drupal.tabbingManager) {
    return;
  }

  /**
   * @type {Drupal~TabbingManager}
   */
  Drupal.tabbingManager = new TabbingManager();

}(jQuery, Drupal));
;
/**
 * @file
 * Attaches behaviors for the Contextual module's edit toolbar tab.
 */

(function ($, Drupal, Backbone) {

  'use strict';

  var strings = {
    tabbingReleased: Drupal.t('Tabbing is no longer constrained by the Contextual module.'),
    tabbingConstrained: Drupal.t('Tabbing is constrained to a set of @contextualsCount and the edit mode toggle.'),
    pressEsc: Drupal.t('Press the esc key to exit.')
  };

  /**
   * Initializes a contextual link: updates its DOM, sets up model and views.
   *
   * @param {HTMLElement} context
   *   A contextual links DOM element as rendered by the server.
   */
  function initContextualToolbar(context) {
    if (!Drupal.contextual || !Drupal.contextual.collection) {
      return;
    }

    var contextualToolbar = Drupal.contextualToolbar;
    var model = contextualToolbar.model = new contextualToolbar.StateModel({
      // Checks whether localStorage indicates we should start in edit mode
      // rather than view mode.
      // @see Drupal.contextualToolbar.VisualView.persist
      isViewing: localStorage.getItem('Drupal.contextualToolbar.isViewing') !== 'false'
    }, {
      contextualCollection: Drupal.contextual.collection
    });

    var viewOptions = {
      el: $('.toolbar .toolbar-bar .contextual-toolbar-tab'),
      model: model,
      strings: strings
    };
    new contextualToolbar.VisualView(viewOptions);
    new contextualToolbar.AuralView(viewOptions);
  }

  /**
   * Attaches contextual's edit toolbar tab behavior.
   *
   * @type {Drupal~behavior}
   *
   * @prop {Drupal~behaviorAttach} attach
   *   Attaches contextual toolbar behavior on a contextualToolbar-init event.
   */
  Drupal.behaviors.contextualToolbar = {
    attach: function (context) {
      if ($('body').once('contextualToolbar-init').length) {
        initContextualToolbar(context);
      }
    }
  };

  /**
   * Namespace for the contextual toolbar.
   *
   * @namespace
   */
  Drupal.contextualToolbar = {

    /**
     * The {@link Drupal.contextualToolbar.StateModel} instance.
     *
     * @type {?Drupal.contextualToolbar.StateModel}
     */
    model: null
  };

})(jQuery, Drupal, Backbone);
;
/**
 * @file
 * A Backbone Model for the state of Contextual module's edit toolbar tab.
 */

(function (Drupal, Backbone) {

  'use strict';

  Drupal.contextualToolbar.StateModel = Backbone.Model.extend(/** @lends Drupal.contextualToolbar.StateModel# */{

    /**
     * @type {object}
     *
     * @prop {bool} isViewing
     * @prop {bool} isVisible
     * @prop {number} contextualCount
     * @prop {Drupal~TabbingContext} tabbingContext
     */
    defaults: /** @lends Drupal.contextualToolbar.StateModel# */{

      /**
       * Indicates whether the toggle is currently in "view" or "edit" mode.
       *
       * @type {bool}
       */
      isViewing: true,

      /**
       * Indicates whether the toggle should be visible or hidden. Automatically
       * calculated, depends on contextualCount.
       *
       * @type {bool}
       */
      isVisible: false,

      /**
       * Tracks how many contextual links exist on the page.
       *
       * @type {number}
       */
      contextualCount: 0,

      /**
       * A TabbingContext object as returned by {@link Drupal~TabbingManager}:
       * the set of tabbable elements when edit mode is enabled.
       *
       * @type {?Drupal~TabbingContext}
       */
      tabbingContext: null
    },

    /**
     * Models the state of the edit mode toggle.
     *
     * @constructs
     *
     * @augments Backbone.Model
     *
     * @param {object} attrs
     *   Attributes for the backbone model.
     * @param {object} options
     *   An object with the following option:
     * @param {Backbone.collection} options.contextualCollection
     *   The collection of {@link Drupal.contextual.StateModel} models that
     *   represent the contextual links on the page.
     */
    initialize: function (attrs, options) {
      // Respond to new/removed contextual links.
      this.listenTo(options.contextualCollection, 'reset remove add', this.countContextualLinks);
      this.listenTo(options.contextualCollection, 'add', this.lockNewContextualLinks);

      // Automatically determine visibility.
      this.listenTo(this, 'change:contextualCount', this.updateVisibility);

      // Whenever edit mode is toggled, lock all contextual links.
      this.listenTo(this, 'change:isViewing', function (model, isViewing) {
        options.contextualCollection.each(function (contextualModel) {
          contextualModel.set('isLocked', !isViewing);
        });
      });
    },

    /**
     * Tracks the number of contextual link models in the collection.
     *
     * @param {Drupal.contextual.StateModel} contextualModel
     *   The contextual links model that was added or removed.
     * @param {Backbone.Collection} contextualCollection
     *    The collection of contextual link models.
     */
    countContextualLinks: function (contextualModel, contextualCollection) {
      this.set('contextualCount', contextualCollection.length);
    },

    /**
     * Lock newly added contextual links if edit mode is enabled.
     *
     * @param {Drupal.contextual.StateModel} contextualModel
     *   The contextual links model that was added.
     * @param {Backbone.Collection} [contextualCollection]
     *    The collection of contextual link models.
     */
    lockNewContextualLinks: function (contextualModel, contextualCollection) {
      if (!this.get('isViewing')) {
        contextualModel.set('isLocked', true);
      }
    },

    /**
     * Automatically updates visibility of the view/edit mode toggle.
     */
    updateVisibility: function () {
      this.set('isVisible', this.get('contextualCount') > 0);
    }

  });

})(Drupal, Backbone);
;
/**
 * @file
 * A Backbone View that provides the aural view of the edit mode toggle.
 */

(function ($, Drupal, Backbone, _) {

  'use strict';

  Drupal.contextualToolbar.AuralView = Backbone.View.extend(/** @lends Drupal.contextualToolbar.AuralView# */{

    /**
     * Tracks whether the tabbing constraint announcement has been read once.
     *
     * @type {bool}
     */
    announcedOnce: false,

    /**
     * Renders the aural view of the edit mode toggle (screen reader support).
     *
     * @constructs
     *
     * @augments Backbone.View
     *
     * @param {object} options
     *   Options for the view.
     */
    initialize: function (options) {
      this.options = options;

      this.listenTo(this.model, 'change', this.render);
      this.listenTo(this.model, 'change:isViewing', this.manageTabbing);

      $(document).on('keyup', _.bind(this.onKeypress, this));
    },

    /**
     * @inheritdoc
     *
     * @return {Drupal.contextualToolbar.AuralView}
     *   The current contextual toolbar aural view.
     */
    render: function () {
      // Render the state.
      this.$el.find('button').attr('aria-pressed', !this.model.get('isViewing'));

      return this;
    },

    /**
     * Limits tabbing to the contextual links and edit mode toolbar tab.
     */
    manageTabbing: function () {
      var tabbingContext = this.model.get('tabbingContext');
      // Always release an existing tabbing context.
      if (tabbingContext) {
        tabbingContext.release();
        Drupal.announce(this.options.strings.tabbingReleased);
      }
      // Create a new tabbing context when edit mode is enabled.
      if (!this.model.get('isViewing')) {
        tabbingContext = Drupal.tabbingManager.constrain($('.contextual-toolbar-tab, .contextual'));
        this.model.set('tabbingContext', tabbingContext);
        this.announceTabbingConstraint();
        this.announcedOnce = true;
      }
    },

    /**
     * Announces the current tabbing constraint.
     */
    announceTabbingConstraint: function () {
      var strings = this.options.strings;
      Drupal.announce(Drupal.formatString(strings.tabbingConstrained, {
        '@contextualsCount': Drupal.formatPlural(Drupal.contextual.collection.length, '@count contextual link', '@count contextual links')
      }));
      Drupal.announce(strings.pressEsc);
    },

    /**
     * Responds to esc and tab key press events.
     *
     * @param {jQuery.Event} event
     *   The keypress event.
     */
    onKeypress: function (event) {
      // The first tab key press is tracked so that an annoucement about tabbing
      // constraints can be raised if edit mode is enabled when the page is
      // loaded.
      if (!this.announcedOnce && event.keyCode === 9 && !this.model.get('isViewing')) {
        this.announceTabbingConstraint();
        // Set announce to true so that this conditional block won't run again.
        this.announcedOnce = true;
      }
      // Respond to the ESC key. Exit out of edit mode.
      if (event.keyCode === 27) {
        this.model.set('isViewing', true);
      }
    }

  });

})(jQuery, Drupal, Backbone, _);
;
/**
 * @file
 * A Backbone View that provides the visual view of the edit mode toggle.
 */

(function (Drupal, Backbone) {

  'use strict';

  Drupal.contextualToolbar.VisualView = Backbone.View.extend(/** @lends Drupal.contextualToolbar.VisualView# */{

    /**
     * Events for the Backbone view.
     *
     * @return {object}
     *   A mapping of events to be used in the view.
     */
    events: function () {
      // Prevents delay and simulated mouse events.
      var touchEndToClick = function (event) {
        event.preventDefault();
        event.target.click();
      };

      return {
        click: function () {
          this.model.set('isViewing', !this.model.get('isViewing'));
        },
        touchend: touchEndToClick
      };
    },

    /**
     * Renders the visual view of the edit mode toggle.
     *
     * Listens to mouse & touch and handles edit mode toggle interactions.
     *
     * @constructs
     *
     * @augments Backbone.View
     */
    initialize: function () {
      this.listenTo(this.model, 'change', this.render);
      this.listenTo(this.model, 'change:isViewing', this.persist);
    },

    /**
     * @inheritdoc
     *
     * @return {Drupal.contextualToolbar.VisualView}
     *   The current contextual toolbar visual view.
     */
    render: function () {
      // Render the visibility.
      this.$el.toggleClass('hidden', !this.model.get('isVisible'));
      // Render the state.
      this.$el.find('button').toggleClass('is-active', !this.model.get('isViewing'));

      return this;
    },

    /**
     * Model change handler; persists the isViewing value to localStorage.
     *
     * `isViewing === true` is the default, so only stores in localStorage when
     * it's not the default value (i.e. false).
     *
     * @param {Drupal.contextualToolbar.StateModel} model
     *   A {@link Drupal.contextualToolbar.StateModel} model.
     * @param {bool} isViewing
     *   The value of the isViewing attribute in the model.
     */
    persist: function (model, isViewing) {
      if (!isViewing) {
        localStorage.setItem('Drupal.contextualToolbar.isViewing', 'false');
      }
      else {
        localStorage.removeItem('Drupal.contextualToolbar.isViewing');
      }
    }

  });

})(Drupal, Backbone);
;
/**
 * @file
 * Replaces the home link in toolbar with a back to site link.
 */

(function ($, Drupal, drupalSettings) {

  'use strict';

  var pathInfo = drupalSettings.path;
  var escapeAdminPath = sessionStorage.getItem('escapeAdminPath');
  var windowLocation = window.location;

  // Saves the last non-administrative page in the browser to be able to link
  // back to it when browsing administrative pages. If there is a destination
  // parameter there is not need to save the current path because the page is
  // loaded within an existing "workflow".
  if (!pathInfo.currentPathIsAdmin && !/destination=/.test(windowLocation.search)) {
    sessionStorage.setItem('escapeAdminPath', windowLocation);
  }

  /**
   * Replaces the "Home" link with "Back to site" link.
   *
   * Back to site link points to the last non-administrative page the user
   * visited within the same browser tab.
   *
   * @type {Drupal~behavior}
   *
   * @prop {Drupal~behaviorAttach} attach
   *   Attaches the replacement functionality to the toolbar-escape-admin element.
   */
  Drupal.behaviors.escapeAdmin = {
    attach: function () {
      var $toolbarEscape = $('[data-toolbar-escape-admin]').once('escapeAdmin');
      if ($toolbarEscape.length && pathInfo.currentPathIsAdmin) {
        if (escapeAdminPath !== null) {
          $toolbarEscape.attr('href', escapeAdminPath);
        }
        else {
          $toolbarEscape.text(Drupal.t('Home'));
        }
        $toolbarEscape.closest('.toolbar-tab').removeClass('hidden');
      }
    }
  };

})(jQuery, Drupal, drupalSettings);
;
