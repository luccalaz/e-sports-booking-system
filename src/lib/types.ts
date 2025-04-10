export interface BookingData {
    type?: string;
    user_id?: string;
    start_timestamp?: Date;
    end_timestamp?: Date;
    duration?: number;
    name?: string;
    description?: string;
    station?: {
        id: string;
        name: string;
    };
}

export interface Station {
    id: string;
    name: string;
    img_url: string;
    status: string;
}

export interface User {
    id: string;
    first_name: string;
    last_name: string;
    nscc_id: string;
    role: string;
}

export interface Booking {
    id: string;
    user: User;
    start_timestamp: Date;
    end_timestamp: Date;
    duration: number;
    status: string;
    name?: string;
    description?: string;
    station?: Station;
}

export interface BookingActions {
    cancel?: boolean;
    end?: boolean;
    noshow?: boolean;
    approve?: boolean;
    deny?: boolean;
}
