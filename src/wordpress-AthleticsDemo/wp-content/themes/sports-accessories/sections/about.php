<?php
if ( ! get_theme_mod( 'sports_accessories_enable_about_section', false ) ) {
    return;
}

$sports_accessories_slider_content_ids  = array();
$sports_accessories_slider_content_type = get_theme_mod( 'sports_accessories_about_content_type', 'post' );

$sports_accessories_slider_content_ids[] = get_theme_mod( 'sports_accessories_about_content_' . $sports_accessories_slider_content_type . '_' );

// Get the category for the services slider from theme mods or a default category
$sports_accessories_about_category = get_theme_mod('sports_accessories_about_category', 'about');

// Modify query to fetch posts from a specific category
$sports_accessories_about_args = array(
    'post_type'           => $sports_accessories_slider_content_type,
    'post__in'            => array_filter( $sports_accessories_slider_content_ids ),
    'orderby'             => 'post__in',
    'posts_per_page'      => absint(3),
    'ignore_sticky_posts' => true,
);

// Apply category filter only if content type is 'post'
if ( 'post' === $sports_accessories_slider_content_type && ! empty( $sports_accessories_about_category ) ) {
    $sports_accessories_about_args['category_name'] = $sports_accessories_about_category;
}

$sports_accessories_about_args = apply_filters( 'sports_accessories_about_section_args', $sports_accessories_about_args );

sports_accessories_render_about_section( $sports_accessories_about_args );

/**
 * Render about Section.
 */
function sports_accessories_render_about_section( $sports_accessories_about_args ) { ?>

    <section id="sports_accessories_about_section" class="about-section about-style-1">
        <?php
        if ( is_customize_preview() ) :
            sports_accessories_section_link( 'sports_accessories_about_section' );
        endif;
        ?>
        <div class="asterthemes-wrapper">
            <?php
            $sports_accessories_query = new WP_Query( $sports_accessories_about_args );
            if ( $sports_accessories_query->have_posts() ) :
                while ( $sports_accessories_query->have_posts() ) :
                    $sports_accessories_query->the_post();
                    $sports_accessories_button_label = get_theme_mod( 'sports_accessories_about_button_label_');
                    $sports_accessories_button_link  = get_theme_mod( 'sports_accessories_about_button_link_');
                    $sports_accessories_button_link  = ! empty( $sports_accessories_button_link ) ? $sports_accessories_button_link : get_the_permalink();
                    
                    // Count custom images and featured image
                    $sports_accessories_custom_images_count = 0;
                    $sports_accessories_custom_image_url_1 = get_theme_mod('sports_accessories_custom_image_setting_1');
                    $sports_accessories_custom_image_url_2 = get_theme_mod('sports_accessories_custom_image_setting_2');
                    $sports_accessories_custom_image_url_3 = get_theme_mod('sports_accessories_custom_image_setting_3');

                    $sports_accessories_custom_images_count += !empty($sports_accessories_custom_image_url_1) ? 1 : 0;
                    $sports_accessories_custom_images_count += !empty($sports_accessories_custom_image_url_2) ? 1 : 0;
                    $sports_accessories_custom_images_count += !empty($sports_accessories_custom_image_url_3) ? 1 : 0;

                    $sports_accessories_has_featured_image = has_post_thumbnail();

                    // Check if only the default image will be displayed
                    $sports_accessories_only_default_image = ($sports_accessories_custom_images_count === 0 && !$sports_accessories_has_featured_image);
                    ?>
                    <div class="about-single<?php echo $sports_accessories_only_default_image ? ' full-width' : ''; ?>">
                        <div class="about-img">
                            <div class="about-images">
                                <?php if ($sports_accessories_custom_image_url_1): ?>
                                    <div class="image1">
                                        <img src="<?php echo esc_url($sports_accessories_custom_image_url_1); ?>" alt="<?php esc_attr_e('About Us Image  1', 'sports-accessories'); ?>">
                                    </div>
                                <?php endif; ?>

                                <?php if ($sports_accessories_custom_image_url_2): ?>
                                    <div class="image2">
                                        <img src="<?php echo esc_url($sports_accessories_custom_image_url_2); ?>" alt="<?php esc_attr_e('About Us Image  2', 'sports-accessories'); ?>">
                                    </div>
                                <?php endif; ?>

                                <?php if ($sports_accessories_custom_image_url_3): ?>
                                    <div class="image3">
                                        <img src="<?php echo esc_url($sports_accessories_custom_image_url_3); ?>" alt="<?php esc_attr_e('About Us Image  3', 'sports-accessories'); ?>">
                                    </div>
                                <?php endif; ?>
                            </div>
                            <?php
                                // If no custom image URLs are set, display the post's featured image
                                if (
                                    empty($sports_accessories_custom_image_url_1) &&
                                    empty($sports_accessories_custom_image_url_2) &&
                                    empty($sports_accessories_custom_image_url_3) &&
                                    has_post_thumbnail()
                                ) {
                                    the_post_thumbnail('full');
                                }
                            ?>
                        </div>
                        <div class="about-caption">
                            <h1 class="about-caption-title">
                                <a href="<?php the_permalink(); ?>">
                                    <?php the_title(); ?>
                                </a>
                            </h1>
                            <div class="caption-description">
                                <p>
                                    <?php echo wp_kses_post( wp_trim_words( get_the_content(), 50 ) ); ?>
                                </p>
                            </div>
                            <?php if ( ! empty( $sports_accessories_button_label ) ) { ?>
                                <div class="about-slider-btn">
                                    <a href="<?php echo esc_url( $sports_accessories_button_link ); ?>" class="asterthemes-button"><?php echo esc_html( $sports_accessories_button_label ); ?><i class="fas fa-arrow-right"></i></a>
                                </div>
                            <?php } ?>
                        </div>
                    </div>
                    <?php
                endwhile;
                wp_reset_postdata();
            endif;
            ?>
        </div>
    </section>

    <?php
}
?>