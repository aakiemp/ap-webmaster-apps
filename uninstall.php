<?php
/**
 * Runs when the plugin is deleted from WordPress: remove its two options.
 *
 * @package APWebmaster\Apps
 */

defined( 'WP_UNINSTALL_PLUGIN' ) || exit;

delete_option( 'apwa_settings' );
delete_option( 'apwa_rules_version' );
