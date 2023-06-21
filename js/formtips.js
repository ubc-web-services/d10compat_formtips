/**
 * @file
 */

(function ($, Drupal, once) {

  Drupal.behaviors.formtips = {
    attach: function (context, settings) {

      function hideOnClickOutside(element, $description) {
        var outsideClickListener = function (event) {
          var $target = $(event.target);
          if (!$target.hasClass('formtip') && !$target.hasClass('formtips-processed')) {
            $description.toggleClass('formtips-show', false);
          }
        }

        $(document).on('click', outsideClickListener);
      }

      var formtip_settings = settings.formtips;
      var selectors = formtip_settings.selectors;
      if ($.isArray(selectors)) {
        selectors = selectors.join(', ');
      }

      var $descriptions = $('.form-item .description,.form-item__description,.form-item .filter-guidelines')
        .not(selectors)
        .not('.formtips-processed');

      // Filter out empty descriptions. This helps avoid the password strength
      // description getting caught in a help.
      $descriptions = $descriptions.filter(function () {
        return $.trim($(this).text()) !== '';
      });

      if (formtip_settings.max_width.length) {
        $descriptions.css('max-width', formtip_settings.max_width);
      }

      // Hide descriptions when escaped is hit.
      $(document).on('keyup', function (e) {
        if (e.which === 27) {
          $descriptions.removeClass('formtips-show');
        }
      });

      // As in Drupal 10: Remove jQuery dependency from the once feature
      // @see: https://www.drupal.org/node/3158256
      $(once('formtips', $descriptions, context)).each(function () {
        var $formtip = $('<a class="formtip"></a>');
        var $description = $(this);
        var $item = $description.closest('.form-item');
        var descriptionId = $description.attr('id');

        // If there is no description id, skip.
        if (!descriptionId) {
          return;
        }

        if (descriptionId.endsWith('-format-guidelines')) {
          // Grab the field id from guidelines
          fieldId = descriptionId.slice(0, -18) + '-value';
        } else {
          // Otherwise grabs it from the field description
          fieldId = descriptionId.substring(0, descriptionId.lastIndexOf("-") - 1);
        }

        // First try to find a label associated with that field
        var $label = $item.find('[for="' + fieldId + '"]:not(.visually-hidden)');

        // Otherwise look for the first label, a fieldset legend or draggable
        // table label.
        if (!$label.length) {
          $label = $item.find('.fieldset-legend,label,.label,.form-item__label').first();
        }

        // Use the fieldset if the item is a radio or checkbox.
        var $fieldset = $item.find('.fieldset-legend');
        if ($fieldset.length && $item.find('input[type="checkbox"], input[type="radio"]').length) {
          $label = $fieldset;
        }

        // If there is no label, skip.
        if (!$label.length) {
          return;
        }

        $description.addClass('formtips-processed');

        $item.addClass('formtips-item');
        $description.toggleClass('formtips-show', false);
        $label.append($formtip);

        if (formtip_settings.trigger_action === 'click') {
          $formtip.on('click', function () {
            $description.toggleClass('formtips-show');
            return false;
          });
          // Hide description when clicking elsewhere.

          hideOnClickOutside($item[0], $description);

        }
        else {
          $formtip.hoverIntent({
            sensitivity: formtip_settings.sensitivity,
            interval: formtip_settings.interval,
            over: function () {
              $description.toggleClass('formtips-show', true);
            },
            timeout: formtip_settings.timeout,
            out: function () {
              $description.toggleClass('formtips-show', false);
            }
          });
        }
      });
    }
  };

})(jQuery, Drupal, once);
