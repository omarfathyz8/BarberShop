import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  type User as FirebaseUser,
} from 'firebase/auth';
import { ref, set, get, update } from 'firebase/database';
import { auth, db } from '../config/firebase';
import type { UserRole, User } from '../types';

export async function registerUser(
  email: string,
  password: string,
  name: string,
  phone: string,
  role: UserRole
): Promise<User> {
  const credential = await createUserWithEmailAndPassword(auth, email, password);
  const user = credential.user;

  let userData: User = {
    id: user.uid,
    name,
    email,
    phone,
    role,
  };

  // If registering as a worker, check if they were pre-added by an owner
  if (role === 'worker') {
    try {
      const workerRecord = await findWorkerByEmailAcrossOwners(email);
      if (workerRecord) {
        // Update the existing worker record with the auth user ID and additional info
        const { ownerId, workerId, existingData } = workerRecord;
        const updatedWorkerData = {
          ...existingData,
          id: user.uid,
          name: name || existingData.name,
          phone: phone || existingData.phone,
          email,
        };
        await set(ref(db, `workers/${ownerId}/${workerId}`), updatedWorkerData);
        console.log('Linked worker account to pre-added worker record');
      }
    } catch (error) {
      console.error('Error checking for existing worker record:', error);
    }
  }

  // Store user data for authentication
  await set(ref(db, `users/${user.uid}`), userData);

  // If registering as owner, store as current shop
  if (role === 'owner') {
    localStorage.setItem('currentShopOwnerId', user.uid);
  }

  return userData;
}

async function findWorkerByEmailAcrossOwners(
  email: string
): Promise<{ ownerId: string; workerId: string; existingData: any } | null> {
  try {
    console.log('Finding worker by email across all owners:', email);

    // Try to read temporaryCredentials to find the ownerId
    const encodedEmail = encodeEmail(email);
    const tempCredRef = ref(db, `temporaryCredentials/${encodedEmail}`);
    const tempCredSnapshot = await get(tempCredRef);

    if (tempCredSnapshot.exists()) {
      const tempCred = tempCredSnapshot.val();
      const ownerId = tempCred.ownerId;
      const workerId = tempCred.workerId;

      // Now get the actual worker data
      const workerRef = ref(db, `workers/${ownerId}/${workerId}`);
      const workerSnapshot = await get(workerRef);

      if (workerSnapshot.exists()) {
        console.log('Found worker via temp credentials:', { email, workerId, ownerId });
        return {
          ownerId,
          workerId,
          existingData: workerSnapshot.val(),
        };
      }
    }

    return null;
  } catch (error) {
    console.error('Error searching for worker by email:', error);
    return null;
  }
}

function encodeEmail(email: string): string {
  return email.replace(/[.@]/g, '_');
}


