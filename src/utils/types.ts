export interface SignupFormData {
    firstName: string;
    lastName: string;
    schoolID: string;
}

export interface OtpFormData {
    otp: string;
}

export interface LoginFormData {
    schoolID: string;
}

export interface BookingFlowProps {
    bookingData: BookingData,
    setBookingData: React.Dispatch<React.SetStateAction<BookingData>>,
    currentStep: number,
    nextStep: () => void,
    prevStep: () => void
}

export interface BookingFlowStepProps {
    bookingData: BookingData,
    setBookingData: React.Dispatch<React.SetStateAction<BookingData>>,
    nextStep: () => void,
    prevStep: () => void
}

export interface BookingData {
    userId: string,
    stationId?: string,
    type: string,
    datetime: Date,
    duration: number,
    name?: string,
    description?: string,
    status: string
}

export interface Station {
    id: string,
    name: string,
    status: string,
    imgUrl: string
}