import { createClient } from "@/utils/supabase/server";
import LogoutButton from "@/components/logout-button";

export default async function Home() {

  const supabase = await createClient();

  const { data } = await supabase.auth.getUser();

  return (
    <>
      Logged in! User info: 
      <pre>{JSON.stringify(data.user, null, 2)}</pre>
      <LogoutButton/>
    </>
  );
}
