"use server"

import { capitalizeFirstLetter, genPass } from "@/lib/utils"
import { createClient } from "@/utils/supabase/server"
import { SignupFormData } from "@/utils/types"

export async function signup(formData: SignupFormData) {
  const supabase = await createClient()

  // type-casting here for convenience
  // in practice, you should validate your inputs

  const { data: dbData } = await supabase.from('profiles').select().eq("nscc_id", formData.schoolID.toUpperCase());

  if (dbData && dbData.length > 0) {
    return new Error("User already exists. Please log in.");
  }

  const { data, error } = await supabase.auth.signInWithOtp({
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
    return error;
  }

  return data;
}