export interface BookingData {
    userId?: string,
    stationId?: string,
    type?: string,
    start_timestamp?: Date,
    end_timestamp?: Date,
    name?: string,
    description?: string,
    status?: string
}

export interface Station {
    id: string,
    name: string,
    availability: JSON,
    img: string
}

export interface Booking {
    start_timestamp: Date,
    end_timestamp: Date,
    station_id: string,
}