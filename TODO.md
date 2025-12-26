# TODO: Implement Create Account Feature

## Frontend Changes
- [x] Add 'settings' tab to managerDashboard.jsx tabs array
- [x] Add settings tab content with form for email, role, cuisine
- [x] Add state for new account form
- [x] Add submit handler to call backend API

## Backend Changes
- [x] Set up Supabase admin client in backend/index.js
- [x] Create /create-user POST endpoint
- [x] In endpoint, create user with Supabase admin API
- [x] Insert into profiles table
- [x] Handle errors and return response

## Testing
- [ ] Test the form submission
- [ ] Verify user creation and profile insertion
