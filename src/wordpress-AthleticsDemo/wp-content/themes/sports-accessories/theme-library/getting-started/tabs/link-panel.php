<?php
/**
 * Right Buttons Panel.
 *
 * @package sports_accessories
 */
?>
<div class="panel-right">
	<div class="pro-btn theme-btn">
		<div class="screenshot">
			<img src="<?php echo esc_url(get_template_directory_uri()) .'/theme-library/getting-started/images/pro-screenshot.png'; ?>" />
		</div>
		<br>
		<div class="theme-info">
			<h3><?php esc_html_e( 'Sports Store WordPress Theme', 'sports-accessories' ); ?></h3>
			<div class="theme-price">
				<span class="price-text"><?php esc_html_e( 'Price:', 'sports-accessories' ); ?></h6>
				<del><?php esc_html_e( '$49', 'sports-accessories' ); ?></del>
				<span><?php esc_html_e( '$39', 'sports-accessories' ); ?></span>
			</div>
			<div class="panelbutton">
				<a class="button button-primary" href="<?php echo esc_url( SPORTS_ACCESSORIES_PREMIUM_PAGE ); ?>" title="<?php esc_attr_e( 'Go Pro', 'sports-accessories' ); ?>" target="_blank"><?php esc_html_e( 'Try Premium', 'sports-accessories' ); ?></a>

				<a class="button button-primary" href="<?php echo esc_url( SPORTS_ACCESSORIES_PRO_DEMO ); ?>" title="<?php esc_attr_e( 'Live Demo', 'sports-accessories' ); ?>" target="_blank"><?php esc_html_e( 'Live Demo', 'sports-accessories' ); ?></a>
			</div>
			<a class="button button-primary pro-doc" href="<?php echo esc_url( SPORTS_ACCESSORIES_PREMIUM_DOCUMENTATION ); ?>" title="<?php esc_attr_e( 'Pro Documentation', 'sports-accessories' ); ?>" target="_blank"><?php esc_html_e( 'Pro Documentation', 'sports-accessories' ); ?></a>
		</div>
	</div>
	<div class="pro-btn bundle-btn">
		<div class="bundle-img">
			<img src="<?php echo esc_url(get_template_directory_uri()) .'/theme-library/getting-started/images/bundle.png'; ?>" />
		</div>
		<br>
		<h3><?php esc_html_e( 'WP Theme Bundle', 'sports-accessories' ); ?></h3>
		<p><?php esc_html_e( 'Get access to a collection of premium WordPress themes in one bundle. Enjoy effortless website building, full customization, and dedicated customer support for a smooth, professional web experience.', 'sports-accessories' ); ?></p>
		<a class="button button-primary" href="<?php echo esc_url( SPORTS_ACCESSORIES_BUNDLE_PAGE ); ?>" title="<?php esc_attr_e( 'Go Pro', 'sports-accessories' ); ?>" target="_blank">
            <?php esc_html_e( 'Exclusive Theme Bundle - $99', 'sports-accessories' ); ?>
        </a>
	</div>
</div>