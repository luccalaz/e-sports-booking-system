'use server'

import { createClient } from '@/utils/supabase/server'
import { LoginFormData } from '@/utils/types'

export async function login(formData: LoginFormData) {
  const supabase = await createClient();

  // type-casting here for convenience
  // in practice, you should validate your inputs

  const { data: dbData } = await supabase.from('profiles').select().eq("nscc_id", formData.schoolID.toUpperCase());

  if (!dbData || dbData.length == 0) {
    return new Error("User doesn't exist. Please sign up.");
  }

  const { data, error } = await supabase.auth.signInWithOtp({
    email: formData.schoolID + '@nscc.ca',
    options: {
      shouldCreateUser: false,
    }
  });

  if (error) {
    return error;
  }

  return data;
}