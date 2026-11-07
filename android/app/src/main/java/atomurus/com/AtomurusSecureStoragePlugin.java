package atomurus.com;

import android.content.Context;
import android.content.SharedPreferences;
import android.security.keystore.KeyGenParameterSpec;
import android.security.keystore.KeyProperties;
import android.util.Base64;
import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;
import java.nio.ByteBuffer;
import java.nio.charset.StandardCharsets;
import java.security.KeyStore;
import javax.crypto.Cipher;
import javax.crypto.KeyGenerator;
import javax.crypto.SecretKey;
import javax.crypto.spec.GCMParameterSpec;

/**
 * Secure storage for the app's auth tokens (src/adapters/capacitor/secure-storage-adapter.js).
 *
 * Values are encrypted with AES-256-GCM under a key that lives in the Android
 * Keystore and never leaves it; only ciphertext is written to a private
 * SharedPreferences file (excluded from backups, see AndroidManifest.xml).
 *
 * JS contract: get({ key }) -> { value | null }, set({ key, value }), remove({ key }).
 */
@CapacitorPlugin(name = "AtomurusSecureStorage")
public class AtomurusSecureStoragePlugin extends Plugin {

    private static final String KEYSTORE = "AndroidKeyStore";
    private static final String KEY_ALIAS = "atomurus_secure_storage_v1";
    private static final String PREFS = "atomurus_secure_storage";
    private static final String TRANSFORMATION = "AES/GCM/NoPadding";
    private static final int IV_BYTES = 12;
    private static final int TAG_BITS = 128;

    private SharedPreferences prefs() {
        return getContext().getSharedPreferences(PREFS, Context.MODE_PRIVATE);
    }

    private SecretKey secretKey() throws Exception {
        KeyStore keyStore = KeyStore.getInstance(KEYSTORE);
        keyStore.load(null);
        if (keyStore.containsAlias(KEY_ALIAS)) {
            return ((KeyStore.SecretKeyEntry) keyStore.getEntry(KEY_ALIAS, null)).getSecretKey();
        }
        KeyGenerator generator = KeyGenerator.getInstance(KeyProperties.KEY_ALGORITHM_AES, KEYSTORE);
        generator.init(
            new KeyGenParameterSpec.Builder(KEY_ALIAS, KeyProperties.PURPOSE_ENCRYPT | KeyProperties.PURPOSE_DECRYPT)
                .setBlockModes(KeyProperties.BLOCK_MODE_GCM)
                .setEncryptionPaddings(KeyProperties.ENCRYPTION_PADDING_NONE)
                .setKeySize(256)
                .build()
        );
        return generator.generateKey();
    }

    private String encrypt(String plain) throws Exception {
        Cipher cipher = Cipher.getInstance(TRANSFORMATION);
        cipher.init(Cipher.ENCRYPT_MODE, secretKey());
        byte[] iv = cipher.getIV();
        byte[] sealed = cipher.doFinal(plain.getBytes(StandardCharsets.UTF_8));
        ByteBuffer out = ByteBuffer.allocate(iv.length + sealed.length);
        out.put(iv).put(sealed);
        return Base64.encodeToString(out.array(), Base64.NO_WRAP);
    }

    private String decrypt(String stored) throws Exception {
        byte[] all = Base64.decode(stored, Base64.NO_WRAP);
        Cipher cipher = Cipher.getInstance(TRANSFORMATION);
        cipher.init(Cipher.DECRYPT_MODE, secretKey(), new GCMParameterSpec(TAG_BITS, all, 0, IV_BYTES));
        byte[] plain = cipher.doFinal(all, IV_BYTES, all.length - IV_BYTES);
        return new String(plain, StandardCharsets.UTF_8);
    }

    private static boolean validKey(String key) {
        return key != null && !key.isEmpty() && key.length() <= 128;
    }

    @PluginMethod
    public void get(PluginCall call) {
        String key = call.getString("key");
        if (!validKey(key)) {
            call.reject("key is required");
            return;
        }
        JSObject result = new JSObject();
        String stored = prefs().getString(key, null);
        if (stored == null) {
            result.put("value", JSObject.NULL);
            call.resolve(result);
            return;
        }
        try {
            result.put("value", decrypt(stored));
        } catch (Exception e) {
            // Unreadable (key rotated, restored from another device): drop it.
            prefs().edit().remove(key).apply();
            result.put("value", JSObject.NULL);
        }
        call.resolve(result);
    }

    @PluginMethod
    public void set(PluginCall call) {
        String key = call.getString("key");
        String value = call.getString("value");
        if (!validKey(key) || value == null) {
            call.reject("key and value are required");
            return;
        }
        try {
            prefs().edit().putString(key, encrypt(value)).apply();
            call.resolve();
        } catch (Exception e) {
            call.reject("secure storage write failed");
        }
    }

    @PluginMethod
    public void remove(PluginCall call) {
        String key = call.getString("key");
        if (!validKey(key)) {
            call.reject("key is required");
            return;
        }
        prefs().edit().remove(key).apply();
        call.resolve();
    }
}
