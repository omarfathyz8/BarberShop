# Quick Start Guide

Get the Barbershop Management System running in 5 minutes.

## 1. Install Dependencies

```bash
npm install
```

## 2. Set Up Firebase

1. Go to [Firebase Console](https://firebase.google.com)
2. Create a new project
3. Enable Authentication (Email/Password)
4. Create a Realtime Database
5. Copy your credentials

## 3. Configure Environment

Copy `.env.example` to `.env.local` and fill in your Firebase credentials:

```bash
cp .env.example .env.local
```

Edit `.env.local`:
```
VITE_FIREBASE_API_KEY=xxxxxx
VITE_FIREBASE_AUTH_DOMAIN=project.firebaseapp.com
VITE_FIREBASE_DATABASE_URL=https://project.firebasedatabase.app
VITE_FIREBASE_PROJECT_ID=project-id
VITE_FIREBASE_STORAGE_BUCKET=project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=xxxxxx
VITE_FIREBASE_APP_ID=xxxxxx
```

## 4. Start Development Server

```bash
npm run dev
```

Visit `http://localhost:5173`

## 5. Create Test Accounts

**Register an account:**
- Email: `owner@test.com`
- Password: `password123`
- Role: Owner

Then create a worker and customer account similarly.

## 6. Firebase Security Rules (Critical!)

Set these rules in Firebase Console → Realtime Database → Rules:

```json
{
  "rules": {
    "users": {
      "$uid": {
        ".read": "$uid === auth.uid || root.child('users').child($uid).child('role').val() === 'owner'",
        ".write": "$uid === auth.uid || root.child('users').child($uid).child('role').val() === 'owner'"
      }
    },
    "workers": {
      ".read": true,
      "$workerId": {
        ".write": "root.child('users').child(auth.uid).child('role').val() === 'owner'"
      }
    },
    "services": {
      ".read": true,
      "$serviceId": {
        ".write": "root.child('users').child(auth.uid).child('role').val() === 'owner'"
      }
    },
    "appointments": {
      ".read": "auth != null",
      "$appointmentId": {
        ".write": "root.child('users').child(auth.uid).child('role').val() === 'owner' || root.child('appointments').child($appointmentId).child('customerId').val() === auth.uid || root.child('appointments').child($appointmentId).child('workerId').val() === auth.uid"
      }
    }
  }
}
```

## 7. Customize Branding

Edit `src/config/branding.ts`:

```typescript
export const branding = {
  shopName: 'Your Shop Name',
  tagline: 'Your tagline',
  logo: '✂️',
  colors: {
    primary: '#1f2937',
    secondary: '#6b7280',
    accent: '#3b82f6',
    // ... more colors
  },
};
```

## Available Scripts

```bash
# Start development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview

# Type check
npm run type-check
```

## Project Structure

```
src/
├── pages/          # Page components
├── components/     # Reusable components
├── config/         # Configuration
├── lib/            # Utilities & helpers
├── types/          # TypeScript types
├── hooks/          # Custom hooks
└── contexts/       # React contexts
```

## Common Tasks

### Add a New Page

1. Create file in `src/pages/NewPage.tsx`
2. Add route in `src/App.tsx`
3. Protect route if needed with `<ProtectedRoute>`

### Add a New Component

1. Create file in `src/components/`
2. Import and use in your pages

### Add Toast Notification

```typescript
import { useToast } from '../contexts/ToastContext';

const { showToast } = useToast();
showToast('Success!', 'success');
showToast('Error!', 'error');
```

### Query Firebase Data

```typescript
import { useFirebaseData } from '../hooks/useFirebase';

const { data: workers, loading } = useFirebaseData('workers');
```

## Troubleshooting

**Firebase not connecting?**
- Check `.env.local` credentials
- Verify Firebase project settings
- Check browser console for errors

**Styling not working?**
- Restart dev server
- Clear browser cache
- Check Tailwind CSS is imported

**Authentication failed?**
- Check Firebase Authentication is enabled
- Verify security rules
- Check user exists in Firebase

## Need Help?

1. Check [SETUP.md](./SETUP.md) for detailed setup
2. Review [IMPLEMENTATION.md](./IMPLEMENTATION.md) for feature roadmap
3. Check Firebase documentation: https://firebase.google.com/docs
4. Read React Router docs: https://reactrouter.com

## Next Steps

1. Complete the Owner Dashboard
2. Implement the booking flow
3. Build the worker dashboard
4. Add customer appointment management
5. Deploy to Vercel

**Happy building! 🎉**
