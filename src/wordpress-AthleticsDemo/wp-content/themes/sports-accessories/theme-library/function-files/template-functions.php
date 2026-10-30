<?php
/**
 * Functions which enhance the theme by hooking into WordPress
 *
 * @package sports_accessories
 */

function sports_accessories_body_classes( $sports_accessories_classes ) {
	// Adds a class of hfeed to non-singular pages.
	if ( ! is_singular() ) {
		$sports_accessories_classes[] = 'hfeed';
	}

	// Adds a class of no-sidebar when there is no sidebar present.
	if ( ! is_active_sidebar( 'sidebar-1' ) ) {
		$sports_accessories_classes[] = 'no-sidebar';
	}

	$sports_accessories_classes[] = sports_accessories_sidebar_layout();

	return $sports_accessories_classes;
}
add_filter( 'body_class', 'sports_accessories_body_classes' );

/**
 * Add a pingback url auto-discovery header for single posts, pages, or attachments.
 */
function sports_accessories_pingback_header() {
	if ( is_singular() && pings_open() ) {
		printf( '<link rel="pingback" href="%s">', esc_url( get_bloginfo( 'pingback_url' ) ) );
	}
}
add_action( 'wp_head', 'sports_accessories_pingback_header' );


/**
 * Get all posts for customizer Post content type.
 */
function sports_accessories_get_post_choices() {
	$sports_accessories_choices = array( '' => esc_html__( '--Select--', 'sports-accessories' ) );
	$sports_accessories_args    = array( 'numberposts' => -1 );
	$sports_accessories_posts   = get_posts( $sports_accessories_args );

	foreach ( $sports_accessories_posts as $sports_accessories_post ) {
		$sports_accessories_id             = $sports_accessories_post->ID;
		$sports_accessories_title          = $sports_accessories_post->post_title;
		$sports_accessories_choices[ $sports_accessories_id ] = $sports_accessories_title;
	}

	return $sports_accessories_choices;
}

/**
 * Get all pages for customizer Page content type.
 */
function sports_accessories_get_page_choices() {
	$sports_accessories_choices = array( '' => esc_html__( '--Select--', 'sports-accessories' ) );
	$sports_accessories_pages   = get_pages();

	foreach ( $sports_accessories_pages as $sports_accessories_page ) {
		$sports_accessories_choices[ $sports_accessories_page->ID ] = $sports_accessories_page->post_title;
	}

	return $sports_accessories_choices;
}

/**
 * Get all categories for customizer Category content type.
 */
function sports_accessories_get_post_cat_choices() {
	$sports_accessories_choices = array( '' => esc_html__( '--Select--', 'sports-accessories' ) );
	$sports_accessories_cats    = get_categories();

	foreach ( $sports_accessories_cats as $sports_accessories_cat ) {
		$sports_accessories_choices[ $sports_accessories_cat->term_id ] = $sports_accessories_cat->name;
	}

	return $sports_accessories_choices;
}

/**
 * Get all donation forms for customizer form content type.
 */
function sports_accessories_get_post_donation_form_choices() {
	$sports_accessories_choices = array( '' => esc_html__( '--Select--', 'sports-accessories' ) );
	$sports_accessories_posts   = get_posts(
		array(
			'post_type'   => 'give_forms',
			'numberposts' => -1,
		)
	);
	foreach ( $sports_accessories_posts as $sports_accessories_post ) {
		$sports_accessories_choices[ $sports_accessories_post->ID ] = $sports_accessories_post->post_title;
	}
	return $sports_accessories_choices;
}

if ( ! function_exists( 'sports_accessories_excerpt_length' ) ) :
	/**
	 * Excerpt length.
	 */
	function sports_accessories_excerpt_length( $sports_accessories_length ) {
		if ( is_admin() ) {
			return $sports_accessories_length;
		}

		return get_theme_mod( 'sports_accessories_excerpt_length', 20 );
	}
endif;
add_filter( 'excerpt_length', 'sports_accessories_excerpt_length', 999 );

