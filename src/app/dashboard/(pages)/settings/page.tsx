import React from 'react'

export default function Settings() {
    return (
        <div className="flex flex-col gap-6">
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight">Settings</h1>
                    <p className="text-muted-foreground">Manage global availability settings for the E-Sports Lounge booking system.</p>
                </div>
            </div>
        </div >
    )
}
