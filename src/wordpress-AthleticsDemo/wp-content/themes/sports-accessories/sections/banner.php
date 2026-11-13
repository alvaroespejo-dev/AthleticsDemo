<?php
if ( ! get_theme_mod( 'sports_accessories_enable_banner_section', false ) ) {
	return;
}

$sports_accessories_slider_content_ids  = array();
$sports_accessories_slider_content_type = get_theme_mod( 'sports_accessories_banner_slider_content_type', 'post' );

for ( $sports_accessories_i = 1; $sports_accessories_i <= 3; $sports_accessories_i++ ) {
	$sports_accessories_slider_content_ids[] = get_theme_mod( 'sports_accessories_banner_slider_content_' . $sports_accessories_slider_content_type . '_' . $sports_accessories_i );
}
// Get the category for the banner slider from theme mods or a default category
$sports_accessories_banner_slider_category = get_theme_mod('sports_accessories_banner_slider_category', 'slider');

// Modify query to fetch posts from a specific category
$sports_accessories_banner_slider_args = array(
    'post_type'           => $sports_accessories_slider_content_type,
    'post__in'            => array_filter( $sports_accessories_slider_content_ids ),
    'orderby'             => 'post__in',
    'posts_per_page'      => absint(3),
    'ignore_sticky_posts' => true,
);

// Apply category filter only if content type is 'post'
if ( 'post' === $sports_accessories_slider_content_type && ! empty( $sports_accessories_banner_slider_category ) ) {
    $sports_accessories_banner_slider_args['category_name'] = $sports_accessories_banner_slider_category;
}
$sports_accessories_banner_slider_args = apply_filters( 'sports_accessories_banner_section_args', $sports_accessories_banner_slider_args );

sports_accessories_render_banner_section( $sports_accessories_banner_slider_args );

/**
 * Render Banner Section.
 */
function sports_accessories_render_banner_section( $sports_accessories_banner_slider_args ) {     ?>

	<section id="sports_accessories_banner_section" class="banner-section banner-style-1">
		<?php
		if ( is_customize_preview() ) :
			sports_accessories_section_link( 'sports_accessories_banner_section' );
		endif;
		?>
		<div class="banner-section-wrapper">
			<?php
			$sports_accessories_query = new WP_Query( $sports_accessories_banner_slider_args );
			if ( $sports_accessories_query->have_posts() ) :
				?>
				<div class="asterthemes-banner-wrapper banner-slider sports-accessories-carousel-navigation" data-slick='{"autoplay": false }'>
					<?php 
					$sports_accessories_i = 1;
					while ( $sports_accessories_query->have_posts() ) :
						$sports_accessories_query->the_post();
						$sports_accessories_button_label = get_theme_mod( 'sports_accessories_banner_button_label_' . $sports_accessories_i);
						$sports_accessories_button_link  = get_theme_mod( 'sports_accessories_banner_button_link_' . $sports_accessories_i);
						$sports_accessories_banner_short_heading = get_theme_mod( 'sports_accessories_banner_short_heading' . $sports_accessories_i);
						$sports_accessories_button_link  = ! empty( $sports_accessories_button_link ) ? $sports_accessories_button_link : get_the_permalink();
						$sports_accessories_default_image_url_head = get_theme_mod('sports_accessories_about_left_image_1'. $sports_accessories_i);
						?>
						<div class="banner-single-outer">
							<div class="banner-single">
								<div class="banner-main-image">
									<div class="banner-left">
									<div class="sports-accessories-banner-left-image">
										<div class="banner-left-image">
											<?php if ( ! empty( $sports_accessories_default_image_url_head ) ) { ?>
												<img src="<?php echo esc_url( $sports_accessories_default_image_url_head ); ?>" alt="<?php esc_attr_e('Masked Image', 'sports-accessories'); ?>" class="banner-vector-image">
											<?php } ?>
											<img src="<?php echo esc_url( get_stylesheet_directory_uri() . '/resource/img/Vector.png' ); ?>" alt="<?php esc_attr_e('Decorative Border', 'sports-accessories'); ?>" class="banner-border-image">
										</div>
									</div>

									</div>
									<div class="banner-img">
										<?php the_post_thumbnail( 'full' ); ?>
									</div>								
								</div>
								<div class="banner-caption">
									<div class="banner-catption-wrapper wow fadeInUp" data-wow-duration="1.5s">
										<h1 class="banner-caption-title">
											<a href="<?php the_permalink(); ?>">
						                        <?php the_title(); ?>
						                    </a>
										</h1>
										<?php if ( ! empty( $sports_accessories_banner_short_heading ) ) { ?>
											<h4><?php echo esc_html( $sports_accessories_banner_short_heading ); ?></h4>
										<?php } ?>
										<?php if ( ! empty( $sports_accessories_button_label ) ) { ?>
											<div class="banner-slider-btn">
												<a href="<?php echo esc_url( $sports_accessories_button_link ); ?>" class="asterthemes-button"><?php echo esc_html( $sports_accessories_button_label ); ?></a>
											</div>
										<?php } ?>
										<?php if ( get_theme_mod( 'sports_accessories_enable_social', true ) === true ) { ?>
											<div class="socail-search">
												<div class="social-icons">
													<?php
													if ( has_nav_menu( 'social' ) ) {
														wp_nav_menu(
															array(
																'menu_class'     => 'menu social-links',
																'link_before'    => '<span class="screen-reader-text">',
																'link_after'     => '</span>',
																'theme_location' => 'social',
															)
														);
													}
													?>
												</div>
											</div>
										<?php } ?>
									</div>
								</div>
							</div>
						</div>
						<?php
						$sports_accessories_i++;
					endwhile;
					wp_reset_postdata();
					?>
				</div>
				<?php
			endif;
			?>
		</div>
	</section>

	<?php
}