if ( ! function_exists( 'sports_accessories_excerpt_more' ) ) :
	/**
	 * Excerpt more.
	 */
	function sports_accessories_excerpt_more( $sports_accessories_more ) {
		if ( is_admin() ) {
			return $sports_accessories_more;
		}

		return '&hellip;';
	}
endif;
add_filter( 'excerpt_more', 'sports_accessories_excerpt_more' );

if ( ! function_exists( 'sports_accessories_sidebar_layout' ) ) {
	/**
	 * Get sidebar layout.
	 */
	function sports_accessories_sidebar_layout() {
		$sports_accessories_sidebar_position      = get_theme_mod( 'sports_accessories_sidebar_position', 'right-sidebar' );
		$sports_accessories_sidebar_position_post = get_theme_mod( 'sports_accessories_post_sidebar_position', 'right-sidebar' );
		$sports_accessories_sidebar_position_page = get_theme_mod( 'sports_accessories_page_sidebar_position', 'right-sidebar' );

		if ( is_home() ) {
			$sports_accessories_sidebar_position = $sports_accessories_sidebar_position_post;
		} elseif ( is_page() ) {
			$sports_accessories_sidebar_position = $sports_accessories_sidebar_position_page;
		}

		return $sports_accessories_sidebar_position;
	}
}

if ( ! function_exists( 'sports_accessories_is_sidebar_enabled' ) ) {
	/**
	 * Check if sidebar is enabled.
	 */
	function sports_accessories_is_sidebar_enabled() {
		$sports_accessories_sidebar_position      = get_theme_mod( 'sports_accessories_sidebar_position', 'right-sidebar' );
		$sports_accessories_sidebar_position_post = get_theme_mod( 'sports_accessories_post_sidebar_position', 'right-sidebar' );
		$sports_accessories_sidebar_position_page = get_theme_mod( 'sports_accessories_page_sidebar_position', 'right-sidebar' );

		$sports_accessories_sidebar_enabled = true;
		if ( is_single() || is_archive() || is_search() ) {
			if ( 'no-sidebar' === $sports_accessories_sidebar_position ) {
				$sports_accessories_sidebar_enabled = false;
			}
		} elseif ( is_home() ) {
			if ( 'no-sidebar' === $sports_accessories_sidebar_position || 'no-sidebar' === $sports_accessories_sidebar_position_post ) {
				$sports_accessories_sidebar_enabled = false;
			}
		} elseif ( is_page() ) {
			if ( 'no-sidebar' === $sports_accessories_sidebar_position || 'no-sidebar' === $sports_accessories_sidebar_position_page ) {
				$sports_accessories_sidebar_enabled = false;
			}
		}
		return $sports_accessories_sidebar_enabled;
	}
}

if ( ! function_exists( 'sports_accessories_get_homepage_sections ' ) ) {
	/**
	 * Returns homepage sections.
	 */
	function sports_accessories_get_homepage_sections() {
		$sports_accessories_sections = array(
			'banner'  => esc_html__( 'Banner Section', 'sports-accessories' ),
			'about' => esc_html__( 'Product Section', 'sports-accessories' ),
		);
		return $sports_accessories_sections;
	}
}

/**
 * Renders customizer section link
 */
function sports_accessories_section_link( $sports_accessories_section_id ) {
	$sports_accessories_section_name      = str_replace( 'sports_accessories_', ' ', $sports_accessories_section_id );
	$sports_accessories_section_name      = str_replace( '_', ' ', $sports_accessories_section_name );
	$sports_accessories_starting_notation = '#';
	?>
	<span class="section-link">
		<span class="section-link-title"><?php echo esc_html( $sports_accessories_section_name ); ?></span>
	</span>
	<style type="text/css">
		<?php echo $sports_accessories_starting_notation . $sports_accessories_section_id; // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped ?>:hover .section-link {
			visibility: visible;
		}
	</style>
	<?php
}

/**
 * Adds customizer section link css
 */