export async function loginUser(email: string, password: string): Promise<FirebaseUser> {
  try {
    // Try normal login first
    const credential = await signInWithEmailAndPassword(auth, email, password);
    console.log('User logged in:', email);

    // For existing users, fetch their data and store relevant info
    const userData = await getUserData(credential.user.uid);
    console.log('User data from firebase:', userData);

    if (userData && userData.role === 'owner') {
      localStorage.setItem('ownerId', credential.user.uid);
      // Store as current shop for customers
      localStorage.setItem('currentShopOwnerId', credential.user.uid);
    } else if (userData && userData.role === 'worker') {
      // Worker data should be in the user record
      const workerUser = userData as any;
      if (workerUser.workerId && workerUser.ownerId) {
        localStorage.setItem('ownerId', workerUser.ownerId);
        localStorage.setItem('workerData', JSON.stringify({
          workerId: workerUser.workerId,
          ownerId: workerUser.ownerId,
        }));
        console.log('Loaded worker from user record:', { workerId: workerUser.workerId, ownerId: workerUser.ownerId });
      } else {
        // Fallback: find worker by email using temporary credentials
        console.log('No worker data in user record, searching by email');
        const workerRecord = await findWorkerByEmailAcrossOwners(email);
        if (workerRecord) {
          console.log('Found worker record:', workerRecord);
          const dataToStore = {
            workerId: workerRecord.workerId,
            ownerId: workerRecord.ownerId,
          };
          console.log('Storing in localStorage:', dataToStore);
          localStorage.setItem('ownerId', workerRecord.ownerId);
          localStorage.setItem('workerData', JSON.stringify(dataToStore));
          console.log('Stored successfully. Verification:', {
            storedOwnerId: localStorage.getItem('ownerId'),
            storedWorkerData: localStorage.getItem('workerData'),
          });

          // Update user record with worker info for future logins
          try {
            await set(ref(db, `users/${credential.user.uid}`), {
              id: credential.user.uid,
              email,
              role: 'worker',
              workerId: workerRecord.workerId,
              ownerId: workerRecord.ownerId,
            });
          } catch (e) {
            // Silently fail - worker can still login
          }
        }
      }
    } else {
      // If no role found, check if this email belongs to a worker
      console.log('No role found in user data, checking if worker exists');
      const workerRecord = await findWorkerByEmailAcrossOwners(email);
      if (workerRecord) {
        console.log('Found worker, creating user record');
        localStorage.setItem('ownerId', workerRecord.ownerId);
        localStorage.setItem('workerData', JSON.stringify({
          workerId: workerRecord.workerId,
          ownerId: workerRecord.ownerId,
        }));

        // Create user record
        try {
          await set(ref(db, `users/${credential.user.uid}`), {
            id: credential.user.uid,
            email,
            role: 'worker',
            workerId: workerRecord.workerId,
            ownerId: workerRecord.ownerId,
          });
        } catch (e) {
          console.error('Failed to create user record:', e);
        }
      }
    }

    return credential.user;
  } catch (error: any) {
    if (error.code === 'auth/user-not-found' || error.code === 'auth/invalid-credential') {
      try {
        const tempCredential = await verifyTemporaryCredentials(email, password);

        if (tempCredential && tempCredential.valid && tempCredential.ownerId && tempCredential.workerId) {
          const credential = await createUserWithEmailAndPassword(auth, email, password);
          const userId = credential.user.uid;

          localStorage.setItem('ownerId', tempCredential.ownerId);
          localStorage.setItem('workerData', JSON.stringify({
            workerId: tempCredential.workerId,
            ownerId: tempCredential.ownerId,
          }));
          localStorage.setItem('workerFirstLogin', 'true');

          try {
            await update(ref(db, `workers/${tempCredential.ownerId}/${tempCredential.workerId}`), { id: userId });
            // Also store worker info in the user record for easier lookup later
            await set(ref(db, `users/${userId}`), {
              id: userId,
              email,
              role: 'worker',
              workerId: tempCredential.workerId,
              ownerId: tempCredential.ownerId,
            });
          } catch (updateError) {
            // Don't fail here - the worker can still login
          }

          return credential.user;
        } else {
          throw new Error('Invalid email or password');
        }
      } catch (tempVerifyError) {
        throw new Error('Invalid email or password');
      }
    }
    throw error;
  }
}

async function verifyTemporaryCredentials(email: string, password: string): Promise<{ valid: boolean; ownerId?: string; workerId?: string } | null> {
  try {
    const encodedEmail = encodeEmail(email);
    console.log('Verifying temp credentials for:', { email, encodedEmail });
    const credRef = ref(db, `temporaryCredentials/${encodedEmail}`);
    const snapshot = await get(credRef);

    if (!snapshot.exists()) {
      console.log('No temp credentials found for email:', email);
      return null;
    }

    const cred = snapshot.val();
    console.log('Found temp credentials:', { email: cred.email, workerId: cred.workerId, ownerId: cred.ownerId });

    // Check if credentials are still valid (not expired)
    if (cred.expiresAt && cred.expiresAt < Date.now()) {
      return { valid: false };
    }

    // Verify password matches
    const passwordMatches = cred.tempPassword === password;

    if (passwordMatches) {
      console.log('Password matched, returning:', { ownerId: cred.ownerId, workerId: cred.workerId });
      return {
        valid: true,
        ownerId: cred.ownerId,
        workerId: cred.workerId,
      };
    }

    return { valid: false };
  } catch (error) {
    console.error('Error verifying temporary credentials:', error);
    return null;
  }
}

export async function logoutUser(): Promise<void> {
  await signOut(auth);
}

export async function getUserData(userId: string): Promise<User | null> {
  try {
    // Try to get from users collection (for owners and customers)
    const userSnapshot = await get(ref(db, `users/${userId}`));
    if (userSnapshot.exists()) {
      return userSnapshot.val();
    }

    // If not in users collection, this might be a worker that hasn't logged in yet
    // Return a minimal user object with role 'worker' so they can access their dashboard
    // The actual worker details will be fetched when needed from the workers collection
    return {
      id: userId,
      name: '',
      email: '',
      phone: '',
      role: 'worker',
    };
  } catch (error) {
    console.error('Error fetching user data:', error);
    return null;
  }
}

export async function getUserRole(userId: string): Promise<UserRole | null> {
  const user = await getUserData(userId);
  return user?.role || null;
}
