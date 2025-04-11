"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { createClient } from "@/utils/supabase/client";

type User = {
    id: string;
    first_name: string;
    last_name: string;
    nscc_id: string;
    role: string;
};

type AuthContextType = {
    user: User | null;
    loading: boolean;
    error: string | null;
};

const AuthContext = createContext<AuthContextType>({
    user: null,
    loading: true,
    error: null,
});

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
    const supabase = createClient();
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchUser = async () => {
            setLoading(true);
            setError(null);
            try {
                const {
                    data: { user },
                    error: userError,
                } = await supabase.auth.getUser();

                if (userError) throw userError;

                const { data, error: profileError } = await supabase
                    .from("profiles")
                    .select("*")
                    .eq("id", user?.id)
                    .single();

                if (profileError) throw profileError;

                setUser(data);
            } catch (err: unknown) {
                const errorMsg = err instanceof Error ? err.message : "Unknown error";
                console.error("Failed to fetch user profile:", errorMsg);
                setError(errorMsg);
            } finally {
                setLoading(false);
            }
        };

        fetchUser();
    }, [supabase]);

    return (
        <AuthContext.Provider value={{ user, loading, error }}>
            {children}
        </AuthContext.Provider>
    );
};