function sports_accessories_section_link_css() {
	if ( is_customize_preview() ) {
		?>
		<style type="text/css">
			.section-link {
				visibility: hidden;
				background-color: black;
				position: relative;
				top: 80px;
				z-index: 99;
				left: 40px;
				color: #fff;
				text-align: center;
				font-size: 20px;
				border-radius: 10px;
				padding: 20px 10px;
				text-transform: capitalize;
			}

			.section-link-title {
				padding: 0 10px;
			}

			.banner-section {
				position: relative;
			}

			.banner-section .section-link {
				position: absolute;
				top: 100px;
			}
		</style>
		<?php
	}
}
add_action( 'wp_head', 'sports_accessories_section_link_css' );

/**
 * Breadcrumb.
 */
function sports_accessories_breadcrumb( $sports_accessories_args = array() ) {
	if ( ! get_theme_mod( 'sports_accessories_enable_breadcrumb', true ) ) {
		return;
	}

	$sports_accessories_args = array(
		'show_on_front' => false,
		'show_title'    => true,
		'show_browse'   => false,
	);
	breadcrumb_trail( $sports_accessories_args );
}
add_action( 'sports_accessories_breadcrumb', 'sports_accessories_breadcrumb', 10 );

/**
 * Add separator for breadcrumb trail.
 */
function sports_accessories_breadcrumb_trail_print_styles() {
	$sports_accessories_breadcrumb_separator = get_theme_mod( 'sports_accessories_breadcrumb_separator', '/' );

	$sports_accessories_style = '
		.trail-items li::after {
			content: "' . $sports_accessories_breadcrumb_separator . '";
		}'; // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped

	$sports_accessories_style = apply_filters( 'sports_accessories_breadcrumb_trail_inline_style', trim( str_replace( array( "\r", "\n", "\t", '  ' ), '', $sports_accessories_style ) ) );

	if ( $sports_accessories_style ) {
		echo "\n" . '<style type="text/css" id="breadcrumb-trail-css">' . $sports_accessories_style . '</style>' . "\n"; // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped
	}
}
add_action( 'wp_head', 'sports_accessories_breadcrumb_trail_print_styles' );

/**
 * Pagination for archive.
 */
function sports_accessories_render_posts_pagination() {
	$sports_accessories_is_pagination_enabled = get_theme_mod( 'sports_accessories_enable_pagination', true );
	if ( $sports_accessories_is_pagination_enabled ) {
		$sports_accessories_pagination_type = get_theme_mod( 'sports_accessories_pagination_type', 'default' );
		if ( 'default' === $sports_accessories_pagination_type ) :
			the_posts_navigation();
		else :
			the_posts_pagination();
		endif;
	}
}
add_action( 'sports_accessories_posts_pagination', 'sports_accessories_render_posts_pagination', 10 );

/**
 * Pagination for single post.
 */
function sports_accessories_render_post_navigation() {
	the_post_navigation(
		array(
			'prev_text' => '<span>&#10229;</span> <span class="nav-title">%title</span>',
			'next_text' => '<span class="nav-title">%title</span> <span>&#10230;</span>',
		)
	);
}
add_action( 'sports_accessories_post_navigation', 'sports_accessories_render_post_navigation' );

/**
 * Adds footer copyright text.
 */

function sports_accessories_output_footer_copyright_content() {
    $sports_accessories_theme_data = wp_get_theme();
    $sports_accessories_copyright_text = get_theme_mod('sports_accessories_footer_copyright_text');

    if (!empty($sports_accessories_copyright_text)) {
        $sports_accessories_text = $sports_accessories_copyright_text;
    } else {
		$sports_accessories_default_text = '<a href="'. esc_url(__('https://asterthemes.com/products/sports-accessories','sports-accessories')) . '" target="_blank"> ' . esc_html($sports_accessories_theme_data->get('Name')) . '</a>' . '&nbsp;' . esc_html__('by', 'sports-accessories') . '&nbsp;<a target="_blank" href="' . esc_url($sports_accessories_theme_data->get('AuthorURI')) . '">' . esc_html(ucwords($sports_accessories_theme_data->get('Author'))) . '</a>';
		/* translators: %s: WordPress.org URL */
        $sports_accessories_default_text .= sprintf(esc_html__(' | Powered by %s', 'sports-accessories'), '<a href="' . esc_url(__('https://wordpress.org/', 'sports-accessories')) . '" target="_blank">WordPress</a>. ');

        $sports_accessories_text = $sports_accessories_default_text;
    }
    ?>
    <span><?php echo wp_kses_post($sports_accessories_text); ?></span>
    <?php
}
add_action('sports_accessories_footer_copyright', 'sports_accessories_output_footer_copyright_content');

