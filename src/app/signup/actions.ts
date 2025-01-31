"use server"

import { capitalizeFirstLetter } from "@/lib/utils"
import { signupformSchema } from "@/utils/formSchemas"
import { createClient } from "@/utils/supabase/server"

export async function signup(clientData: unknown) {
  // server validation
  const result = signupformSchema.safeParse(clientData);
  
  if (!result.success) {
    return result.error.issues[0].message;
  }
  
  const formData = result.data;
  
  // check if user already exists
  const supabase = await createClient();
  const { data } = await supabase.from('profiles').select().eq("nscc_id", formData.schoolID.toUpperCase());

  if (data && data.length > 0) {
    return "User already exists. Please log in.";
  }

  // try sign up
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
    return "An unexpected error has occured.";
  }
}