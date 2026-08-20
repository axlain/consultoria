-- Add optional phone column to user_business_roles.
ALTER TABLE user_business_roles
  ADD COLUMN IF NOT EXISTS phone text;