/* Footer Social Icons */ 
function sports_accessories_footer_social_links() {

    if ( get_theme_mod('sports_accessories_enable_footer_icon_section', true) ) {

            ?>
            <div class="socialicons">
				<div class="asterthemes-wrapper">
					<?php if ( get_theme_mod('sports_accessories_footer_facebook_link', 'https://www.facebook.com/') != '' ) { ?>
						<a target="_blank" href="<?php echo esc_url(get_theme_mod('sports_accessories_footer_facebook_link', 'https://www.facebook.com/')); ?>">
							<i class="<?php echo esc_attr(get_theme_mod('sports_accessories_facebook_icon', 'fab fa-facebook-f')); ?>"></i>
							<span class="screen-reader-text"><?php esc_html_e('Facebook', 'sports-accessories'); ?></span>
						</a>
					<?php } ?>
					<?php if ( get_theme_mod('sports_accessories_footer_twitter_link', 'https://x.com/') != '' ) { ?>
						<a target="_blank" href="<?php echo esc_url(get_theme_mod('sports_accessories_footer_twitter_link', 'https://x.com/')); ?>">
							<i class="<?php echo esc_attr(get_theme_mod('sports_accessories_twitter_icon', 'fab fa-twitter')); ?>"></i>
							<span class="screen-reader-text"><?php esc_html_e('Twitter', 'sports-accessories'); ?></span>
						</a>
					<?php } ?>
					<?php if ( get_theme_mod('sports_accessories_footer_instagram_link', 'https://www.instagram.com/') != '' ) { ?>
						<a target="_blank" href="<?php echo esc_url(get_theme_mod('sports_accessories_footer_instagram_link', 'https://www.instagram.com/')); ?>">
							<i class="<?php echo esc_attr(get_theme_mod('sports_accessories_instagram_icon', 'fab fa-instagram')); ?>"></i>
							<span class="screen-reader-text"><?php esc_html_e('Instagram', 'sports-accessories'); ?></span>
						</a>
					<?php } ?>
					<?php if ( get_theme_mod('sports_accessories_footer_linkedin_link', 'https://in.linkedin.com/') != '' ) { ?>
						<a target="_blank" href="<?php echo esc_url(get_theme_mod('sports_accessories_footer_linkedin_link', 'https://in.linkedin.com/')); ?>">
							<i class="<?php echo esc_attr(get_theme_mod('sports_accessories_linkedin_icon', 'fab fa-linkedin')); ?>"></i>
							<span class="screen-reader-text"><?php esc_html_e('Linkedin', 'sports-accessories'); ?></span>
						</a>
					<?php } ?>
					<?php if ( get_theme_mod('sports_accessories_footer_youtube_link', 'https://www.youtube.com/') != '' ) { ?>
						<a target="_blank" href="<?php echo esc_url(get_theme_mod('sports_accessories_footer_youtube_link', 'https://www.youtube.com/')); ?>">
							<i class="<?php echo esc_attr(get_theme_mod('sports_accessories_youtube_icon', 'fab fa-youtube')); ?>"></i>
							<span class="screen-reader-text"><?php esc_html_e('Youtube', 'sports-accessories'); ?></span>
						</a>
					<?php } ?>
				</div>
            </div>
            <?php
    }
}
add_action('wp_footer', 'sports_accessories_footer_social_links');

