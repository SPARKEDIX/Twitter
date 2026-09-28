/// <reference types="vite/client" />

/**
 * Typed access to the Vite env contract.
 *
 * Every value is optional at the type level because Vite statically replaces
 * `import.meta.env.X` and cannot prove the key exists. `src/lib/firebase.ts`
 * performs the actual runtime validation and throws a readable error, which is
 * why the fields are `string | undefined` rather than `string`.
 */
interface ImportMetaEnv {
  readonly VITE_FIREBASE_API_KEY?: string;
  readonly VITE_FIREBASE_AUTH_DOMAIN?: string;
  readonly VITE_FIREBASE_PROJECT_ID?: string;
  readonly VITE_FIREBASE_STORAGE_BUCKET?: string;
  readonly VITE_FIREBASE_MESSAGING_SENDER_ID?: string;
  readonly VITE_FIREBASE_APP_ID?: string;
  readonly VITE_FIREBASE_MEASUREMENT_ID?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
