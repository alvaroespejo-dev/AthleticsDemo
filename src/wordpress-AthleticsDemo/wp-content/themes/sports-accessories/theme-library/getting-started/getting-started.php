<?php
/**
 * Getting Started Page.
 *
 * @package sports_accessories
 */


if( ! function_exists( 'sports_accessories_getting_started_menu' ) ) :
/**
 * Adding Getting Started Page in admin menu
 */
function sports_accessories_getting_started_menu(){	
	add_theme_page(
		__( 'Getting Started', 'sports-accessories' ),
		__( 'Getting Started', 'sports-accessories' ),
		'manage_options',
		'sports-accessories-getting-started',
		'sports_accessories_getting_started_page'
	);
}
endif;
add_action( 'admin_menu', 'sports_accessories_getting_started_menu' );

if( ! function_exists( 'sports_accessories_getting_started_admin_scripts' ) ) :
/**
 * Load Getting Started styles in the admin
 */
function sports_accessories_getting_started_admin_scripts( $hook ){
	// Load styles only on our page
	if( 'appearance_page_sports-accessories-getting-started' != $hook ) return;

    wp_enqueue_style( 'sports-accessories-getting-started', get_template_directory_uri() . '/resource/css/getting-started.css', false, SPORTS_ACCESSORIES_THEME_VERSION );

    wp_enqueue_script( 'sports-accessories-getting-started', get_template_directory_uri() . '/resource/js/getting-started.js', array( 'jquery' ), SPORTS_ACCESSORIES_THEME_VERSION, true );
}
endif;
add_action( 'admin_enqueue_scripts', 'sports_accessories_getting_started_admin_scripts' );

if( ! function_exists( 'sports_accessories_getting_started_page' ) ) :
/**
 * Callback function for admin page.
*/
function sports_accessories_getting_started_page(){ 
	$sports_accessories_theme = wp_get_theme();?>
	<div class="wrap getting-started container">
		<div class="getting-info">
			<div class="theme-intro">
				<div class="intro-wrap">
					<div class="intro cointaner">
						<div class="intro-content">
							<h3><?php echo esc_html( 'Welcome to', 'sports-accessories' );?> <span class="theme-name"><?php echo esc_html( SPORTS_ACCESSORIES_THEME_NAME ); ?></span></h3>
							<p class="about-text">
								<?php
								// Remove last sentence of description.
								$sports_accessories_description = explode( '. ', $sports_accessories_theme->get( 'Description' ) );

								$sports_accessories_description = implode( '. ', $sports_accessories_description );

								echo esc_html( $sports_accessories_description . '' );
							?></p>
							<div class="btns-getstart">
								<a href="<?php echo esc_url( SPORTS_ACCESSORIES_PREMIUM_PAGE ); ?>" target="_blank" class="button button-primary"><?php esc_html_e( 'Get Premium', 'sports-accessories' ); ?></a>
								<a href="<?php echo esc_url( SPORTS_ACCESSORIES_PRO_DEMO ); ?>" target="_blank" class="button button-primary"><?php esc_html_e( 'Live Demo', 'sports-accessories' ); ?></a>
								<a href="<?php echo esc_url( admin_url( 'customize.php' ) ); ?>" target="_blank" class="button button-primary"><?php esc_html_e( 'Customize Theme', 'sports-accessories' ); ?></a>
							</div>
							<?php
							$sports_accessories_demo_option = 'is-demo-imported-' . get_stylesheet();
							?>

							<div class="btns-wizard">
								<?php if ( ! get_option( $sports_accessories_demo_option ) ) : ?>
									<a href="<?php echo esc_url( admin_url( 'themes.php?page=sportsaccessories-wizard' ) ); ?>" class="button button-primary wizard">
										<?php esc_html_e( 'Import Theme Demo', 'sports-accessories' ); ?>
									</a>
								<?php else : ?>
									<a target="_blank" href="<?php echo esc_url( home_url() ); ?>" class="button button-primary view-site">
										<?php esc_html_e( 'Visit Your Website', 'sports-accessories' ); ?>
									</a>
								<?php endif; ?>
							</div>
						</div>
						<div class="intro-img">
							<img src="<?php echo esc_url(get_template_directory_uri()) .'/theme-library/getting-started/images/bundle.png'; ?>" />										
							<br>
							<h4 class="bundle-text"><?php esc_html_e( 'WP Theme Bundle', 'sports-accessories' ); ?></h4>
							<p class="about-text"><?php esc_html_e('Get access to a collection of premium WordPress themes in one bundle. Enjoy effortless website building, full customization, and dedicated customer support for a smooth, professional web experience.', 'sports-accessories'); ?></p>
							<a class="button button-primary" href="<?php echo esc_url( SPORTS_ACCESSORIES_BUNDLE_PAGE ); ?>" title="<?php esc_attr_e( 'Go Pro', 'sports-accessories' ); ?>" target="_blank">
								<?php esc_html_e( 'Exclusive Theme Bundle - $99', 'sports-accessories' ); ?>
							</a>
						</div>
					</div>
				</div>
				<div class="cointaner panels">
					<ul class="inline-list">
						<li class="current">
							<a id="help" href="javascript:void(0);">
								<?php esc_html_e( 'Getting Started', 'sports-accessories' ); ?>
							</a>
						</li>
						<li>
							<a id="free-pro-panel" href="javascript:void(0);">
								<?php esc_html_e( 'Free Vs Pro', 'sports-accessories' ); ?>
							</a>
						</li>
					</ul>
					<div id="panel" class="panel">
						<?php require get_template_directory() . '/theme-library/getting-started/tabs/help-panel.php'; ?>
						<?php require get_template_directory() . '/theme-library/getting-started/tabs/free-vs-pro-panel.php'; ?>
						<?php require get_template_directory() . '/theme-library/getting-started/tabs/link-panel.php'; ?>
					</div>
				</div>
			</div>
			<div class="icons-info">
				<div class="icon-img">									
					<a href="<?php echo esc_url( SPORTS_ACCESSORIES_REVIEW ); ?>" title="<?php esc_attr_e( 'Review Theme', 'sports-accessories' ); ?>" target="_blank">
						<img src="<?php echo esc_url(get_template_directory_uri()) .'/theme-library/getting-started/images/icon1.png'; ?>" />	
						<?php esc_html_e( 'Review Theme', 'sports-accessories' ); ?>
					</a>
				</div>
				<div class="icon-img">									
					<a href="<?php echo esc_url( SPORTS_ACCESSORIES_SUPPORT ); ?>" title="<?php esc_attr_e( 'Contact Support', 'sports-accessories' ); ?>" target="_blank">
						<img src="<?php echo esc_url(get_template_directory_uri()) .'/theme-library/getting-started/images/icon2.png'; ?>" />	
						<?php esc_html_e( 'Contact Support', 'sports-accessories' ); ?>
					</a>
				</div>
				<div class="icon-img">									
					<a href="<?php echo esc_url( SPORTS_ACCESSORIES_THEME_DOCUMENTATION ); ?>" title="<?php esc_attr_e( 'Free Theme Documentation', 'sports-accessories' ); ?>" target="_blank">
						<img src="<?php echo esc_url(get_template_directory_uri()) .'/theme-library/getting-started/images/icon3.png'; ?>" />	
						<?php esc_html_e( 'Free Theme Documentation', 'sports-accessories' ); ?>
					</a>
				</div>
			</div>	
		</div>	
	</div>
	<?php
}
endif;