'use client';

import React from 'react';

interface DetailCardProps {
    title: string;
    subtitle?: string;
    meta?: string;
    extra?: React.ReactNode;
    active?: boolean;
    onClick?: () => void;
    icon?: React.ReactNode;
    tags?: string[];
}

export function DetailCard({ title, subtitle, meta, extra, active, onClick, icon, tags }: DetailCardProps) {
    return (
        <div
            className={`detail-card ${active ? 'detail-card--active' : ''}`}
            onClick={onClick}
        >
            <div className="detail-card__content">
                <div className="detail-card__header">
                    <div className="detail-card__title-row">
                        <div className="detail-card__title" title={title}>
                            {icon}
                            <span>{title}</span>
                        </div>
                        {meta && <div className="detail-card__meta">{meta}</div>}
                    </div>
                    {subtitle && <div className="detail-card__subtitle">{subtitle}</div>}
                </div>

                {(extra || (tags && tags.length > 0)) && (
                    <div className="detail-card__body">
                        {extra && <div className="detail-card__extra">{extra}</div>}
                        {tags && tags.length > 0 && (
                            <div className="detail-card__tags">
                                {tags.map((tag, i) => (
                                    <span key={i} className="detail-card__tag">{tag}</span>
                                ))}
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}