if ( ! function_exists( 'sports_accessories_footer_widget' ) ) :
	function sports_accessories_footer_widget() {
		$sports_accessories_footer_widget_column = get_theme_mod('sports_accessories_footer_widget_column','4');

		$sports_accessories_column_class = '';
		if ($sports_accessories_footer_widget_column == '1') {
			$sports_accessories_column_class = 'one-column';
		} elseif ($sports_accessories_footer_widget_column == '2') {
			$sports_accessories_column_class = 'two-columns';
		} elseif ($sports_accessories_footer_widget_column == '3') {
			$sports_accessories_column_class = 'three-columns';
		} else {
			$sports_accessories_column_class = 'four-columns';
		}
	
		if($sports_accessories_footer_widget_column !== ''): 
		?>
		<div class="dt_footer-widgets <?php echo esc_attr($sports_accessories_column_class); ?> wow bounceInUp delay-1000" data-wow-duration="2s">
			<div class="footer-widgets-column">
				<?php
				$footer_widgets_active = false;

				// Loop to check if any footer widget is active
				for ($sports_accessories_i = 1; $sports_accessories_i <= $sports_accessories_footer_widget_column; $sports_accessories_i++) {
					if (is_active_sidebar('sports-accessories-footer-widget-' . $sports_accessories_i)) {
						$footer_widgets_active = true;
						break;
					}
				}

				if ($footer_widgets_active) {
					// Display active footer widgets
					for ($sports_accessories_i = 1; $sports_accessories_i <= $sports_accessories_footer_widget_column; $sports_accessories_i++) {
						if (is_active_sidebar('sports-accessories-footer-widget-' . $sports_accessories_i)) : ?>
							<div class="footer-one-column">
								<?php dynamic_sidebar('sports-accessories-footer-widget-' . $sports_accessories_i); ?>
							</div>
						<?php endif;
					}
				} else {
				?>
				<div class="footer-one-column default-widgets">
					<aside id="search-2" class="widget widget_search default_footer_search">
						<div class="widget-header">
							<h4 class="widget-title"><?php esc_html_e('Search Here', 'sports-accessories'); ?></h4>
						</div>
						<?php get_search_form(); ?>
					</aside>
				</div>
				<div class="footer-one-column default-widgets">
					<aside id="recent-posts-2" class="widget widget_recent_entries">
						<h2 class="widget-title"><?php esc_html_e('Recent Posts', 'sports-accessories'); ?></h2>
						<ul>
							<?php
							$recent_posts = wp_get_recent_posts(array(
								'numberposts' => 5,
								'post_status' => 'publish',
							));
							foreach ($recent_posts as $post) {
								echo '<li><a href="' . esc_url(get_permalink($post['ID'])) . '">' . esc_html($post['post_title']) . '</a></li>';
							}
							wp_reset_query();
							?>
						</ul>
					</aside>
				</div>
				<div class="footer-one-column default-widgets">
					<aside id="recent-comments-2" class="widget widget_recent_comments">
						<h2 class="widget-title"><?php esc_html_e('Recent Comments', 'sports-accessories'); ?></h2>
						<ul>
							<?php
							$recent_comments = get_comments(array(
								'number' => 5,
								'status' => 'approve',
							));
							foreach ($recent_comments as $comment) {
								echo '<li><a href="' . esc_url(get_comment_link($comment)) . '">' .
									/* translators: %s: details. */
									sprintf(esc_html__('Comment on %s', 'sports-accessories'), get_the_title($comment->comment_post_ID)) .
									'</a></li>';
							}
							?>
						</ul>
					</aside>
				</div>
				<div class="footer-one-column default-widgets">
					<aside id="calendar-2" class="widget widget_calendar">
						<h2 class="widget-title"><?php esc_html_e('Calendar', 'sports-accessories'); ?></h2>
						<?php get_calendar(); ?>
					</aside>
				</div>
			</div>
			<?php } ?>
		</div>
		<?php
		endif;
	}
	endif;
add_action( 'sports_accessories_footer_widget', 'sports_accessories_footer_widget' );


function sports_accessories_footer_text_transform_css() {
    $sports_accessories_footer_text_transform = get_theme_mod('footer_text_transform', 'none');
    ?>
    <style type="text/css">
        .site-footer h4,footer#colophon h2.wp-block-heading,footer#colophon .widgettitle,footer#colophon .widget-title {
            text-transform: <?php echo esc_html($sports_accessories_footer_text_transform); ?>;
        }
    </style>
    <?php
}
add_action('wp_head', 'sports_accessories_footer_text_transform_css');

