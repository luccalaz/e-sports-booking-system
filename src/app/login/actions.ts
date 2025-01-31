'use server'

import { loginformSchema } from '@/utils/formSchemas';
import { createClient } from '@/utils/supabase/server'

export async function login(clientData: unknown) {
  // server validation
  const result = loginformSchema.safeParse(clientData);

  if (!result.success) {
    return {
      code: 'VALIDATION_ERROR',
      message: result.error.issues[0].message
    };
  }

  const formData = result.data;

  // check if user exists
  const supabase = await createClient();
  const { data } = await supabase.from('profiles').select().eq("nscc_id", formData.schoolID.toUpperCase());

  if (!data || data.length == 0) {
    return {
      code: 'USER_NOT_FOUND',
      message: "User doesn't exist. Please sign up."
    };
  }

  // try login
  const { error } = await supabase.auth.signInWithOtp({
    email: formData.schoolID + '@nscc.ca',
    options: {
      shouldCreateUser: false,
    }
  });

  // error if any
  if (error) {
    console.error(error);
    return {
      code: 'AUTH_ERROR',
      message: "An unexpected error has occurred."
    };
  }

  return { success: true };
}