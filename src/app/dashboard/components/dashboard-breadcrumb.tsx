"use client"

import React from 'react'
import {
    Breadcrumb,
    BreadcrumbItem,
    BreadcrumbLink,
    BreadcrumbList,
    BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"
import { usePathname } from 'next/navigation'
import Link from 'next/link';

export default function AppBreadcrumb() {
    const route = usePathname();

    const pathSections = route.split("/").filter((section) => section !== "");
    const breadcrumbItems = pathSections.map((section, index) => {
        return {
            name: section.charAt(0).toUpperCase() + section.slice(1),
            path: "/" + pathSections.slice(0, index + 1).join('/')
        }
    })


    return (
        <Breadcrumb>
            <BreadcrumbList>
                {breadcrumbItems.map((item, index) => (
                    <React.Fragment key={index}>
                        <BreadcrumbItem>
                            <BreadcrumbLink asChild>
                                <Link href={item.path}>
                                    {item.name}
                                </Link>
                            </BreadcrumbLink>
                        </BreadcrumbItem>
                        {index < breadcrumbItems.length - 1 && <BreadcrumbSeparator />}
                    </React.Fragment>
                ))}
            </BreadcrumbList>
        </Breadcrumb>
    )
}
