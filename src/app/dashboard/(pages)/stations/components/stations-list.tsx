"use client"

import React, { useEffect } from 'react'
import { StationCard } from './station-card'
import { Skeleton } from '@/components/ui/skeleton';
import { Station } from '@/lib/types';
import { getStations } from '../actions';
import { AlertTriangle } from 'lucide-react';

export default function StationsList() {
    const [stations, setStations] = React.useState<Station[]>([]);
    const [loading, setLoading] = React.useState<boolean>(true);

    useEffect(() => {
        async function fetchStations() {
            const data = await getStations();
            setStations(data)
            setLoading(false);
        }

        fetchStations()
    }, [])

    return (
        <>
            {loading ? (
                <StationsListSkeleton />
            ) : stations.length === 0 ? (
                <div className="flex flex-col items-center justify-center text-center py-40">
                    <AlertTriangle className="w-16 h-16 mb-4" />
                    <h2 className="text-2xl font-semibold mb-2">There are no stations yet!</h2>
                    <p className="text-gray-600">Try adding one to get started.</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                    {stations.map((station: Station) => (
                        <StationCard key={station.id} station={station} />
                    ))}
                </div>
            )}
        </>
    );
}

function StationsListSkeleton() {
    const stationCount = 6;

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {Array.from({ length: stationCount }).map((_, index) => {
                return (
                    <Skeleton key={index} className="w-full h-72" />
                )
            })}
        </div>
    )
}