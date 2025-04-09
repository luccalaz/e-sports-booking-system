import React from 'react'
import BookingsHeader from './components/header'
import BookingsDataTable from './components/table'

export default function Bookings() {

    return (
        <div className="flex flex-col gap-6">
            <BookingsHeader />
            <BookingsDataTable />
        </div >
    )
}
