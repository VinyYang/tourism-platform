import React, { useState, useEffect } from 'react';
import './TimeAxisInteractive.css';
import { Tooltip } from 'antd';
import { HistoryOutlined } from '@ant-design/icons';

interface TimeAxisOption {
    value: string;
    label: string;
    icon?: React.ReactNode;
    description: string;
}

interface TimeAxisProps {
    options: TimeAxisOption[];
    value?: string;
    onChange?: (value: string) => void;
    title?: string;
}

const TimeAxisInteractive: React.FC<TimeAxisProps> = ({ 
    options, 
    value, 
    onChange, 
    title = '华夏文明演进' 
}) => {
    const [selectedOption, setSelectedOption] = useState<string | undefined>(value);

    useEffect(() => {
        // 同步外部value和内部状态
        setSelectedOption(value);
    }, [value]);

    const handleNodeClick = (optionValue: string) => {
        setSelectedOption(optionValue);
        if (onChange) {
            onChange(optionValue);
        }
    };

    return (
        <div className="time-axis-container">
            <h3 className="axis-title">
                <HistoryOutlined /> {title}
            </h3>
            
            <div className="timeline-container">
                <div className="timeline">
                    {options.map((option) => (
                        <div
                            key={option.value}
                            className={`timeline-node ${selectedOption === option.value ? 'active' : ''}`}
                            onClick={() => handleNodeClick(option.value)}
                        >
                            <div className="node-connector top"></div>
                            <div className="node-label">
                                {option.icon || <HistoryOutlined />} {option.label}
                            </div>
                            <div className="node-content" aria-describedby={`tooltip-${option.value}`}>
                                {option.description}
                            </div>
                            <div className="node-connector bottom"></div>
                        </div>
                    ))}
                </div>
            </div>
            
            {selectedOption && options.find(opt => opt.value === selectedOption) && (
                <div className="selected-event-detail">
                    <h4>{options.find(opt => opt.value === selectedOption)?.label}</h4>
                    <p>{options.find(opt => opt.value === selectedOption)?.description}</p>
                </div>
            )}
        </div>
    );
};

export default TimeAxisInteractive; 