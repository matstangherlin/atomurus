/*
 * Native plugin proxies for the Android shell.
 *
 * The Capacitor native bridge exposes `window.Capacitor` but no plugin
 * objects; @capacitor/core's registerPlugin() builds the proxies that talk to
 * the native side. This module is loaded with a dynamic import() only when the
 * app runs inside the native shell, so the web bundle never pays for it.
 *
 * Plugins (Android implementations):
 *   App, Network, Browser   @capacitor/app, @capacitor/network, @capacitor/browser
 *   AtomurusSecureStorage   android/app/src/main/java/com/atomurus/app/AtomurusSecureStoragePlugin.java
 */

import { Capacitor, registerPlugin } from '@capacitor/core';

export function loadNativePlugins() {
  const available = (name) => Capacitor.isPluginAvailable(name);
  return {
    bridge: {
      Capacitor,
      App: available('App') ? registerPlugin('App') : null,
      Network: available('Network') ? registerPlugin('Network') : null,
      Browser: available('Browser') ? registerPlugin('Browser') : null
    },
    securePlugin: available('AtomurusSecureStorage') ? registerPlugin('AtomurusSecureStorage') : null
  };
}
