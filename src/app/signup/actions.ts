"use server"

import { capitalizeFirstLetter } from "@/lib/utils"
import { createClient } from "@/utils/supabase/server"
import { SignupFormData } from "@/utils/types"

export async function signup(formData: SignupFormData) {
  const supabase = await createClient()

  // type-casting here for convenience
  // in practice, you should validate your inputs

  const { data } = await supabase.from('profiles').select().eq("nscc_id", formData.schoolID.toUpperCase());

  if (data && data.length > 0) {
    return "User already exists. Please log in.";
  }

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

  if (error) {
    return "An unexpected error has occured.";
  }
}