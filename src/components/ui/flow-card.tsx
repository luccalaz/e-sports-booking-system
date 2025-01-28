import { ReactNode } from 'react';

interface FlowCardProps {
    children?: ReactNode;
    img?: string;
}

export default function FlowCard({ children, img }: FlowCardProps) {
    return (
        <div className="border rounded-lg overflow-hidden flex min-w-[955px] min-h-[421px]">
            {img && <div className='flex-1 bg-cover bg-center' style={{ backgroundImage: `url(${img})` }}></div>}
            <div className='p-7 flex-1'>
                {children}
            </div>
        </div>
    )
}
