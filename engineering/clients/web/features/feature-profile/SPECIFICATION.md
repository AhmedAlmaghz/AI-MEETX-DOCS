# Web Profile UI Specifications

Document ID: WEB-PROFILE-SPEC-001
Version: 1.0.0
Status: Approved

---

# 1. Routing Model

- `/dashboard/profile` - Profile display and settings dashboard page.

---

# 2. Hooks Consumed

Imports from `meetx-platform-sdk/hooks`:
- `useUserProfile()`: Query hook returning current active profile settings.
- `useUpdateProfileMutation()`: Mutation hook to push profile updates.
- `useUploadAvatarMutation()`: Pushes raw image files to storage buckets.

---

# 3. Avatar Upload Rules

- Supported formats: PNG, JPG, WEBP.
- Size limit: 2MB.
- Processing: client-side image compression must occur before uploading to Firebase storage.
