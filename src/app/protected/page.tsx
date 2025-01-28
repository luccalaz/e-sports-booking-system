import { createClient } from '@/utils/supabase/server';
import { redirect } from 'next/navigation';
import React from 'react';

const ProtectedPage = async () => {
    // Fetch data or perform server-side logic here
    const supabase = await createClient()

    const { data, error } = await supabase.auth.getUser()
    if (error || !data?.user) {
        redirect('/auth/login')
    }

    const user = data.user;

    return (
        <div>
            <h1>Protected Page</h1>
            <p>This is a protected page. Only authorized users can access this content.</p>
            <h2>Logged in as: {user.email}</h2>
        </div>
    );
};

export default ProtectedPage;