/**
 * GET START FUNCTION
 */

 function sports_accessories_getpage_css($hook) {
	wp_enqueue_script( 'sports-accessories-admin-script', get_template_directory_uri() . '/resource/js/sports-accessories-admin-notice-script.js', array( 'jquery' ) );
    wp_localize_script( 'sports-accessories-admin-script', 'sports_accessories_ajax_object',
        array( 'ajax_url' => admin_url( 'admin-ajax.php' ) )
    );
    wp_enqueue_style( 'sports-accessories-notice-style', get_template_directory_uri() . '/resource/css/notice.css' );
}

add_action( 'admin_enqueue_scripts', 'sports_accessories_getpage_css' );


add_action('wp_ajax_sports_accessories_dismissable_notice', 'sports_accessories_dismissable_notice');
function sports_accessories_switch_theme() {
    delete_user_meta(get_current_user_id(), 'sports_accessories_dismissable_notice');
}
add_action('after_switch_theme', 'sports_accessories_switch_theme');
function sports_accessories_dismissable_notice() {
    update_user_meta(get_current_user_id(), 'sports_accessories_dismissable_notice', true);
    die();
}

function sports_accessories_deprecated_hook_admin_notice() {
    global $pagenow;
    
    // Check if the current page is the one where you don't want the notice to appear
    if ( $pagenow === 'themes.php' && isset( $_GET['page'] ) && $_GET['page'] === 'sports-accessories-getting-started' ) {
        return;
    }

    $sports_accessories_dismissed = get_user_meta( get_current_user_id(), 'sports_accessories_dismissable_notice', true );
    if ( !$sports_accessories_dismissed) { ?>
        <div class="getstrat updated notice notice-success is-dismissible notice-get-started-class">
            <div class="at-admin-content" >
                <h2><?php esc_html_e('Welcome to Sports Accessories', 'sports-accessories'); ?></h2>
                <p><?php _e('Explore the features of our Pro Theme and take your Sports Accessories journey to the next level.', 'sports-accessories'); ?></p>
                <p ><?php _e('Get Started With Theme By Clicking On Getting Started.', 'sports-accessories'); ?><p>
                <div style="display: flex; justify-content: center; align-items:center; flex-wrap: wrap; gap: 5px">
                    <a class="admin-notice-btn button button-primary button-hero" href="<?php echo esc_url( admin_url( 'themes.php?page=sports-accessories-getting-started' )); ?>"><?php esc_html_e( 'Get started', 'sports-accessories' ) ?></a>
                    <a  class="admin-notice-btn button button-primary button-hero" target="_blank" href="https://demo.asterthemes.com/sports-accessories/"><?php esc_html_e('View Demo', 'sports-accessories') ?></a>
                    <a  class="admin-notice-btn button button-primary button-hero" target="_blank" href="https://asterthemes.com/products/sports-store-wordpress-theme"><?php esc_html_e('Buy Now', 'sports-accessories') ?></a>
                    <a  class="admin-notice-btn button button-primary button-hero" target="_blank" href="<?php echo esc_url( SPORTS_ACCESSORIES_BUNDLE_PAGE ); ?>"><?php esc_html_e('Get Bundle', 'sports-accessories') ?></a>
                </div>
            </div>
            <div class="at-admin-image">
                <img style="width: 100%;max-width: 320px;line-height: 40px;display: inline-block;vertical-align: top;border: 2px solid #ddd;border-radius: 4px;" src="<?php echo esc_url(get_stylesheet_directory_uri()) .'/screenshot.png'; ?>" />
            </div>
        </div>
    <?php }
}

add_action( 'admin_notices', 'sports_accessories_deprecated_hook_admin_notice' );


//Admin Notice For Getstart
function sports_accessories_ajax_notice_handler() {
    if ( isset( $_POST['type'] ) ) {
        $type = sanitize_text_field( wp_unslash( $_POST['type'] ) );
        update_option( 'dismissed-' . $type, TRUE );
    }
}