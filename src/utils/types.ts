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

export interface StationBookingFlowProps {
    bookingData: BookingData,
    setBookingData: React.Dispatch<React.SetStateAction<BookingData>>,
    setImage: React.Dispatch<React.SetStateAction<string>>,
    currentStep: number,
    nextStep: () => void,
    prevStep: () => void
}

export interface LoungeBookingFlowProps {
    bookingData: BookingData,
    setBookingData: React.Dispatch<React.SetStateAction<BookingData>>,
    currentStep: number,
    nextStep: () => void,
    prevStep: () => void
}

export interface StationBookingFlowStepProps {
    bookingData: BookingData,
    setBookingData: React.Dispatch<React.SetStateAction<BookingData>>,
    setImage: React.Dispatch<React.SetStateAction<string>>,
    nextStep: () => void,
    prevStep: () => void
}

export interface LoungeBookingFlowStepProps {
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
    img: string
}