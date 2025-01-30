'use server'

import { createClient } from '@/utils/supabase/server'
import { LoginFormData } from '@/utils/types'

export async function login(formData: LoginFormData) {
  const supabase = await createClient();

  // type-casting here for convenience
  // in practice, you should validate your inputs

  const { data } = await supabase.from('profiles').select().eq("nscc_id", formData.schoolID.toUpperCase());

  if (!data || data.length == 0) {
    return "User doesn't exist. Please sign up.";
  }

  const { error } = await supabase.auth.signInWithOtp({
    email: formData.schoolID + '@nscc.ca',
    options: {
      shouldCreateUser: false,
    }
  });

  if (error) {
    return "An unexpected error has occured.";
  }
}