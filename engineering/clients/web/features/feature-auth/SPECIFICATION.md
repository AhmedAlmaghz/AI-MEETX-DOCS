# Web Auth UI Specifications

Document ID: WEB-AUTH-SPEC-001
Version: 1.0.0
Status: Approved

---

# 1. Routing Model

- `/login` - Renders LoginScreen.
- `/register` - Renders RegisterScreen.
- `/guest-entry` - Renders GuestEntryScreen.

---

# 2. Hooks Consumed

Imports from `meetx-platform-sdk/hooks`:
- `useLoginMutation()`: Triggers email authentication and returns user payload + auth token.
- `useRegisterMutation()`: Creates new account.
- `useGuestLoginMutation()`: Strains guest token payload.

---

# 3. State Management (Zustand)

Store: `useAuthStore`
```typescript
interface AuthState {
  token: string | null;
  user: UserProfile | null;
  isLoading: boolean;
  setAuth: (token: string, user: UserProfile) => void;
  clearAuth: () => void;
}
```

---

# 4. Form Validation (Zod)

Login Form Schema:
```typescript
const loginSchema = z.object({
  email: z.string().email("Invalid email format"),
  password: z.string().min(8, "Password must be at least 8 characters")
});
```
