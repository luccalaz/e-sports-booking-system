import { ReactNode } from 'react';

interface FlowCardProps {
    children?: ReactNode;
    img?: string;
}

export default function FlowCard({ children, img }: FlowCardProps) {
    return (
        <div className="border rounded-lg overflow-hidden flex min-w-[955px]">
            {img && <div className='w-1/2 bg-cover bg-center' style={{ backgroundImage: `url(${img})` }}></div>}
            <div className={`p-7 ${img ? 'w-1/2' : 'w-full'}`}>
                {children}
            </div>
        </div>
    )
}
