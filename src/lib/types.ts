export interface BookingData {
    userId?: string,
    stationId?: string,
    stationName?: string,
    type?: string,
    start_timestamp?: Date,
    end_timestamp?: Date,
    duration?: number,
    name?: string,
    description?: string,
    status?: string
}

export interface Station {
    id: string,
    name: string,
    img_url: string
}

export interface Booking {
    id: string,
    user_id: string,
    start_timestamp: Date,
    end_timestamp: Date,
    status: string,
    name?: string,
    description?: string
    station?: {
        id: string
        name: string;
        img_url: string;
    }
}

export interface LoungeBooking extends Booking {
    name: string,
    description: string
}

export interface StationBooking extends Booking {
    station: {
        id: string
        name: string;
        img_url: string;
    }
}

export interface UserBooking extends Booking {
    duration: number,
    display: { status: string, badge: string, date_status: "upcoming" | "past" },
}