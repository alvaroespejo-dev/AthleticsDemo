(function(api) {

    api.sectionConstructor['sports-accessories-upsell'] = api.Section.extend({

        // Remove events for this section.
        attachEvents: function() {},

        // Ensure this section is active. Normally, sections without contents aren't visible.
        isContextuallyActive: function() {
            return true;
        }
    });

    const sports_accessories_section_lists = ['banner', 'services'];
    sports_accessories_section_lists.forEach(sports_accessories_homepage_scroll);

    function sports_accessories_homepage_scroll(item, index) {
        // Detect when the front page sections section is expanded (or closed) so we can adjust the preview accordingly.
        item = item.replace(/-/g, '_');
        wp.customize.section('sports_accessories_' + item + '_section', function(section) {
            section.expanded.bind(function(isExpanding) {
                // Value of isExpanding will = true if you're entering the section, false if you're leaving it.
                wp.customize.previewer.send(item, { expanded: isExpanding });
            });
        });
    }
})(wp.customize);

// Example JavaScript/jQuery for tab interaction
jQuery(document).ready(function($) {
    $('.customize-control-radio input[type="radio"]').change(function() {
        // Remove active class from all labels
        $('.customize-control-radio label').removeClass('active');
        
        // Add active class to the selected label
        $(this).next('label').addClass('active');
    });
});

jQuery(document).ready(function($) {
    $('#sports-accessories-custom-container img').on('click', function() {
        $('#sports-accessories-custom-container img').removeClass('sports-accessories-selected-img');
        $(this).addClass('sports-accessories-selected-img');
        $(this).prev('input[type="radio"]').prop('checked', true).trigger('change');
    });
});

(function ($) {
    function ResetDemoSettings() {
        if (!confirm("Are you sure you want to reset demo import settings?")) return;

        $.post(ajaxurl, { action: 'sports_accessories_reset_demo_import_settings' }, function () {
            location.reload();
        });
    }

    window.ResetDemoSettings = ResetDemoSettings;
})(jQuery);

(function ($,wp) {
    function ResetGlobalColor() {
        if (confirm("Are you sure you want to reset global color settings?")) {
            wp.customize.instance("sports_accessories_primary_color").set("#860000");
        }
    }

    window.ResetGlobalColor = ResetGlobalColor;
})(jQuery, wp);