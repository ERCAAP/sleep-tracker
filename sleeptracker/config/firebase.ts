
// Temporary dummy auth object to bypass Firebase issues
const dummyAuth = {
  currentUser: null,
  onAuthStateChanged: (callback: (user: any) => void) => {
    // Return a dummy user for now
    setTimeout(() => callback(null), 100);
    return () => {}; // unsubscribe function
  },
  signInWithEmailAndPassword: async (email: string, password: string) => {
    console.log('Dummy sign in:', email);
    return { user: { email, uid: 'dummy-uid' } };
  },
  createUserWithEmailAndPassword: async (email: string, password: string) => {
    console.log('Dummy sign up:', email);
    return { user: { email, uid: 'dummy-uid' } };
  },
  signOut: async () => {
    console.log('Dummy sign out');
  },
  sendPasswordResetEmail: async (email: string) => {
    console.log('Dummy password reset:', email);
  }
};

// Dummy db object
const dummyDb = {
  collection: () => ({
    add: async (data: any) => console.log('Dummy add:', data),
    doc: () => ({
      set: async (data: any) => console.log('Dummy set:', data),
      get: async () => ({ exists: false, data: () => null })
    })
  })
};

// Export dummy objects
export const auth = dummyAuth;
export const db = dummyDb;
export const functions = null;

const dummyApp = { name: '[DEFAULT]', options: {} };
export default dummyApp; 