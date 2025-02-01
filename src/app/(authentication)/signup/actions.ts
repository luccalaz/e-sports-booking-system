"use server"

import { capitalizeFirstLetter } from "@/lib/utils"
import { signupformSchema } from "@/utils/formSchemas"
import { createClient } from "@/utils/supabase/server"

export async function signup(clientData: unknown) {
  // server validation
  const result = signupformSchema.safeParse(clientData);

  if (!result.success) {
    return {
      code: 'VALIDATION_ERROR',
      message: result.error.issues[0].message
    };
  }

  const formData = result.data;
  
  // try sign up
  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithOtp({
    email: formData.schoolID + "@nscc.ca",
    options: {
      data: {
        first_name: capitalizeFirstLetter(formData.firstName),
        last_name: capitalizeFirstLetter(formData.lastName),
        nscc_id: formData.schoolID.toUpperCase(),
      },
    }
  })

  // error if any
  if (error) {
    console.error(error);
    return {
      code: 'AUTH_ERROR',
      message: "An unexpected error has occurred."
    };
  }
}